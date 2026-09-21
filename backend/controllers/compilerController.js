const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const axios = require('axios');
const supabase = require('../config/supabaseClient');

// Helper to get GitHub API instance for a user
const getGithubApi = async (userId) => {
    const { data: user, error } = await supabase
        .from('users')
        .select('access_token, username')
        .eq('id', userId)
        .single();

    if (error || !user || !user.access_token) {
        throw new Error('User not found or missing GitHub access token');
    }

    return {
        api: axios.create({
            baseURL: 'https://api.github.com',
            headers: {
                Authorization: `token ${user.access_token}`,
                Accept: 'application/vnd.github.v3+json'
            }
        }),
        username: user.username
    };
};

// @route   POST api/compiler/push
// @desc    Push code directly to a GitHub repository
exports.pushToGitHub = async (req, res) => {
    const { repoName, filePath, content, commitMessage } = req.body;

    if (!repoName || !filePath || !content) {
        return res.status(400).json({ msg: 'Please provide repoName, filePath, and content' });
    }

    try {
        const { api, username } = await getGithubApi(req.user.id);

        // Check if file already exists to get its SHA (required for updating)
        let fileSha = null;
        try {
            const getFileRes = await api.get(`/repos/${username}/${repoName}/contents/${filePath}`);
            fileSha = getFileRes.data.sha;
        } catch (err) {
            if (err.response && err.response.status !== 404) {
                throw err;
            }
        }

        const encodedContent = Buffer.from(content).toString('base64');
        const payload = {
            message: commitMessage || `Update ${filePath} via OSTracker`,
            content: encodedContent,
        };

        if (fileSha) {
            payload.sha = fileSha;
        }

        const pushRes = await api.put(`/repos/${username}/${repoName}/contents/${filePath}`, payload);

        res.json({
            msg: 'Successfully pushed to GitHub!',
            commit: pushRes.data.commit,
            content: pushRes.data.content
        });

    } catch (err) {
        console.error('Push to GitHub error:', err.response?.data || err.message);
        res.status(500).json({
            msg: 'Failed to push to GitHub',
            error: err.response?.data?.message || err.message
        });
    }
};

// Allowed languages for local execution
const ALLOWED_LANGUAGES = ['javascript', 'js', 'python'];

// Basic input sanitization — reject obviously dangerous patterns
const sanitizeCode = (code) => {
    // Block attempts to access the filesystem or spawn processes outside our sandbox
    const dangerousPatterns = [
        /require\s*\(\s*['"]child_process['"]\s*\)/i,
        /require\s*\(\s*['"]fs['"]\s*\)/i,
        /require\s*\(\s*['"]net['"]\s*\)/i,
        /require\s*\(\s*['"]http['"]\s*\)/i,
        /require\s*\(\s*['"]https['"]\s*\)/i,
        /import\s+.*from\s+['"]child_process['"]/i,
        /import\s+.*from\s+['"]fs['"]/i,
        /process\.exit/i,
        /eval\s*\(/i,
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(code)) {
            return { safe: false, reason: 'Code contains restricted operations (filesystem/network/process access).' };
        }
    }

    return { safe: true };
};

// @route   POST api/compiler/run
// @desc    Execute code in a sandboxed temp file
exports.runCode = async (req, res) => {
    const { language, files } = req.body;

    if (!language || !files || files.length === 0) {
        return res.status(400).json({ msg: 'Please provide language and files' });
    }

    if (!ALLOWED_LANGUAGES.includes(language)) {
        return res.status(400).json({
            msg: `Language "${language}" is not supported. Supported: JavaScript, Python.`
        });
    }

    const code = files[0].content;

    // Basic sanitization
    const check = sanitizeCode(code);
    if (!check.safe) {
        return res.json({
            run: { output: `Blocked: ${check.reason}` }
        });
    }

    const tempDir = os.tmpdir();
    const id = crypto.randomBytes(16).toString('hex');
    let filePath = '';
    let command = '';

    try {
        if (language === 'javascript' || language === 'js') {
            filePath = path.join(tempDir, `${id}.js`);
            await fs.writeFile(filePath, code);
            command = `node "${filePath}"`;
        } else if (language === 'python') {
            filePath = path.join(tempDir, `${id}.py`);
            await fs.writeFile(filePath, code);
            command = `python "${filePath}"`;
        }

        exec(command, { timeout: 5000, maxBuffer: 1024 * 512 }, async (error, stdout, stderr) => {
            // Clean up temp file
            try { await fs.unlink(filePath); } catch (e) { /* ignore */ }

            let output = '';
            if (error) {
                output = stderr || error.message;
            } else {
                output = stdout + (stderr ? '\n' + stderr : '');
            }

            res.json({
                run: { output: output }
            });
        });

    } catch (err) {
        console.error('Run code error:', err);
        if (filePath) {
            try { await fs.unlink(filePath); } catch (e) { /* ignore */ }
        }
        res.status(500).json({
            msg: 'Failed to run code',
            error: err.message
        });
    }
};

// @route   GET api/compiler/runtimes
// @desc    Get available languages for local execution
exports.getRuntimes = async (req, res) => {
    res.json([
        { language: 'javascript', version: 'node' },
        { language: 'python', version: '3' }
    ]);
};
