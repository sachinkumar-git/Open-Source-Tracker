const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey && apiKey.startsWith('SG.')) {
    sgMail.setApiKey(apiKey);
} else {
    console.error('CRITICAL: SENDGRID_API_KEY is missing or invalid in .env (Must start with SG.)');
}

/**
 * Sends an OTP email to the user.
 * @param {string} to - Recipient email.
 * @param {string} otp - The 6-digit OTP code.
 */
const sendOtpEmail = async (to, otp) => {
    const msg = {
        to,
        from: process.env.EMAIL_FROM || 'noreply@ostrackr.io',
        subject: 'Your OSTrackr Verification Code',
        text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #030306; color: #f8fafc;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <div style="display: inline-block; width: 48px; height: 48px; background-color: #10b981; border-radius: 10px; color: white; font-weight: 900; line-height: 48px; font-size: 20px;">OS</div>
                    <h1 style="color: #ffffff; margin-top: 15px; font-size: 24px;">Verification Code</h1>
                </div>
                <div style="background-color: #0f172a; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid rgba(255,255,255,0.05);">
                    <p style="color: #94a3b8; font-size: 16px; margin-bottom: 20px;">Use the following code to sign in or complete your registration:</p>
                    <div style="font-size: 36px; font-weight: 800; color: #34d399; letter-spacing: 10px; margin: 20px 0;">${otp}</div>
                    <p style="color: #64748b; font-size: 12px;">This code expires in 5 minutes. If you did not request this, please ignore this email.</p>
                </div>
                <div style="text-align: center; margin-top: 30px; color: #475569; font-size: 12px;">
                    © 2026 OSTrackr. Precision Contribution Tracking.
                </div>
            </div>
        `,
    };

    try {
        console.log(`Attempting to send OTP email from: ${msg.from} to: ${to}`);
        await sgMail.send(msg);
        console.log(`OTP sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('SendGrid Error Status:', error.code || 'No Code');
        if (error.response) {
            console.error('SendGrid Response Body:', JSON.stringify(error.response.body, null, 2));
        } else {
            console.error('Error Details:', error.message);
        }
        return false;
    }
};

module.exports = { sendOtpEmail };
