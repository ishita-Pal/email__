const axios = require("axios");

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL; // Ensure this exists in .env

async function sendSlackNotification(message) {
    if (!SLACK_WEBHOOK_URL) {
        console.error(" Slack Webhook URL is missing in .env!");
        return;
    }

    try {
        const response = await axios.post(SLACK_WEBHOOK_URL, {
            text: message
        });

        console.log("Slack notification sent successfully:", response.data);
    } catch (error) {
        console.error(" Slack Notification Error:", error.response?.data || error.message);
    }
}

module.exports = { sendSlackNotification };
