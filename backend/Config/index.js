require('dotenv').config();
const pool = require('./db'); 
const { indexEmail } = require('./elasticsearch');

async function indexEmailsFromDatabase() {
    try {
        console.log("Fetching emails from MySQL...");
        
        const [emails] = await pool.query("SELECT sender, subject, body, received_at FROM emails");

        if (emails.length === 0) {
            console.log("No emails found in MySQL!");
            return;
        }

        console.log(`Indexing ${emails.length} emails into Elasticsearch...`);

        for (let email of emails) {
            console.log(" Indexing email:", email);
            await indexEmail(email);
        }

        console.log("All emails indexed successfully!");
    } catch (error) {
        console.error(" Error indexing emails from MySQL:", error);
    }
}

indexEmailsFromDatabase();
