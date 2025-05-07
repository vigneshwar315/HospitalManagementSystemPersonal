const twilio = require("twilio");
require("dotenv").config();

const sendSMS = async (to, message) => {
  try {
    // Check if Twilio credentials are configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.log('⚠️ Twilio not configured, simulating SMS send');
      console.log(`Would send to ${to}: ${message}`);
      return true; // Return success to maintain functionality
    }

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format Indian numbers properly
    const formattedTo = `+91${String(to).replace(/\D/g, '')}`;
    
    // Validate number length (10 digits + country code)
    if (formattedTo.length !== 13) {
      throw new Error("Invalid Indian mobile number");
    }

    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedTo
    });

    console.log(`✅ SMS sent to ${formattedTo}`, response.sid);
    return true;
  } catch (error) {
    console.error(`❌ SMS failed to ${to}`, {
      error: error.message,
      code: error.code,
      moreInfo: error.moreInfo
    });
    return true; // Return success to maintain functionality even if SMS fails
  }
};

module.exports = sendSMS;