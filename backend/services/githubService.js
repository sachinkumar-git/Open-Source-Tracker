const axios = require('axios');
const supabase = require('../config/supabaseClient');

const githubApi = axios.create({
    baseURL: 'https://api.github.com',
    headers: {
        Accept: 'application/vnd.github.v3+json'
    }
});

exports.syncGitHubData = async (userId) => {
    try {
        // 1. Get user access token from DB
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('access_token, username')
            .eq('id', userId)
            .single();

        if (userError || !user || !user.access_token) {
            throw new Error('User not found or missing GitHub access token');
        }

        const accessToken = user.access_token;
        const config = {
            headers: { Authorization: `token ${accessToken}` }
        };

        console.log(`[Sync] Starting sync for user: ${user.username}`);

        // 2. Fetch User's Repositories (up to 100)
        const reposResponse = await githubApi.get('/user/repos?type=owner&per_page=100&sort=updated', config);
        const repos = reposResponse.data;
        console.log(`[Sync] Fetched ${repos.length} repos from GitHub`);

        let totalCommits = 0;
        let totalPRs = 0;
        let totalIssues = 0;
        const logs = [];

        // 3. Reconcile repositories in tracked_repos (Mirror Sync)
        const currentRepoNames = repos.map(r => r.name);
        
        // 3a. Delete repos from DB that are no longer on GitHub
        const { data: dbRepos } = await supabase
            .from('tracked_repos')
            .select('repo_name')
            .eq('user_id', userId);
        
        if (dbRepos) {
            const orphans = dbRepos.filter(dr => !currentRepoNames.includes(dr.repo_name));
            for (const orphan of orphans) {
                console.log(`[Sync] Removing orphaned repo (deleted on GitHub): ${orphan.repo_name}`);
                await supabase
                    .from('tracked_repos')
                    .delete()
                    .eq('user_id', userId)
                    .eq('repo_name', orphan.repo_name);
            }
        }

        // 3b. Upsert current repos
        for (const repo of repos) {
            const { data: existingRepo } = await supabase
                .from('tracked_repos')
                .select('id')
                .eq('user_id', userId)
                .eq('repo_name', repo.name)
                .maybeSingle();

            if (!existingRepo) {
                await supabase
                    .from('tracked_repos')
                    .insert([{
                        user_id: userId,
                        repo_name: repo.name,
                        repo_url: repo.html_url,
                        language: repo.language || 'Unknown'
                    }]);
            } else {
                await supabase
                    .from('tracked_repos')
                    .update({ language: repo.language || 'Unknown', repo_url: repo.html_url })
                    .eq('id', existingRepo.id);
            }
        }

        // 4. Fetch Targeted activity logs for Tracked Repos (High Precision)
        const { data: activeTrackedRepos } = await supabase
            .from('tracked_repos')
            .select('repo_name')
            .eq('user_id', userId);
        
        const trackedRepoNames = activeTrackedRepos?.map(r => r.repo_name) || [];
        console.log(`[Sync] Fetching precision activity for ${trackedRepoNames.length} tracked repos`);

        // Use a Set to track unique event IDs (if any) or commit SHA/timestamp pairs
        const logDedupSet = new Set();

        for (const repoName of trackedRepoNames) {
            try {
                // A. EXACT COMMITS: Get individual commits for this user
                const commitsPath = `/repos/${user.username}/${repoName}/commits?per_page=30&author=${user.username}`;
                const commitsRes = await githubApi.get(commitsPath, config);
                
                for (const commit of commitsRes.data) {
                    const commitDate = commit.commit.author.date;
                    const sha = commit.sha.slice(0, 7);
                    const dedupKey = `commit-${commitDate}-${repoName}`;
                    
                    if (!logDedupSet.has(dedupKey)) {
                        logs.push({
                            type: 'Commit',
                            repo_name: repoName,
                            date: commitDate,
                            description: commit.commit.message.split('\n')[0]
                        });
                        logDedupSet.add(dedupKey);
                        totalCommits++;
                    }
                }

                // B. OTHER EVENTS: PRs, Issues from the Repo Events API
                const eventsPath = `/repos/${user.username}/${repoName}/events?per_page=30`;
                const eventsRes = await githubApi.get(eventsPath, config);
                
                for (const event of eventsRes.data) {
                    // Only process events by this user
                    if (event.actor.login !== user.username) continue;

                    let logEntry = null;
                    if (event.type === 'PullRequestEvent') {
                        const action = event.payload.action;
                        if (action === 'opened' || action === 'closed') {
                            totalPRs++;
                            logEntry = { type: 'PR', repo_name: repoName, date: event.created_at, description: `${action} PR #${event.payload.number}` };
                        }
                    } else if (event.type === 'IssuesEvent') {
                        const action = event.payload.action;
                        if (action === 'opened' || action === 'closed') {
                            totalIssues++;
                            logEntry = { type: 'Issue', repo_name: repoName, date: event.created_at, description: `${action} issue #${event.payload.issue.number}` };
                        }
                    } else if (event.type === 'IssueCommentEvent') {
                        logEntry = { type: 'Comment', repo_name: repoName, date: event.created_at, description: 'commented on issue' };
                    }

                    if (logEntry) {
                        const dedupKey = `event-${event.type}-${event.created_at}-${repoName}`;
                        if (!logDedupSet.has(dedupKey)) {
                            logs.push(logEntry);
                            logDedupSet.add(dedupKey);
                        }
                    }
                }
            } catch (e) {
                console.log(`[Sync] Skipping precision fetch for ${repoName}: ${e.message}`);
            }
        }

        // Sort all logs by date descending
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));

        console.log(`[Sync] Final Precision Stats: ${totalCommits} commits, ${totalPRs} PRs, ${totalIssues} issues, ${logs.length} unique log entries`);

        // 5. Save contributions — clean slate approach
        await supabase.from('contributions').delete().eq('user_id', userId);
        
        await supabase
            .from('contributions')
            .insert([{
                user_id: userId,
                commits: totalCommits,
                pull_requests: totalPRs,
                issues: totalIssues
            }]);

        // 6. Insert latest activity logs (extended history: top 100)
        await supabase.from('activity_logs').delete().eq('user_id', userId);

        if (logs.length > 0) {
            const logsToInsert = logs.slice(0, 100).map(log => ({
                user_id: userId,
                type: log.type,
                repo_name: log.repo_name,
                date: log.date
            }));
            
            const { error: insertLogsErr } = await supabase
                .from('activity_logs')
                .insert(logsToInsert);
            
            if (insertLogsErr) {
                console.error('[Sync] Failed to insert precision logs:', insertLogsErr.message);
            } else {
                console.log(`[Sync] Inserted ${logsToInsert.length} activity logs`);
            }
        }

        console.log('[Sync] ✓ Sync complete!');
        return { message: 'GitHub data synced successfully!', stats: { totalCommits, totalPRs, totalIssues } };

    } catch (err) {
        console.error('[Sync] Error:', err.response?.data || err.message);
        throw err;
    }
};
