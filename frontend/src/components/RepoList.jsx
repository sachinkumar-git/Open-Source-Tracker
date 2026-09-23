import React from 'react';
import api from '../services/api';
import { FiEdit2, FiTrash2, FiExternalLink, FiGithub, FiTag, FiCalendar } from 'react-icons/fi';

// Format a date string into a relative or short format
const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Unknown';

    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString([], { month: 'short', year: 'numeric' });
};

const RepoList = ({ repos, setCurrentRepo, fetchRepos }) => {

    const onDelete = async (id) => {
        if (window.confirm('Are you sure you want to remove this repository from tracking?')) {
            try {
                await api.delete(`/repos/${id}`);
                fetchRepos();
            } catch (err) {
                console.error('Error deleting repo', err);
            }
        }
    };

    if (repos.length === 0) {
        return (
            <div className="dashboard-card p-12 text-center animate-fadeInUp">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-5 border border-slate-700/30">
                    <FiGithub size={28} />
                </div>
                <h3 className="text-lg text-white font-bold mb-2 tracking-tight">No Repositories</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm">
                    You haven't added any repositories to track yet. Use the form to start monitoring your contributions.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="section-title">Tracked Repositories</h3>
                <span className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
                    {repos.length} Total
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos.map((repo, idx) => (
                    <div key={repo._id || idx}
                         className="dashboard-card group hover:border-emerald-500/20 transition-all">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="text-base font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                                        {repo.repoName || repo.repo_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className={`tag-badge ${
                                            repo.language === 'JavaScript' ? 'tag-yellow' :
                                            repo.language === 'Python' ? 'tag-green' :
                                            repo.language === 'TypeScript' ? 'tag-emerald' :
                                            'tag-teal'
                                        }`}>
                                            {repo.language || 'Unknown'}
                                        </span>
                                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                            repo.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                            repo.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300' :
                                            'bg-slate-700/50 text-slate-400'
                                        }`}>
                                            {repo.status || 'Exploring'}
                                        </span>
                                    </div>
                                </div>
                                <a href={repo.repoUrl || repo.repo_url}
                                   target="_blank"
                                   rel="noopener noreferrer"
                                   className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                   title="View Repo">
                                    <FiExternalLink size={14} />
                                </a>
                            </div>

                            <div className="flex items-center gap-4 mb-3 text-xs text-slate-500">
                                <div className="flex items-center gap-1.5">
                                    <FiCalendar size={11} className="text-slate-600" />
                                    <span>Added {formatDate(repo.created_at || repo.createdAt)}</span>
                                </div>
                            </div>

                            {repo.notes && (
                                <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50 mb-3">
                                    <div className="flex items-start gap-2">
                                        <FiTag size={11} className="mt-0.5 text-slate-600 flex-shrink-0" />
                                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                                            {repo.notes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                                <span className="text-[10px] font-mono text-slate-700">#{String(repo._id || idx).slice(-4)}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setCurrentRepo(repo)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all"
                                    >
                                        <FiEdit2 size={11} /> Edit
                                    </button>
                                    <button
                                        onClick={() => onDelete(repo._id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                    >
                                        <FiTrash2 size={11} /> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RepoList;
