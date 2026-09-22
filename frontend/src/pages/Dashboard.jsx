import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FiRefreshCw, FiGitCommit, FiGitPullRequest, FiAlertCircle, FiExternalLink, FiSearch, FiCheckCircle, FiXCircle, FiStar, FiGitBranch, FiClock } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Sidebar from '../components/Sidebar';
import ContributionHeatmap from '../components/ContributionHeatmap';
import RepoForm from '../components/RepoForm';
import RepoList from '../components/RepoList';
import Compiler from './Compiler';
import api from '../services/api';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const [dashboardData, setDashboardData] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentRepo, setCurrentRepo] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [lastSynced, setLastSynced] = useState(null);
    // Verify state
    const [verifyUrl, setVerifyUrl] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [verifyResult, setVerifyResult] = useState(null);

    const fetchDashboardData = async () => {
        try {
            setLoadError(null);
            const res = await api.get('/dashboard');
            setDashboardData(res.data);
            return res.data;
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
            setLoadError(err.response?.data?.error || err.message || 'Failed to load dashboard');
            setDashboardData({
                user: { username: user?.username || 'User' },
                stats: { commits: 0, pull_requests: 0, issues: 0 },
                repos: [],
                recentActivity: []
            });
            return null;
        }
    };

    useEffect(() => {
        const init = async () => {
            const data = await fetchDashboardData();
            if (data && user?.github_id) {
                const s = data.stats;
                const hasNoData = (!s?.commits && !s?.pull_requests && !s?.issues && (!data.repos || data.repos.length === 0));
                if (hasNoData) {
                    setSyncing(true);
                    try {
                        await api.post('/dashboard/sync');
                        await fetchDashboardData();
                    } catch (e) {
                        console.error('Auto-sync failed', e);
                    }
                    setSyncing(false);
                }
            }
        };
        init();

        const pollInterval = setInterval(() => {
            fetchDashboardData();
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            await api.post('/dashboard/sync');
            await fetchDashboardData();
            setLastSynced(new Date());
        } catch (err) {
            console.error('Sync failed', err);
            alert('Sync failed — ensure you logged in with GitHub!');
        }
        setSyncing(false);
    };

    const handleVerify = async () => {
        if (!verifyUrl.trim()) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const res = await api.post('/repos/verify', { repoUrl: verifyUrl });
            setVerifyResult(res.data);
        } catch (err) {
            setVerifyResult({ exists: false, msg: err.response?.data?.msg || 'Verification failed' });
        }
        setVerifying(false);
    };

    const handleDownloadData = () => {
        const data = {
            user: user?.username,
            stats,
            repositories: repos,
            generatedAt: new Date().toISOString(),
            app: 'OSTracker'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `OSTracker_Report_${user?.username || 'user'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-500 border-t-transparent"></div>
                    <span className="text-slate-500 text-sm">Loading dashboard...</span>
                </div>
            </div>
        );
    }

    const { stats, repos, recentActivity } = dashboardData;

    const chartData = [
        { name: 'Commits', value: stats?.commits || 0, color: '#10b981' },
        { name: 'PRs', value: stats?.pull_requests || 0, color: '#6366f1' },
        { name: 'Issues', value: stats?.issues || 0, color: '#f59e0b' }
    ];

    // ── Dashboard Tab ──
    const renderDashboard = () => (
        <>
            {/* Status Bar */}
            <div className="dashboard-card flex items-center justify-between px-5 py-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-slate-400 text-sm">Current Status</span>
                    <span className="tag-badge tag-green">● Active</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={handleDownloadData}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-xs font-medium hover:bg-white/[0.06] transition-all">
                        <FiExternalLink size={14} className="text-emerald-400" />
                        Download Report
                    </button>
                    <button onClick={handleSync} disabled={syncing} className="sync-button">
                        <FiRefreshCw className={syncing ? 'animate-spin' : ''} size={14} />
                        {syncing ? 'Syncing...' : 'Sync GitHub'}
                    </button>
                </div>
            </div>

            {/* 3-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
                {/* Recent Repos */}
                <div className="dashboard-card p-5">
                    <h3 className="section-title mb-4">Recently Tracked Repos</h3>
                    <div className="space-y-3">
                        {(repos || []).slice(0, 4).map((repo, idx) => (
                            <div key={repo._id || idx} className="flex items-center justify-between group hover:bg-white/[0.02] rounded-lg px-3 py-2 -mx-3 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{repo.repoName || repo.repo_name}</p>
                                    <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        repo.language === 'JavaScript' ? 'bg-yellow-500/15 text-yellow-400' :
                                        repo.language === 'Python' ? 'bg-blue-500/15 text-blue-400' :
                                        repo.language === 'TypeScript' ? 'bg-sky-500/15 text-sky-400' :
                                        'bg-purple-500/15 text-purple-400'
                                    }`}>
                                        {repo.language || 'Unknown'}
                                    </span>
                                </div>
                                <a href={repo.repoUrl || repo.repo_url} target="_blank" rel="noreferrer"
                                   className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-emerald-400 transition-all">
                                    <FiExternalLink size={14} />
                                </a>
                            </div>
                        ))}
                        {(!repos || repos.length === 0) && (
                            <p className="text-slate-600 text-sm text-center py-6">No repos tracked yet</p>
                        )}
                    </div>
                </div>

                {/* Last 7 Days */}
                <div className="dashboard-card p-5">
                    <h3 className="section-title mb-4">Last 7 Days</h3>
                    <div className="space-y-2">
                        {(() => {
                            const days = [];
                            const today = new Date();
                            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                            for (let i = 0; i < 7; i++) {
                                const d = new Date();
                                d.setDate(today.getDate() - i);
                                const dateStr = d.toDateString();
                                const label = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayNames[d.getDay()];
                                const count = (recentActivity || []).filter(log =>
                                    new Date(log.date).toDateString() === dateStr
                                ).length;
                                days.push({ label, count });
                            }
                            const maxCount = Math.max(5, ...days.map(d => d.count));
                            return days.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1.5">
                                    <span className="text-sm text-slate-400 w-24">{day.label}</span>
                                    <div className="flex-1 mx-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all"
                                             style={{ width: `${(day.count / maxCount) * 100}%`, opacity: day.count > 0 ? 1 : 0.2 }} />
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono w-16 text-right">{day.count} events</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Heatmap */}
                <div className="dashboard-card p-5">
                    <h3 className="section-title mb-4">Activity Graph</h3>
                    <ContributionHeatmap activityLogs={recentActivity} />
                </div>
            </div>

            {/* Stats + Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="space-y-4">
                    <div className="stat-card">
                        <div className="stat-icon bg-emerald-500/10 text-emerald-400"><FiGitCommit size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.commits || 0}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Commits</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-indigo-500/10 text-indigo-400"><FiGitPullRequest size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.pull_requests || 0}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pull Requests</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-amber-500/10 text-amber-400"><FiAlertCircle size={20} /></div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.issues || 0}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Issues Opened</p>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 dashboard-card p-5">
                    <h3 className="section-title mb-4">Contribution Metrics</h3>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={48}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Activity Feed */}
            <div className="dashboard-card p-5 mt-5">
                <h3 className="section-title mb-4">Recent Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    {recentActivity && recentActivity.length > 0 ? recentActivity.map((log) => {
                        const dateObj = new Date(log.date);
                        const displayDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
                        const displayTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                            <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.03] transition">
                                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                                    log.type === 'Commit' ? 'bg-emerald-500' :
                                    log.type === 'PR' ? 'bg-indigo-500' :
                                    'bg-amber-500'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate">{log.repo_name}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`text-[10px] font-bold uppercase ${
                                            log.type === 'Commit' ? 'text-emerald-400' :
                                            log.type === 'PR' ? 'text-indigo-400' : 'text-amber-400'
                                        }`}>{log.type}</span>
                                        <span className="text-[10px] text-slate-600">{displayDate} · {displayTime}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-3 text-center text-slate-600 py-12">
                            <FiClock size={20} className="mx-auto mb-2 text-slate-700" />
                            <p className="text-sm">No activity tracked yet</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // ── Repos Tab ──
    const renderRepos = () => (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 lg:sticky lg:top-4 h-fit">
                <RepoForm currentRepo={currentRepo} clearCurrent={() => setCurrentRepo(null)} fetchRepos={fetchDashboardData} />
            </div>
            <div className="lg:col-span-8">
                <RepoList repos={repos || []} setCurrentRepo={setCurrentRepo} fetchRepos={fetchDashboardData} />
            </div>
        </div>
    );

    // ── Analytics Tab ──
    const renderAnalytics = () => (
        <div className="space-y-6">
            <div className="dashboard-card p-6">
                <h3 className="section-title mb-6">Full Contribution Breakdown</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={64}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="dashboard-card p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3"><FiGitCommit size={24} /></div>
                    <p className="text-3xl font-bold text-white">{stats?.commits || 0}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Commits</p>
                </div>
                <div className="dashboard-card p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3"><FiGitPullRequest size={24} /></div>
                    <p className="text-3xl font-bold text-white">{stats?.pull_requests || 0}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Pull Requests</p>
                </div>
                <div className="dashboard-card p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3"><FiAlertCircle size={24} /></div>
                    <p className="text-3xl font-bold text-white">{stats?.issues || 0}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Issues</p>
                </div>
            </div>
            <div className="dashboard-card p-6">
                <h3 className="section-title mb-6">Activity Heatmap</h3>
                <div className="flex justify-center"><ContributionHeatmap activityLogs={recentActivity} /></div>
            </div>
        </div>
    );

    // ── Verify Tab ──
    const renderVerify = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="dashboard-card p-6">
                <h3 className="section-title mb-2">Repository Verification</h3>
                <p className="text-slate-500 text-sm mb-5">Enter a GitHub repo URL or owner/name to verify its existence and get a health analysis.</p>
                <div className="flex gap-3">
                    <input
                        type="text" value={verifyUrl}
                        onChange={(e) => setVerifyUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        placeholder="e.g. facebook/react or https://github.com/owner/repo"
                        className="flex-1 px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 transition-all"
                    />
                    <button onClick={handleVerify} disabled={verifying || !verifyUrl.trim()} className="cta-verify-btn">
                        {verifying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><FiSearch size={16} /> Verify</>
                        )}
                    </button>
                </div>
            </div>

            {verifyResult && (
                <div className="dashboard-card p-6 animate-fadeInUp">
                    {verifyResult.exists ? (
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0"><FiCheckCircle size={24} /></div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">{verifyResult.repo.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{verifyResult.repo.description}</p>
                                </div>
                            </div>
                            {/* Health Score */}
                            <div className="flex items-center justify-center gap-8">
                                <div className="relative w-28 h-28">
                                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="52" fill="none"
                                            stroke={verifyResult.analysis.healthScore >= 70 ? '#10b981' : verifyResult.analysis.healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={`${verifyResult.analysis.healthScore * 3.27} 327`}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-extrabold text-white">{verifyResult.analysis.healthScore}</span>
                                        <span className="text-[10px] text-slate-500 uppercase">Score</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-1">Verdict</p>
                                    <p className="text-sm text-slate-400">{verifyResult.analysis.verdict}</p>
                                    <p className="text-xs text-slate-600 mt-2">Last updated {verifyResult.analysis.daysSinceUpdate} days ago</p>
                                </div>
                            </div>
                            {/* Stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] text-center">
                                    <FiStar className="mx-auto text-amber-400 mb-1" size={14} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.stars?.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Stars</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] text-center">
                                    <FiGitBranch className="mx-auto text-indigo-400 mb-1" size={14} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.forks?.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Forks</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] text-center">
                                    <FiAlertCircle className="mx-auto text-emerald-400 mb-1" size={14} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.openIssues}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Open Issues</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04] text-center">
                                    <FiClock className="mx-auto text-cyan-400 mb-1" size={14} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.language}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Language</p>
                                </div>
                            </div>
                            {/* Topics */}
                            {verifyResult.repo.topics?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {verifyResult.repo.topics.map(t => (
                                        <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/15">{t}</span>
                                    ))}
                                </div>
                            )}
                            <a href={verifyResult.repo.htmlUrl} target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition">
                                <FiExternalLink size={14} /> View on GitHub
                            </a>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 mx-auto rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 mb-4"><FiXCircle size={28} /></div>
                            <h3 className="text-lg font-bold text-white mb-2">Repository Not Found</h3>
                            <p className="text-slate-500 text-sm">{verifyResult.msg}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    // ── Page title map ──
    const titles = {
        dashboard: 'Dashboard',
        repos: 'Repositories',
        analytics: 'Analytics',
        verify: 'Verify Repository',
        compiler: 'Online Compiler'
    };

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
            <Sidebar
                user={user}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                logout={logout}
            />

            <main className="flex-1 p-6 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
                {/* Error Banner */}
                {loadError && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                        <span>⚠️ {loadError}</span>
                        <button onClick={fetchDashboardData} className="text-xs font-semibold underline hover:text-red-300">Retry</button>
                    </div>
                )}

                {/* Syncing Banner */}
                {syncing && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                        <span>Syncing your GitHub data…</span>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">{titles[activeTab]}</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {activeTab === 'verify' ? 'Check if a repository exists and analyze its health' : 'Track, contribute, and manage open-source projects'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-600">{repos?.length || 0} repos</span>
                        <div className="w-px h-4 bg-slate-800"></div>
                        <span className="text-xs text-slate-600">{(stats?.commits || 0) + (stats?.pull_requests || 0) + (stats?.issues || 0)} contributions</span>
                        {lastSynced && (
                            <>
                                <div className="w-px h-4 bg-slate-800"></div>
                                <span className="text-[10px] text-emerald-600">● synced {lastSynced.toLocaleTimeString()}</span>
                            </>
                        )}
                        <button onClick={handleSync} disabled={syncing} className="sync-button">
                            <FiRefreshCw className={syncing ? 'animate-spin' : ''} size={14} />
                            {syncing ? 'Syncing...' : 'Sync GitHub'}
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'repos' && renderRepos()}
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'verify' && renderVerify()}
                {activeTab === 'compiler' && <Compiler />}
            </main>
        </div>
    );
};

export default Dashboard;
