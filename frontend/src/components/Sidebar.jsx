import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { FiGrid, FiFolder, FiBarChart2, FiSearch, FiGitCommit, FiGlobe, FiChevronRight, FiLogOut, FiSun, FiMoon } from 'react-icons/fi';

const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: FiGrid },
    { id: 'repos', label: 'Repositories', icon: FiFolder },
    { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
    { id: 'verify', label: 'Verify Repo', icon: FiSearch },
    { id: 'compiler', label: 'Compiler', icon: FiGitCommit },
];

const Sidebar = ({ user, activeTab, setActiveTab, sidebarCollapsed, setSidebarCollapsed, logout }) => {
    const { theme, toggleTheme } = useTheme();
    const isLight = theme === 'light';

    return (
        <aside className={`sidebar ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'} transition-all duration-200`}>
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
                            className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                            title={sidebarCollapsed ? item.label : ''}
                        >
                            <Icon size={18} />
                            {!sidebarCollapsed && <span>{item.label}</span>}
                        </button>
                    );
                })}
            </nav>

            {/* Bottom */}
            <div className="px-3 pb-5 mt-auto space-y-1">
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
                        <div className={`toggle-pill ${isLight ? '' : 'on'}`}>
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
                    className="sidebar-nav-item hover:!text-red-400"
                    style={{ color: 'var(--text-muted)' }}
                >
                    <FiLogOut size={18} />
                    {!sidebarCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
