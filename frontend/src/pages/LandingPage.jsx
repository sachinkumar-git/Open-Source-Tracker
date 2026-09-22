import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiGitCommit, FiGitPullRequest, FiAlertCircle, FiArrowRight, FiGithub, FiBarChart2, FiShield, FiZap, FiGrid, FiTrendingUp, FiStar } from 'react-icons/fi';

// ── Animated Counter ──
const AnimatedCounter = ({ target, suffix = '' }) => {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setVisible(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!visible) return;
        let start = 0;
        const increment = target / 120;
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [visible, target]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ── TypeWriter ──
const TypeWriter = ({ words, typingSpeed = 100, deletingSpeed = 60, pauseTime = 2000 }) => {
    const [text, setText] = useState('');
    const [wordIndex, setWordIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentWord = words[wordIndex];
        if (!currentWord) return;
        let timeout;

        if (!isDeleting && text === currentWord) {
            timeout = setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && text === '') {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
        } else {
            timeout = setTimeout(() => {
                setText(currentWord.substring(0, text.length + (isDeleting ? -1 : 1)));
            }, isDeleting ? deletingSpeed : typingSpeed);
        }

        return () => clearTimeout(timeout);
    }, [text, isDeleting, wordIndex, words, typingSpeed, deletingSpeed, pauseTime]);

    return (
        <span className="gradient-text">{text}<span className="typing-cursor">|</span></span>
    );
};

// ── Main Landing Page ──
const LandingPage = () => {
    const features = [
        { icon: FiGithub, title: 'GitHub OAuth', desc: 'One-click authentication. Connect your GitHub account and sync your data instantly.', color: 'emerald' },
        { icon: FiBarChart2, title: 'Live Analytics', desc: 'Interactive dashboards with Recharts. Visualize commits, PRs, and issues over time.', color: 'indigo' },
        { icon: FiTrendingUp, title: 'Activity Heatmap', desc: 'GitHub-style contribution grid showing your daily coding rhythm across weeks.', color: 'amber' },
        { icon: FiShield, title: 'JWT Security', desc: 'Secure token-based authentication with password and OTP login options.', color: 'cyan' },
        { icon: FiZap, title: 'Real-time Sync', desc: 'Pull the latest data from GitHub API with one click. All metrics refresh instantly.', color: 'rose' },
        { icon: FiGrid, title: 'Multi-View Dashboard', desc: 'Dashboard, Repositories, Analytics, Repo Verification, and Online Compiler tabs.', color: 'violet' },
    ];

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 w-full z-50 nav-glass">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-xs">
                            OS
                        </div>
                        <span className="text-white font-bold text-lg tracking-tight">OSTracker</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="nav-link">Features</a>
                        <a href="#stats" className="nav-link">Stats</a>
                        <a href="#preview" className="nav-link">Preview</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
                            Sign In
                        </Link>
                        <Link to="/register" className="cta-btn">
                            Get Started <FiArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO ── */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="grid-bg"></div>

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium text-slate-400 bg-white/[0.03] border border-white/[0.06] mb-8 hero-fade" style={{ animationDelay: '0.1s' }}>
                        <FiStar className="text-emerald-400" size={12} />
                        Open Source Contribution Tracker
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-8">
                        <span className="block text-white hero-fade" style={{ animationDelay: '0.15s' }}>Track Your</span>
                        <span className="block mt-2 hero-fade" style={{ animationDelay: '0.25s' }}>
                            <TypeWriter words={['Open Source', 'GitHub', 'Contributions', 'Impact']} />
                        </span>
                        <span className="block text-white mt-2 hero-fade" style={{ animationDelay: '0.35s' }}>Journey</span>
                    </h1>

                    <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed hero-fade" style={{ animationDelay: '0.45s' }}>
                        Monitor commits, pull requests, and issues across repositories. Visualize your impact with clean analytics and real-time GitHub sync.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 hero-fade" style={{ animationDelay: '0.55s' }}>
                        <Link to="/register" className="cta-primary group">
                            <FiGithub size={18} />
                            Start Tracking Free
                            <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                        <a href="#preview" className="cta-secondary">
                            <FiGrid size={16} />
                            See Dashboard
                        </a>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center mt-12 hero-fade" style={{ animationDelay: '0.65s' }}>
                        {['React', 'Node.js', 'Supabase', 'GitHub API', 'Recharts'].map((tech) => (
                            <span key={tech} className="text-xs font-medium text-slate-600 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05]">
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="relative py-24 px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="section-badge">Features</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-6 tracking-tight">
                            Built for <span className="gradient-text">Developers</span>
                        </h2>
                        <p className="text-slate-500 mt-4 max-w-lg mx-auto">
                            Tools to track, analyze, and showcase your open source contributions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((f) => (
                            <div key={f.title} className="feature-card">
                                <div className={`w-10 h-10 rounded-lg bg-${f.color}-500/10 text-${f.color}-400 flex items-center justify-center mb-4`}>
                                    <f.icon size={20} />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-2">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section id="stats" className="relative py-24 px-6 z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { num: 10000, suffix: '+', label: 'Commits Tracked', color: 'text-emerald-400' },
                            { num: 500, suffix: '+', label: 'Repositories', color: 'gradient-text' },
                            { num: 99, suffix: '%', label: 'Uptime', color: 'text-white' },
                        ].map((s) => (
                            <div key={s.label} className="stats-card">
                                <h3 className={`text-4xl md:text-5xl font-extrabold ${s.color}`}>
                                    <AnimatedCounter target={s.num} suffix={s.suffix} />
                                </h3>
                                <p className="text-slate-600 mt-3 text-xs uppercase tracking-widest font-medium">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── PREVIEW ── */}
            <section id="preview" className="relative py-24 px-6 z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="section-badge">Preview</span>
                        <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-6 tracking-tight">
                            Your contribution <span className="gradient-text">command center</span>
                        </h2>
                    </div>

                    <div className="dashboard-preview">
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                            <span className="ml-4 text-[11px] text-slate-600 font-mono">OSTracker — Dashboard</span>
                        </div>

                        <div className="flex">
                            {/* Mini Sidebar */}
                            <div className="w-40 border-r border-white/[0.04] p-4 hidden md:block">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-white font-black text-[7px]">OS</div>
                                    <span className="text-white font-bold text-xs">OSTracker</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
                                        <FiGrid size={11} /> Dashboard
                                    </div>
                                    <div className="flex items-center gap-2 px-2 py-1.5 text-slate-600 text-[11px]">
                                        <FiBarChart2 size={11} /> Analytics
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    {[
                                        { icon: FiGitCommit, val: '247', label: 'Commits', c: 'text-emerald-400' },
                                        { icon: FiGitPullRequest, val: '34', label: 'PRs', c: 'text-indigo-400' },
                                        { icon: FiAlertCircle, val: '18', label: 'Issues', c: 'text-amber-400' },
                                        { icon: FiStar, val: '12', label: 'Repos', c: 'text-purple-400' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                                            <div className={`${s.c} mb-1`}><s.icon size={14} /></div>
                                            <p className="text-lg font-bold text-white">{s.val}</p>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/[0.02] rounded-lg p-4 border border-white/[0.04]">
                                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-medium mb-3">Activity</p>
                                    <div className="flex gap-1">
                                        {Array.from({ length: 28 }).map((_, i) => {
                                            const intensity = (i * 7) % 5;
                                            const colors = ['bg-slate-800', 'bg-emerald-900/60', 'bg-emerald-700/80', 'bg-emerald-500', 'bg-emerald-400'];
                                            return <div key={i} className={`w-3 h-3 rounded-sm ${colors[intensity]}`} />;
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="relative py-24 px-6 z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-6">
                        Ready to track your <span className="gradient-text">impact</span>?
                    </h2>
                    <p className="text-slate-500 mb-8 max-w-md mx-auto">
                        Join developers who visualize their open source journey with OSTracker.
                    </p>
                    <Link to="/register" className="cta-primary inline-flex group">
                        <FiGithub size={18} />
                        Get Started Now
                        <FiArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/[0.04] py-8 px-6 relative z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white font-black text-[9px]">OS</div>
                        <span className="text-slate-600 text-sm">OSTracker © {new Date().getFullYear()}</span>
                    </div>
                    <span className="text-slate-700 text-xs">Built with React · Node.js · Supabase · GitHub API</span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
