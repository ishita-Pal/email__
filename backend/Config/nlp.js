require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateReply = async (emailText) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    You are an AI email assistant. Generate a **polite and professional** reply to the following email.
    Do NOT summarize the email. Instead, respond as if you were the recipient.
    ${emailText}
  
    Your reply should be **concise** but **relevant** to the email content.
    If it's a job offer, politely accept or ask for more details.
    If it's a question, answer it professionally.
    If it's a promotional email, respond appropriately (e.g., thanking or declining).
    DO NOT include disclaimers or meta-information in the reply.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reply = response.text().trim(); 

    console.log("🔹 Suggested AI Reply:", reply);
    return reply;
  } catch (error) {
    console.error(" AI Reply Generation Error:", error);
    return `Error generating AI reply: ${error.message}`;
  }
};
const categorizeEmail = async (emailText) => {
  try {
      
      await new Promise(resolve => setTimeout(resolve, 1000));

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
      You are an AI email classifier. 
      Classify the following email text into exactly one of these categories:
      - Interested
      - Meeting Booked
      - Not Interested
      - Spam
      - Out of Office

      Only return the single category name (e.g., "Interested").
      If uncertain, pick the most likely category.

      --- EMAIL TEXT START ---
      ${emailText}
      --- EMAIL TEXT END ---
      `;

      const result = await model.generateContent(prompt);

      if (!result || !result.response) {
          throw new Error(" No response from AI model.");
      }

      const response = await result.response;
      const classification = response.text().trim();

      if (!classification) {
          throw new Error("AI model returned empty classification.");
      }

      console.log("🔹 AI Categorization Result:", classification);
      return classification;
  } catch (error) {
      console.error("AI Categorization Error:", error);

      // If 429 error occurs, wait and retry
      if (error.status === 429) {
          console.log(" Retrying after 10 seconds...");
          await new Promise(resolve => setTimeout(resolve, 10000));
          return categorizeEmail(emailText); 
      }

      return "Unknown"; 
  }
};

module.exports = {
  generateReply,
  categorizeEmail,
};
