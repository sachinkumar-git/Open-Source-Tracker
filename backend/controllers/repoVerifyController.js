const axios = require('axios');

// @route   POST api/repos/verify
// @desc    Verify if a GitHub repository exists and return details
// @access  Private (requires auth)
exports.verifyRepo = async (req, res) => {
    const { repoUrl } = req.body;

    if (!repoUrl) {
        return res.status(400).json({ exists: false, msg: 'No repository URL provided' });
    }

    try {
        // Extract owner/repo from URL
        // Supports: https://github.com/owner/repo, github.com/owner/repo, owner/repo
        let owner, repo;
        const urlMatch = repoUrl.match(/(?:github\.com\/)?([^\/\s]+)\/([^\/\s#?]+)/);
        
        if (urlMatch) {
            owner = urlMatch[1];
            repo = urlMatch[2].replace(/\.git$/, '');
        } else {
            return res.status(400).json({ 
                exists: false, 
                msg: 'Invalid format. Use: https://github.com/owner/repo or owner/repo' 
            });
        }

        // Call GitHub API to verify
        const response = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
            headers: { Accept: 'application/vnd.github.v3+json' },
            timeout: 5000
        });

        const data = response.data;

        // Calculate a health score
        const stars = data.stargazers_count || 0;
        const forks = data.forks_count || 0;
        const issues = data.open_issues_count || 0;
        const hasDescription = data.description ? 1 : 0;
        const hasLicense = data.license ? 1 : 0;
        const daysSinceUpdate = Math.floor((Date.now() - new Date(data.updated_at).getTime()) / (1000 * 60 * 60 * 24));
        const isActive = daysSinceUpdate < 90;

        // Score out of 100
        let healthScore = 0;
        healthScore += Math.min(stars, 100) * 0.3;        // Stars: max 30 points
        healthScore += Math.min(forks, 50) * 0.4;         // Forks: max 20 points
        healthScore += hasDescription * 10;                 // Description: 10 points
        healthScore += hasLicense * 10;                     // License: 10 points
        healthScore += isActive ? 20 : 0;                   // Active: 20 points
        healthScore += issues > 0 ? 10 : 0;                 // Community engagement: 10 points
        healthScore = Math.min(Math.round(healthScore), 100);

        let verdict;
        if (healthScore >= 70) verdict = '🟢 Excellent — Healthy, active repository';
        else if (healthScore >= 40) verdict = '🟡 Good — Moderate activity, worth contributing to';
        else if (healthScore >= 15) verdict = '🟠 Fair — Low activity, review before contributing';
        else verdict = '🔴 Inactive — Minimal activity detected';

        res.json({
            exists: true,
            verified: true,
            repo: {
                name: data.full_name,
                description: data.description || 'No description provided',
                language: data.language || 'Unknown',
                stars: data.stargazers_count,
                forks: data.forks_count,
                openIssues: data.open_issues_count,
                license: data.license?.spdx_id || 'None',
                lastUpdated: data.updated_at,
                createdAt: data.created_at,
                htmlUrl: data.html_url,
                isArchived: data.archived,
                isFork: data.fork,
                defaultBranch: data.default_branch,
                topics: data.topics || [],
            },
            analysis: {
                healthScore,
                verdict,
                isActive,
                daysSinceUpdate,
            }
        });

    } catch (err) {
        if (err.response && err.response.status === 404) {
            return res.json({
                exists: false,
                verified: true,
                msg: '❌ Repository not found on GitHub. Please check the URL or name.',
                analysis: {
                    healthScore: 0,
                    verdict: '🔴 Not Found — This repository does not exist on GitHub',
                }
            });
        }
        console.error('Repo verification error:', err.message);
        res.status(500).json({ exists: false, msg: 'Failed to verify repository' });
    }
};
