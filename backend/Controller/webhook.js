require("dotenv").config();

const axios = require("axios");

async function sendWebhookNotification(email) {
    try {
        // const WEBHOOK_URL = "https://webhook.site/your-webhook-url";
        const WEBHOOK_URL = process.env.WEBHOOK_URL; 

        await axios.post(WEBHOOK_URL, {
            message: "New Interested Email",
            subject: email.subject,
            sender: email.sender,
            receivedAt: email.received_at,
        });
        console.log("Wbhook sent successfully");
    } catch (error) {
        console.error("Error sending webhook:", error);
    }
}

module.exports = { sendWebhookNotification }