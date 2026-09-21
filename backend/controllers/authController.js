const User = require('../models/UserSupabase');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateOtp, canRequestOtp, saveOtp, verifyOtp } = require('../services/otpService');
const { sendOtpEmail } = require('../services/mailService');

const JWT_EXPIRES_IN = '7d';

exports.requestOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const canSend = await canRequestOtp(email);
        if (!canSend) {
            return res.status(429).json({ msg: 'Please wait 1 minute before requesting a new code' });
        }

        const otp = generateOtp();
        await saveOtp(email, otp);
        const sent = await sendOtpEmail(email, otp);

        if (!sent) {
            return res.status(500).json({ msg: 'Failed to send OTP email' });
        }

        res.json({ msg: 'Verification code sent to your email' });
    } catch (err) {
        console.error('OTP request error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.registerUser = async (req, res) => {
    const { username, email, password, otp } = req.body;
    try {
        const isValid = await verifyOtp(email, otp);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (err) {
        console.error('Register error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.loginWithOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const isValid = await verifyOtp(email, otp);
        if (!isValid) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ msg: 'No user found with this email. Please register first.' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (err) {
        console.error('OTP login error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = { user: { id: user.id } };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};

exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        console.error('Get user error:', err.message);
        res.status(500).json({ msg: 'Server error' });
    }
};
