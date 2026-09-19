import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { FiLogOut, FiGlobe, FiGrid, FiFolder, FiBarChart2, FiRefreshCw, FiGitCommit, FiGitPullRequest, FiAlertCircle, FiPlus, FiExternalLink, FiChevronRight, FiSearch, FiCheckCircle, FiXCircle, FiStar, FiGitBranch, FiClock, FiSun, FiMoon } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import RepoForm from '../components/RepoForm';
import RepoList from '../components/RepoList';
import Compiler from './Compiler';
import api from '../services/api';

// ── Sidebar navigation items ──
const NAV_ITEMS = [
    { id: 'dashboard', label: 'sidebar.dashboard', icon: FiGrid },
    { id: 'repos', label: 'sidebar.repositories', icon: FiFolder },
    { id: 'analytics', label: 'sidebar.explore', icon: FiBarChart2 },
    { id: 'verify', label: 'sidebar.settings', icon: FiSearch },
    { id: 'compiler', label: 'Online Compiler', icon: FiGitCommit },
];

// ── Contribution Heatmap Component ──
const ContributionHeatmap = ({ activityLogs }) => {
    // 7 rows (Mon-Sun) x 12 weeks
    const ROWS = 7;
    const COLS = 12;
    const DAYS_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun'];
    
    // Get unique dates and counts
    const activityMap = {};
    (activityLogs || []).forEach(log => {
        const dateStr = new Date(log.date).toDateString();
        activityMap[dateStr] = (activityMap[dateStr] || 0) + 1;
    });

    const getIntensity = (count) => {
        if (!count || count === 0) return 0;
        if (count <= 1) return 1;
        if (count <= 3) return 2;
        if (count <= 5) return 3;
        return 4;
    };

    const intensityColors = [
        'bg-[#161b22]',     // 0 - empty
        'bg-emerald-900/60', // 1 - low
        'bg-emerald-700/80', // 2 - medium
        'bg-emerald-500',    // 3 - high
        'bg-emerald-400',    // 4 - very high
    ];

    // Build the grid
    const today = new Date();
    // Monday of the current week
    const currentDay = today.getDay(); // 0 is Sun, 1 is Mon...
    const diffToMon = currentDay === 0 ? 6 : currentDay - 1;
    const startOfCurrentWeek = new Date(today);
    startOfCurrentWeek.setDate(today.getDate() - diffToMon);
    startOfCurrentWeek.setHours(0,0,0,0);

    const grid = [];
    for (let row = 0; row < ROWS; row++) {
        const rowData = [];
        for (let col = 0; col < COLS; col++) {
            // Calculate date for this cell: (CurrentWeek - (11-col) weeks) + row days
            const cellDate = new Date(startOfCurrentWeek);
            cellDate.setDate(startOfCurrentWeek.getDate() - (COLS - 1 - col) * 7 + row);
            
            const dateStr = cellDate.toDateString();
            const count = activityMap[dateStr] || 0;
            const isFuture = cellDate > today;
            
            rowData.push({
                date: dateStr,
                count: isFuture ? null : count,
                intensity: isFuture ? -1 : getIntensity(count)
            });
        }
        grid.push(rowData);
    }

    return (
        <div className="flex flex-col">
            <div className="flex gap-3">
                {/* Day labels */}
                <div className="flex flex-col gap-[4px] pt-1 pt-6">
                    {DAYS_LABELS.map((d, i) => (
                        <span key={i} className="text-[9px] text-slate-500 font-medium h-[14px] flex items-center">{d}</span>
                    ))}
                </div>
                {/* Grid */}
                <div>
                    <div className="flex flex-col gap-[4px]">
                        {grid.map((row, rowIdx) => (
                            <div key={rowIdx} className="flex gap-[4px]">
                                {row.map((cell, colIdx) => (
                                    <div
                                        key={colIdx}
                                        className={`w-[14px] h-[14px] rounded-[2px] transition-all ${
                                            cell.intensity === -1 ? 'bg-transparent' : intensityColors[cell.intensity]
                                        } ${cell.intensity > 0 ? 'hover:ring-1 hover:ring-white/50' : 'hover:bg-slate-800'}`}
                                        title={cell.intensity === -1 ? '' : `${cell.count || 0} events on ${cell.date}`}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex justify-between mt-3 px-1">
                <span className="text-[10px] text-slate-600">Last 12 Weeks</span>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-600 mr-1">Less</span>
                    {intensityColors.map((color, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-[1px] ${color}`} />
                    ))}
                    <span className="text-[10px] text-slate-600 ml-1">More</span>
                </div>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const { theme, toggleTheme } = useTheme();
    const { t, i18n } = useTranslation();
    const isLight = theme === 'light';
    const [dashboardData, setDashboardData] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [currentRepo, setCurrentRepo] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [lastSynced, setLastSynced] = useState(null);
    // AI Verify state
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
            // Set empty data so the UI renders instead of infinite spinner
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
            // Auto-sync for GitHub users if no data exists yet
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

        // Real-time polling: refresh dashboard data every 30 seconds
        const pollInterval = setInterval(() => {
            fetchDashboardData();
        }, 30000);

        return () => clearInterval(pollInterval);
    }, []);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await api.post('/dashboard/sync');
            console.log('Sync result:', res.data);
            await fetchDashboardData();
            setLastSynced(new Date());
        } catch (err) {
            console.error('Sync failed', err);
            alert('Sync failed - ensure you logged in with GitHub!');
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
            stats: stats,
            repositories: repos,
            generatedAt: new Date().toISOString(),
            app: "OSTracker"
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

    // ── Render: Dashboard tab ──
    const renderDashboard = () => (
        <>
            {/* Current Sync Bar */}
            <div className="dashboard-card flex items-center justify-between px-5 py-3 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                    <span className="text-slate-300 text-sm">Current Status</span>
                    <span className="text-white font-semibold">Open Source Contribution Tracker</span>
                    <span className="tag-badge tag-green">● {t('dashboard.active')}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleDownloadData}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-xs font-semibold hover:bg-white/[0.08] transition-all"
                    >
                        <FiExternalLink size={14} className="text-emerald-400" />
                        Download Report
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="sync-button"
                    >
                        <FiRefreshCw className={syncing ? 'animate-spin' : ''} size={14} />
                        {syncing ? 'Syncing...' : 'Sync GitHub'}
                    </button>
                </div>
            </div>

            {/* Main Grid - 3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">

                {/* Recently Tracked Repos */}
                <div className="dashboard-card p-5">
                    <h3 className="section-title mb-4">{t('dashboard.recentRepos')}</h3>
                    <div className="space-y-3">
                        {(repos || []).slice(0, 4).map((repo, idx) => (
                            <div key={repo._id || idx} className="flex items-center justify-between group hover:bg-white/[0.03] rounded-lg px-3 py-2 -mx-3 transition-colors">
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
                            <p className="text-slate-600 text-sm text-center py-6">{t('dashboard.noRepos')}</p>
                        )}
                    </div>
                </div>

                {/* Last 7 Days Summary */}
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
                            
                            // Max count for scaling the bars (min 5 for visual consistency)
                            const maxCount = Math.max(5, ...days.map(d => d.count));

                            return days.map((day, idx) => (
                                <div key={idx} className="flex items-center justify-between py-1.5">
                                    <span className="text-sm text-slate-400 w-24">{day.label}</span>
                                    <div className="flex-1 mx-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-700`}
                                            style={{ width: `${(day.count / maxCount) * 100}%`, opacity: day.count > 0 ? 1 : 0.3 }}
                                        />
                                    </div>
                                    <span className="text-xs text-slate-500 font-mono w-16 text-right">{day.count} events</span>
                                </div>
                            ));
                        })()}
                    </div>
                </div>

                {/* Activity Heatmap */}
                <div className="dashboard-card p-5">
                    <h3 className="section-title mb-4">Activity Graph</h3>
                    <ContributionHeatmap activityLogs={recentActivity} />
                </div>
            </div>

            {/* Bottom Row: Stats + Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Stats Cards */}
                <div className="space-y-4">
                    <div className="stat-card">
                        <div className="stat-icon bg-emerald-500/10 text-emerald-400">
                            <FiGitCommit size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.commits || 0}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Commits</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-indigo-500/10 text-indigo-400">
                            <FiGitPullRequest size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.pull_requests || 0}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Pull Requests</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon bg-amber-500/10 text-amber-400">
                            <FiAlertCircle size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-white">{stats?.issues || 0}</p>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{t('repoList.issues')} Opened</p>
                        </div>
                    </div>
                </div>

                {/* Contribution Metrics Bar Chart */}
                <div className="lg:col-span-2 dashboard-card p-5">
                    <h3 className="section-title mb-4">Contribution Metrics</h3>
                    <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
                                <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                                <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                    contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2a2a3e', borderRadius: '10px', color: '#fff', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                                />
                                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={48}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Activity Feed */}
            <div className="dashboard-card p-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="section-title">Recent Activity Logs</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Real-time Precision Mode</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {recentActivity && recentActivity.length > 0 ? recentActivity.map((log) => {
                        const dateObj = new Date(log.date);
                        const displayDate = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                        const displayTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={log.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.02] transition">
                                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                                    log.type === 'Commit' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                                    log.type === 'PR' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 
                                    'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                                }`}></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-white truncate">{log.repo_name}</p>
                                    <div className="flex flex-col mt-0.5">
                                        <span className={`text-[10px] font-black uppercase tracking-tighter ${
                                            log.type === 'Commit' ? 'text-emerald-400' :
                                            log.type === 'PR' ? 'text-indigo-400' : 'text-amber-400'
                                        }`}>{log.type}</span>
                                        <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-medium">
                                            <span>{displayDate}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span>{displayTime}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="col-span-3 text-center text-slate-600 py-12">
                            <div className="w-12 h-12 mx-auto rounded-full bg-slate-800/30 flex items-center justify-center mb-3">
                                <FiClock size={20} className="text-slate-700" />
                            </div>
                            <p className="text-sm font-medium">No activity tracked yet</p>
                            <p className="text-xs text-slate-700 mt-1">Activity from your tracked repos will appear here at the exact second it happens.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );

    // ── Render: Repositories tab ──
    const renderRepos = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 lg:sticky lg:top-4 h-fit">
                    <RepoForm
                        currentRepo={currentRepo}
                        clearCurrent={() => setCurrentRepo(null)}
                        fetchRepos={fetchDashboardData}
                    />
                </div>
                <div className="lg:col-span-8">
                    <RepoList
                        repos={repos || []}
                        setCurrentRepo={setCurrentRepo}
                        fetchRepos={fetchDashboardData}
                    />
                </div>
            </div>
        </div>
    );

    // ── Render: Analytics tab ──
    const renderAnalytics = () => (
        <div className="space-y-6">
            {/* Large Chart */}
            <div className="dashboard-card p-6">
                <h3 className="section-title mb-6">Full Contribution Breakdown</h3>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 13 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                contentStyle={{ backgroundColor: '#1a1a2e', borderColor: '#2a2a3e', borderRadius: '10px', color: '#fff' }}
                            />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={64}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="dashboard-card p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                        <FiGitCommit size={24} />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.commits || 0}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Commits</p>
                </div>
                <div className="dashboard-card p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-3">
                        <FiGitPullRequest size={24} />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.pull_requests || 0}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Pull Requests</p>
                </div>
                <div className="dashboard-card p-6 text-center">
                    <div className="w-12 h-12 mx-auto rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 mb-3">
                        <FiAlertCircle size={24} />
                    </div>
                    <p className="text-3xl font-bold text-white">{stats?.issues || 0}</p>
                    <p className="text-slate-500 text-xs uppercase tracking-widest mt-1">Issues</p>
                </div>
            </div>

            {/* Heatmap Large */}
            <div className="dashboard-card p-6">
                <h3 className="section-title mb-6">Activity Heatmap</h3>
                <div className="flex justify-center">
                    <ContributionHeatmap activityLogs={recentActivity} />
                </div>
            </div>
        </div>
    );

    // ── Render: AI Verify tab ──
    const renderVerify = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="dashboard-card p-6">
                <h3 className="section-title mb-2">AI Repository Verification</h3>
                <p className="text-slate-500 text-sm mb-5">Enter a GitHub repo URL or owner/name to verify its existence and get a health analysis.</p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={verifyUrl}
                        onChange={(e) => setVerifyUrl(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                        placeholder="e.g. facebook/react or https://github.com/owner/repo"
                        className="flex-1 px-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl text-white placeholder-slate-600 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 transition-all"
                    />
                    <button
                        onClick={handleVerify}
                        disabled={verifying || !verifyUrl.trim()}
                        className="cta-verify-btn"
                    >
                        {verifying ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <><FiSearch size={16} /> Verify</>
                        )}
                    </button>
                </div>
            </div>

            {/* Results */}
            {verifyResult && (
                <div className="dashboard-card p-6 animate-fadeInUp">
                    {verifyResult.exists ? (
                        <div className="space-y-6">
                            {/* Header */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
                                    <FiCheckCircle size={24} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-white">{verifyResult.repo.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">{verifyResult.repo.description}</p>
                                </div>
                            </div>

                            {/* Health Score Ring */}
                            <div className="flex items-center justify-center gap-8">
                                <div className="relative w-32 h-32">
                                    <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                                        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                        <circle cx="60" cy="60" r="52" fill="none"
                                            stroke={verifyResult.analysis.healthScore >= 70 ? '#10b981' : verifyResult.analysis.healthScore >= 40 ? '#f59e0b' : '#ef4444'}
                                            strokeWidth="8" strokeLinecap="round"
                                            strokeDasharray={`${verifyResult.analysis.healthScore * 3.27} 327`}
                                            className="transition-all duration-1000"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-3xl font-black text-white">{verifyResult.analysis.healthScore}</span>
                                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">Score</span>
                                    </div>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-white mb-1">AI Verdict</p>
                                    <p className="text-sm text-slate-400">{verifyResult.analysis.verdict}</p>
                                    <p className="text-xs text-slate-600 mt-2">
                                        Last updated {verifyResult.analysis.daysSinceUpdate} days ago
                                    </p>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] text-center">
                                    <FiStar className="mx-auto text-amber-400 mb-1" size={16} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.stars?.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Stars</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] text-center">
                                    <FiGitBranch className="mx-auto text-indigo-400 mb-1" size={16} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.forks?.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Forks</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] text-center">
                                    <FiAlertCircle className="mx-auto text-emerald-400 mb-1" size={16} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.openIssues}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Open Issues</p>
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] text-center">
                                    <FiClock className="mx-auto text-cyan-400 mb-1" size={16} />
                                    <p className="text-lg font-bold text-white">{verifyResult.repo.language}</p>
                                    <p className="text-[10px] text-slate-600 uppercase">Language</p>
                                </div>
                            </div>

                            {/* Details */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="text-slate-500">License: <span className="text-white">{verifyResult.repo.license}</span></div>
                                <div className="text-slate-500">Branch: <span className="text-white">{verifyResult.repo.defaultBranch}</span></div>
                                <div className="text-slate-500">Archived: <span className="text-white">{verifyResult.repo.isArchived ? 'Yes' : 'No'}</span></div>
                                <div className="text-slate-500">Fork: <span className="text-white">{verifyResult.repo.isFork ? 'Yes' : 'No'}</span></div>
                            </div>

                            {/* Topics */}
                            {verifyResult.repo.topics?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {verifyResult.repo.topics.map(t => (
                                        <span key={t} className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Link */}
                            <a href={verifyResult.repo.htmlUrl} target="_blank" rel="noreferrer"
                               className="inline-flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition">
                                <FiExternalLink size={14} /> View on GitHub
                            </a>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center text-red-400 mb-4">
                                <FiXCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Repository Not Found</h3>
                            <p className="text-slate-500 text-sm">{verifyResult.msg}</p>
                            {verifyResult.analysis && (
                                <p className="text-slate-600 text-xs mt-3">{verifyResult.analysis.verdict}</p>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="min-h-screen flex" style={{ background: 'var(--bg-base)', transition: 'background 0.35s ease' }}>
            {/* ──────────── SIDEBAR ──────────── */}
            <aside className={`sidebar ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'} transition-all duration-300`}>
                {/* Logo */}
                <div className="flex items-center gap-3 px-4 pt-5 pb-6">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                        OS
                    </div>
                    {!sidebarCollapsed && (
                        <span className="text-white font-bold text-lg tracking-tight">OSTracker</span>
                    )}
                </div>

                {/* User Info */}
                {!sidebarCollapsed && (
                    <div className="px-4 mb-6">
                        <div className="flex items-center gap-3">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="avatar" className="w-8 h-8 rounded-full border border-slate-700" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-bold">
                                    {user?.username?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{user?.username || 'User'}</p>
                                <p className="text-[10px] text-emerald-400 font-medium">● online</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-1">
                    {NAV_ITEMS.map(item => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`sidebar-nav-item \${isActive ? 'active' : ''}`}
                                title={sidebarCollapsed ? t(item.label) : ''}
                            >
                                <Icon size={18} />
                                {!sidebarCollapsed && <span>{t(item.label)}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* Bottom section */}
                <div className="px-3 pb-5 mt-auto space-y-2">
                    {/* Language Switcher */}
                    <div className="relative group">
                        <button
                            className="sidebar-nav-item w-full"
                            style={{ color: 'var(--text-muted)' }}
                            title={sidebarCollapsed ? "Change Language" : ""}
                        >
                            <FiGlobe size={18} />
                            {!sidebarCollapsed && <span className="flex-1 text-left">{t('dashboard.language')} ({i18n.language.toUpperCase()})</span>}
                        </button>
                        <div className="absolute bottom-full left-0 mb-1 w-48 bg-[#1e293b] border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none group-hover:pointer-events-auto z-50 py-1">
                            {['en', 'hi', 'ta', 'te', 'or', 'mr', 'kn', 'fr', 'ja', 'es'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => i18n.changeLanguage(lang)}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-emerald-500/10 hover:text-emerald-400 \${i18n.language === lang ? 'text-emerald-400 font-bold bg-emerald-500/5' : 'text-slate-300'}`}
                                >
                                    {lang === 'en' && 'English'}
                                    {lang === 'hi' && 'Hindi (हिन्दी)'}
                                    {lang === 'ta' && 'Tamil (தமிழ்)'}
                                    {lang === 'te' && 'Telugu (తెలుగు)'}
                                    {lang === 'or' && 'Odia (ଓଡ଼ିଆ)'}
                                    {lang === 'mr' && 'Marathi (मराठी)'}
                                    {lang === 'kn' && 'Kannada (ಕನ್ನಡ)'}
                                    {lang === 'fr' && 'Français'}
                                    {lang === 'ja' && 'Japanese (日本語)'}
                                    {lang === 'es' && 'Español'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="theme-toggle-btn"
                        title={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                    >
                        {isLight
                            ? <FiMoon size={16} className="text-indigo-400" />
                            : <FiSun size={16} className="text-amber-400" />
                        }
                        {!sidebarCollapsed && (
                            <span className="flex-1 text-left">{isLight ? 'Dark Mode' : 'Light Mode'}</span>
                        )}
                        {!sidebarCollapsed && (
                            <div className={`toggle-pill \${isLight ? '' : 'on'}`}>
                                <div className="toggle-thumb" />
                            </div>
                        )}
                    </button>

                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="sidebar-nav-item"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <FiChevronRight size={18} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
                        {!sidebarCollapsed && <span>Collapse</span>}
                    </button>
                    <button
                        onClick={logout}
                        className="sidebar-nav-item"
                        style={{ color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                        <FiLogOut size={18} />
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* ──────────── MAIN CONTENT ──────────── */}
            <main className="flex-1 p-6 overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
                {/* Error Banner */}
                {loadError && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
                        <span>⚠️ {loadError}</span>
                        <button onClick={fetchDashboardData} className="text-xs font-bold underline hover:text-red-300">Retry</button>
                    </div>
                )}

                {/* Syncing Banner */}
                {syncing && (
                    <div className="mb-4 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-3">
                        <div className="w-4 h-4 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                        <span>Syncing your GitHub data... This may take a moment.</span>
                    </div>
                )}

                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white">
                            {activeTab === 'dashboard' && t('sidebar.dashboard')}
                            {activeTab === 'repos' && t('sidebar.repositories')}
                            {activeTab === 'analytics' && t('sidebar.explore')}
                            {activeTab === 'verify' && t('sidebar.settings')}
                            {activeTab === 'compiler' && 'Online Compiler'}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {activeTab === 'dashboard' && t('dashboard.subtitle')}
                            {activeTab === 'repos' && t('dashboard.subtitle')}
                            {activeTab === 'analytics' && t('dashboard.subtitle')}
                            {activeTab === 'verify' && t('repoForm.verifyText')}
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
