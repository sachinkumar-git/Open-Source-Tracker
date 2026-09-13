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

        // 1. Check if file already exists to get its SHA (required for updating)
        let fileSha = null;
        try {
            const getFileRes = await api.get(`/repos/${username}/${repoName}/contents/${filePath}`);
            fileSha = getFileRes.data.sha;
        } catch (err) {
            // 404 means file doesn't exist, which is fine (we are creating a new one)
            if (err.response && err.response.status !== 404) {
                throw err;
            }
        }

        // 2. Prepare payload
        // GitHub API requires content to be base64 encoded
        const encodedContent = Buffer.from(content).toString('base64');
        const payload = {
            message: commitMessage || `Update ${filePath} via OSTracker Online Compiler`,
            content: encodedContent,
        };

        if (fileSha) {
            payload.sha = fileSha; // Required to update an existing file
        }

        // 3. Commit and push
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

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// @route   POST api/compiler/run
// @desc    Execute code using local environment (fallback for Piston API)
exports.runCode = async (req, res) => {
    const { language, version, files } = req.body;
    
    if (!language || !files || files.length === 0) {
        return res.status(400).json({ msg: 'Please provide language and files' });
    }

    const code = files[0].content;
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
        } else {
            return res.status(400).json({ 
                msg: `Local execution for ${language} is not supported. Please use JavaScript or Python.` 
            });
        }

        exec(command, { timeout: 5000 }, async (error, stdout, stderr) => {
            // Clean up temp file
            try { await fs.unlink(filePath); } catch (e) {}

            let output = '';
            if (error) {
                // Return stderr if available, otherwise the error message
                output = stderr || error.message;
            } else {
                output = stdout + (stderr ? '\n' + stderr : '');
            }

            // Return in Piston-like format so frontend doesn't need to change
            res.json({
                run: {
                    output: output
                }
            });
        });

    } catch (err) {
        console.error('Run code error:', err);
        if (filePath) {
            try { await fs.unlink(filePath); } catch (e) {}
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
    // Return mock runtimes to satisfy the frontend
    res.json([
        { language: 'javascript', version: 'node' },
        { language: 'python', version: '3' }
    ]);
};
