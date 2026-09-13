const supabase = require('../config/supabaseClient');
const githubService = require('../services/githubService');

exports.getDashboardData = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch user data
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('username, avatar_url, github_id')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('Dashboard: user fetch error', userError.message);
        }

        // Fetch contribution metrics (may not exist yet, may have multiple rows)
        const { data: contribRows, error: contribError } = await supabase
            .from('contributions')
            .select('*')
            .eq('user_id', userId)
            .order('id', { ascending: false })
            .limit(1);

        const contributions = contribRows?.[0] || null;

        if (contribError) {
            console.error('Dashboard: contributions fetch error', contribError.message);
        }

        // Fetch recent tracked repos
        const { data: repos, error: repoError } = await supabase
            .from('tracked_repos')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (repoError) {
            console.error('Dashboard: repos fetch error', repoError.message);
        }

        // Fetch activity logs
        const { data: activityLogs, error: logError } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (logError) {
            console.error('Dashboard: activity_logs fetch error', logError.message);
        }

        // Map postgres snake_case to frontend camelCase expectations
        const formattedRepos = (repos || []).map(r => ({
            _id: r.id,
            user: r.user_id,
            repoName: r.repo_name,
            repoUrl: r.repo_url,
            language: r.language,
            status: r.status,
            notes: r.notes,
            createdAt: r.created_at
        }));

        res.json({
            user: user || { username: 'User', avatar_url: null },
            stats: contributions || { commits: 0, pull_requests: 0, issues: 0 },
            repos: formattedRepos,
            recentActivity: activityLogs || []
        });

    } catch (err) {
        console.error('Dashboard Error', err);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
};

exports.syncData = async (req, res) => {
    try {
        const result = await githubService.syncGitHubData(req.user.id);
        res.json(result);
    } catch (err) {
        console.error('Sync Error', err.message);
        res.status(500).json({ error: 'Failed to sync', details: err.message });
    }
};
