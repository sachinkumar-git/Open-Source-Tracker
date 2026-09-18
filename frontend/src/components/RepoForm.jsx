import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FiPlus, FiEdit2, FiSave, FiX, FiLink, FiTag, FiCpu, FiActivity } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

const RepoForm = ({ currentRepo, clearCurrent, fetchRepos }) => {
    const { t } = useTranslation();
    const [repo, setRepo] = useState({
        repoName: '',
        repoUrl: '',
        language: '',
        status: 'Exploring',
        notes: ''
    });

    useEffect(() => {
        if (currentRepo !== null) {
            setRepo(currentRepo);
        } else {
            setRepo({
                repoName: '',
                repoUrl: '',
                language: '',
                status: 'Exploring',
                notes: ''
            });
        }
    }, [currentRepo]);

    const { repoName, repoUrl, language, status, notes } = repo;

    const onChange = e => setRepo({ ...repo, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            if (currentRepo === null) {
                await api.post('/repos', repo);
            } else {
                await api.put(`/repos/${currentRepo._id}`, repo);
            }
            clearAll();
            fetchRepos();
        } catch (err) {
            console.error(err.response?.data?.msg || 'Error saving repo');
        }
    };

    const clearAll = () => {
        clearCurrent();
        setRepo({
            repoName: '',
            repoUrl: '',
            language: '',
            status: 'Exploring',
            notes: ''
        });
    };

    return (
        <div className="dashboard-card p-6 animate-fadeInUp">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    {currentRepo ? <FiEdit2 size={20} /> : <FiPlus size={20} />}
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white leading-tight">
                        {currentRepo ? t('repoForm.updateRepo') : t('repoForm.trackNew')}
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                        {currentRepo ? t('repoForm.updateDesc') : t('repoForm.trackDesc')}
                    </p>
                </div>
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('repoForm.repoName')}</label>
                    <div className="relative group">
                        <FiTag className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="e.g. awesome-project"
                            name="repoName"
                            value={repoName}
                            onChange={onChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('repoForm.repoUrl')}</label>
                    <div className="relative group">
                        <FiLink className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="https://github.com/user/repo"
                            name="repoUrl"
                            value={repoUrl}
                            onChange={onChange}
                            required
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('repoForm.language')}</label>
                        <input
                            type="text"
                            placeholder="JavaScript"
                            name="language"
                            value={language}
                            onChange={onChange}
                            className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('repoForm.priority')}</label>
                        <div className="relative group">
                            <FiActivity className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                            <select
                                name="status"
                                value={status}
                                onChange={onChange}
                                className="w-full px-4 py-2.5 bg-slate-800/40 border border-slate-700/50 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 outline-none appearance-none cursor-pointer"
                            >
                                <option value="Exploring">{t('repoForm.exploring')}</option>
                                <option value="Active">{t('repoForm.active')}</option>
                                <option value="Completed">{t('repoForm.completed')}</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{t('repoForm.notes')}</label>
                    <textarea
                        placeholder={t('repoForm.notesPlaceholder')}
                        name="notes"
                        value={notes}
                        onChange={onChange}
                        rows="4"
                        className="w-full px-4 py-3 bg-slate-800/40 border border-slate-700/50 rounded-xl text-white placeholder-slate-600 focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none transition-all"
                    />
                </div>

                <div className="flex gap-3 pt-2">
                    <button
                        type="submit"
                        className="flex-1 flex justify-center items-center gap-2 py-3 px-4 shadow-lg text-sm font-bold rounded-xl text-white bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                    >
                        {currentRepo ? <FiSave size={16} /> : <FiPlus size={16} />}
                        {currentRepo ? t('repoForm.saveChanges') : t('repoForm.trackRepository')}
                    </button>
                    {currentRepo && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white hover:border-slate-500 transition-all"
                            title="Cancel Edit"
                        >
                            <FiX size={16} />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default RepoForm;
