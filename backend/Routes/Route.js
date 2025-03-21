const express = require('express');
const { indexEmail, searchEmails } = require('../controller/controller'); 
const pool = require('../config/db'); 
const { generateReply, categorizeEmail } = require('../config/nlp');
const { sendSlackNotification } = require('../Controller/notifications.js');
const { sendWebhookNotification } = require('../Controller/webhook.js'); 

const router = express.Router();

router.post('/index', indexEmail);
router.get('/search', searchEmails);

router.get('/:id', async (req, res) => {
  try {
    const emailId = req.params.id;
    const [rows] = await pool.query("SELECT * FROM emails WHERE id = ?", [emailId]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Email not found" });
    }

    res.json(rows[0]); 
  } catch (error) {
    console.error(" Error fetching email by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get('/', async (req, res) => {
  try {
    console.log("Query param category:", req.query.category);

    let sql = "SELECT * FROM emails WHERE truncated = FALSE";
    const params = [];
    if (req.query.category) {
      sql += " AND category = ?";
      params.push(req.query.category);
    }

    sql += " ORDER BY received_at DESC";

    console.log("Executing SQL:", sql, params);

    const [rows] = await pool.query(sql, params);

    console.log("Rows found:", rows.length);

    res.json(rows);
  } catch (error) {
    console.error("Error fetching emails:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post('/generate-reply', async (req, res) => {
  try {
    const { text } = req.body;
    const reply = await generateReply(text);
    res.json({ suggested_reply: reply });
  } catch (error) {
    console.error(" AI Reply Error:", error);
    res.status(500).json({ message: "Error generating AI reply", error });
  }
});

router.post('/categorize', async (req, res) => {
  try {
    const { text } = req.body; 
    const category = await categorizeEmail(text);
    return res.json({ category });
  } catch (error) {
    console.error("AI Categorization Error:", error);
    return res.status(500).json({ message: "Error categorizing email", error });
  }
});


router.post('/categorize-and-store', async (req, res) => {
  try {
      const { emailId } = req.body;
      console.log("Email ID received for categorization:", emailId);

      if (!emailId) {
          return res.status(400).json({ message: "Missing emailId in request body" });
      }

      const [rows] = await pool.query("SELECT * FROM emails WHERE id = ?", [emailId]);
      if (!rows.length) {
          console.log(" No email found with ID:", emailId);
          return res.status(404).json({ message: "Email not found" });
      }

      const email = rows[0];
      console.log(" Email body for categorization:", email.body);

      
      const category = await categorizeEmail(email.body);
      console.log(" AI Predicted Category:", category);

      if (!category) {
          throw new Error("AI categorization failed. No category returned.");
      }

      await pool.query("UPDATE emails SET category = ? WHERE id = ?", [category, emailId]);

  
      if (category === "Interested") {
          await sendSlackNotification(`New Interested Email:\n Subject: ${email.subject}\n👤 From: ${email.sender}`);
          await sendWebhookNotification(email);
      }

      return res.json({ emailId, category });
  } catch (error) {
      console.error(" AI Categorization Error:", error);
      return res.status(500).json({ message: "Error categorizing email", error: error.message });
  }
});


router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT DISTINCT category
      FROM emails
      WHERE category IS NOT NULL
      ORDER BY category
    `);
    const categories = rows.map(row => row.category);
    res.json({ categories });
  } catch (error) {
    console.error(" Error fetching distinct categories:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;
