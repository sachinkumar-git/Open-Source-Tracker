const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/UserSupabase');

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;

const getRedirectUri = () => {
    const base = process.env.BACKEND_URL || 'http://127.0.0.1:5005';
    return `${base}/api/auth/github/callback`;
};

const getFrontendUrl = () => {
    return process.env.FRONTEND_URL || 'http://127.0.0.1:5180';
};

// Step 1: Redirect user to GitHub
exports.githubLogin = (req, res) => {
    const redirectUri = getRedirectUri();
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=read:user user:email repo`;
    res.redirect(githubAuthUrl);
};

// Step 2: Handle callback from GitHub
exports.githubCallback = async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
            client_id: GITHUB_CLIENT_ID,
            client_secret: GITHUB_CLIENT_SECRET,
            code: code,
            redirect_uri: getRedirectUri()
        }, {
            headers: { accept: 'application/json' }
        });

        const accessToken = tokenResponse.data.access_token;
        if (!accessToken) {
            return res.status(400).send('Failed to get access token');
        }

        // Get user profile from GitHub
        const userResponse = await axios.get('https://api.github.com/user', {
            headers: { Authorization: `token ${accessToken}` }
        });

        const githubUser = userResponse.data;
        const githubId = githubUser.id.toString();
        const username = githubUser.login;
        const avatarUrl = githubUser.avatar_url;

        let existingUser = await User.findByGithubId(githubId);
        let userId;

        if (!existingUser) {
            existingUser = await User.create({
                github_id: githubId,
                username: username,
                avatar_url: avatarUrl,
                access_token: accessToken
            });
            userId = existingUser.id;
        } else {
            existingUser = await User.update(existingUser.id, {
                access_token: accessToken,
                avatar_url: avatarUrl
            });
            userId = existingUser.id;
        }

        // Generate JWT
        const payload = {
            user: { id: userId, username: existingUser.username }
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

        // Redirect to frontend with token
        const frontendUrl = getFrontendUrl();
        res.redirect(`${frontendUrl}/github-auth-success?token=${token}`);

    } catch (err) {
        console.error('GitHub Auth Error', err.response?.data || err.message);
        res.status(500).send('Authentication failed');
    }
};
