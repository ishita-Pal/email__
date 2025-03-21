require('dotenv').config({ path: __dirname + '/../.env' });


const Imap = require('imap-simple');
const { simpleParser } = require('mailparser');
const { convert } = require('html-to-text');
const entities = require('entities');
const db = require('../config/db');
const moment = require('moment');
const { categorizeEmail } = require('../config/nlp');

const MAX_BODY_LENGTH = 5000; 

const imapConfig = {
  imap: {
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASS,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
    authTimeout: 10000,
    keepalive: true,
  }
};

async function extractEmailBody(emailBody) {
  if (!emailBody) return { cleanText: "(No Content)", isTruncated: false };

  let cleanText = convert(emailBody, {
    wordwrap: false,
    selectors: [
      { selector: 'img', format: 'skip' },
      { selector: 'script', format: 'skip' },
      { selector: 'style', format: 'skip' },
      { selector: 'head', format: 'skip' },
      { selector: 'link', format: 'skip' },
    ],
  });

  cleanText = entities.decodeHTML(cleanText);
  cleanText = cleanText.replace(/=\r?\n/g, '');
  cleanText = cleanText.replace(/=([A-Fa-f0-9]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  });
  cleanText = cleanText.replace(/\s+/g, ' ').trim();

  let isTruncated = false;
  if (cleanText.length > MAX_BODY_LENGTH) {
    console.warn("Email body too long, skipping...");
    isTruncated = true;
  }

  return { cleanText, isTruncated };
}

async function connectIMAP() {
  try {
    console.log(" Connecting to IMAP...");
    const connection = await Imap.connect(imapConfig);
    await connection.openBox('INBOX');
    console.log(" Connected to IMAP and INBOX opened.");

    const sinceDate = moment().subtract(30, 'days').format('DD-MMM-YYYY').toUpperCase();
    console.log(` Searching emails SINCE: ${sinceDate}`);

    const searchCriteria = [['SINCE', sinceDate]];
    const fetchOptions = { bodies: ['HEADER.FIELDS (FROM SUBJECT DATE)', 'TEXT'], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    console.log(` Found ${messages.length} emails.`);

    for (const item of messages) {
      try {
        const headerPart = item.parts.find(part => part.which.startsWith('HEADER.FIELDS'));
        const headerText = headerPart ? headerPart.body : {};

        const sender = headerText.from ? headerText.from[0] : "(Unknown Sender)";
        const subject = headerText.subject ? headerText.subject[0] : "(No Subject)";
        const receivedAt = headerText.date ? new Date(headerText.date[0]) : new Date();

        const all = item.parts.find(part => part.which === 'TEXT');
        let body = "(No Content)";
        let isTruncated = false;

        if (all) {
          const parsed = await simpleParser(all.body);
          const bodyContent = parsed.html || parsed.text || "(No Content)";
          const result = await extractEmailBody(bodyContent);
          body = result.cleanText;
          isTruncated = result.isTruncated;
        }

        console.log(`Processing Email: ${subject} from ${sender}`);

     
        if (isTruncated) {
          console.warn("Skipping truncated email.");
          continue;
        }

        
        const checkQuery = `SELECT id FROM emails WHERE sender = ? AND subject = ? AND received_at = ?`;
        const [existing] = await db.query(checkQuery, [sender, subject, receivedAt]);

        if (existing.length > 0) {
          console.warn("Duplicate email detected, skipping.");
          continue;
        }
        const insertQuery = `
          INSERT INTO emails (sender, subject, body, received_at, truncated) 
          VALUES (?, ?, ?, ?, ?)
        `;
        const [insertResult] = await db.query(insertQuery, [sender, subject, body, receivedAt, 0]);

        console.log("Email stored in database with ID:", insertResult.insertId);

        
        const category = await categorizeEmail(body);
        console.log(" AI predicted category:", category);

        const updateQuery = `
          UPDATE emails SET category = ? WHERE id = ?
        `;
        await db.query(updateQuery, [category, insertResult.insertId]);

      } catch (err) {
        console.error("⚠️ Error processing an email:", err);
      }
    }
  } catch (error) {
    console.error("IMAP Sync Error:", error);
  }
}


connectIMAP();
