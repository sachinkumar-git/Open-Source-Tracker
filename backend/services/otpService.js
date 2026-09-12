const supabase = require('../config/supabaseClient');

/**
 * Generates a 6-digit OTP.
 */
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Checks if a user can request a new OTP (1 minute cooldown).
 * @param {string} email - User email.
 */
const canRequestOtp = async (email) => {
    const { data, error } = await supabase
        .from('otps')
        .select('last_sent_at')
        .eq('email', email)
        .single();

    if (error || !data) return true;

    const lastSent = new Date(data.last_sent_at);
    const now = new Date();
    const diff = (now - lastSent) / 1000; // in seconds

    return diff >= 60;
};

/**
 * Saves or updates an OTP for a given email.
 * @param {string} email - User email.
 * @param {string} code - OTP code.
 */
const saveOtp = async (email, code) => {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    const { error } = await supabase
        .from('otps')
        .upsert({
            email,
            code,
            expires_at: expiresAt.toISOString(),
            last_sent_at: new Date().toISOString()
        });

    if (error) throw error;
    return true;
};

/**
 * Verifies an OTP for a given email.
 * @param {string} email - User email.
 * @param {string} code - OTP code.
 */
const verifyOtp = async (email, code) => {
    const { data, error } = await supabase
        .from('otps')
        .select('*')
        .eq('email', email)
        .eq('code', code)
        .single();

    if (error || !data) return false;

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (now > expiresAt) return false;

    // Delete OTP after successful verification (Single-use)
    await supabase.from('otps').delete().eq('email', email);

    return true;
};

module.exports = {
    generateOtp,
    canRequestOtp,
    saveOtp,
    verifyOtp
};
