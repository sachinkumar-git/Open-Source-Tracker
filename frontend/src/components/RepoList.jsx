import React from 'react';
import api from '../services/api';
import { FiEdit2, FiTrash2, FiExternalLink, FiGithub, FiActivity, FiTag, FiCalendar } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const RepoList = ({ repos, setCurrentRepo, fetchRepos }) => {
    const { t } = useTranslation();

    const onDelete = async (id) => {
        if(window.confirm(t('repoList.deleteConfirm', 'Are you sure you want to remove this repository from tracking?'))) {
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
                <div className="w-16 h-16 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center text-slate-600 mb-6 border border-slate-700/30">
                    <FiGithub size={32} />
                </div>
                <h3 className="text-xl text-white font-bold mb-2 tracking-tight">{t('repoList.noActiveTitle', 'No Active Workspace')}</h3>
                <p className="text-slate-500 max-w-xs mx-auto text-sm leading-relaxed">
                    {t('repoList.noActiveDesc', "You haven't added any repositories to track yet. Use the form on the left to start monitoring your OSS contributions.")}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="section-title">{t('repoList.trackedRepos', 'Tracked Repositories')}</h3>
                <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
                    {repos.length} {t('repoList.total', 'Total')}
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {repos.map((repo, idx) => (
                    <div key={repo._id || idx} 
                         className="dashboard-card group hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0 pr-4">
                                    <h4 className="text-base font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                                        {repo.repoName || repo.repo_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`tag-badge ${
                                            repo.language === 'JavaScript' ? 'tag-yellow' :
                                            repo.language === 'Python' ? 'tag-green' :
                                            repo.language === 'TypeScript' ? 'tag-emerald' :
                                            'tag-teal'
                                        }`}>
                                            {repo.language || t('repoList.unknown', 'Unknown')}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            repo.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                                            repo.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' :
                                            'bg-slate-700/50 text-slate-400'
                                        }`}>
                                            {repo.status === 'Active' ? t('repoList.active', 'Active') : repo.status === 'Completed' ? t('repoList.completed', 'Completed') : t('repoList.exploring', 'Exploring')}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <a href={repo.repoUrl || repo.repo_url} 
                                       target="_blank" 
                                       rel="noopener noreferrer" 
                                       className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                       title="View Repo">
                                        <FiExternalLink size={14} />
                                    </a>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-2 text-slate-400 text-xs">
                                    <FiActivity size={12} className="text-slate-600" />
                                    <span>{t('repoList.lastActivity', 'Last Activity')}: {t('repoList.justNow', 'Just now')}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-xs text-right justify-end">
                                    <FiCalendar size={12} className="text-slate-600" />
                                    <span>{t('repoList.added', 'Added')} {t('repoList.apr2026', 'Apr 2026')}</span>
                                </div>
                            </div>

                            {repo.notes && (
                                <div className="bg-slate-900/30 rounded-lg p-3 border border-slate-800/50 mb-4 h-16 overflow-hidden">
                                    <div className="flex items-start gap-2">
                                        <FiTag size={12} className="mt-0.5 text-slate-600" />
                                        <p className="text-xs text-slate-400 leading-relaxed italic line-clamp-2">
                                            {repo.notes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                                <span className="text-[10px] font-mono text-slate-600 uppercase tracking-tighter">ID: #{String(repo._id || idx).slice(-4)}</span>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setCurrentRepo(repo)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-all border border-transparent hover:border-emerald-500/20"
                                    >
                                        <FiEdit2 size={12} /> {t('repoList.edit', 'Edit')}
                                    </button>
                                    <button 
                                        onClick={() => onDelete(repo._id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent hover:border-red-500/20"
                                    >
                                        <FiTrash2 size={12} /> {t('repoList.delete', 'Delete')}
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
