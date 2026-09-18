import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiGitCommit, FiGitPullRequest, FiAlertCircle, FiArrowRight, FiGithub, FiBarChart2, FiShield, FiZap, FiGrid, FiTrendingUp, FiChevronDown, FiStar, FiGlobe } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

// ══════════════════════════════════════
// PARTICLE SYSTEM
// ══════════════════════════════════════
const ParticleField = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles
        for (let i = 0; i < 80; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.5 + 0.1,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach((p, i) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0) p.x = canvas.width;
                if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height;
                if (p.y > canvas.height) p.y = 0;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(16, 185, 129, ${p.opacity})`;
                ctx.fill();

                // Connect nearby particles
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = p.x - particles[j].x;
                    const dy = p.y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(16, 185, 129, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            });

            animId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// ══════════════════════════════════════
// 3D FLOATING OBJECT
// ══════════════════════════════════════
const FloatingObject3D = ({ shape, size, color, top, left, delay, duration }) => {
    const style = {
        position: 'absolute',
        width: size,
        height: size,
        top,
        left,
        animation: `float3D ${duration || '8s'} ease-in-out ${delay || '0s'} infinite`,
    };

    if (shape === 'cube') {
        return (
            <div style={style} className="floating-3d-wrapper">
                <div className="cube-3d" style={{ width: size, height: size }}>
                    <div className="cube-face front" style={{ background: color, width: size, height: size }}></div>
                    <div className="cube-face back" style={{ background: color, width: size, height: size }}></div>
                    <div className="cube-face left" style={{ background: color, width: size, height: size }}></div>
                    <div className="cube-face right" style={{ background: color, width: size, height: size }}></div>
                    <div className="cube-face top" style={{ background: color, width: size, height: size }}></div>
                    <div className="cube-face bottom" style={{ background: color, width: size, height: size }}></div>
                </div>
            </div>
        );
    }

    if (shape === 'ring') {
        return (
            <div style={style} className="floating-3d-wrapper">
                <div className="ring-3d" style={{
                    width: size, height: size,
                    border: `2px solid ${color}`,
                    borderRadius: '50%',
                    boxShadow: `0 0 20px ${color}, inset 0 0 20px ${color}`,
                }}></div>
            </div>
        );
    }

    if (shape === 'sphere') {
        return (
            <div style={style} className="floating-3d-wrapper">
                <div className="sphere-3d" style={{
                    width: size, height: size,
                    background: `radial-gradient(circle at 30% 30%, ${color}, transparent 70%)`,
                    borderRadius: '50%',
                    boxShadow: `0 0 40px ${color}`,
                }}></div>
            </div>
        );
    }

    // Diamond/octahedron
    return (
        <div style={style} className="floating-3d-wrapper">
            <div className="diamond-3d" style={{
                width: size, height: size,
                background: color,
            }}></div>
        </div>
    );
};

// ══════════════════════════════════════
// ANIMATED COUNTER
// ══════════════════════════════════════
const AnimatedCounter = ({ target, duration = 2000, suffix = '' }) => {
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
        const increment = target / (duration / 16);
        const timer = setInterval(() => {
            start += increment;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [visible, target, duration]);

    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
};

// ══════════════════════════════════════
// TILT CARD (3D mouse-tracking)
// ══════════════════════════════════════
const TiltCard = ({ children, className = '' }) => {
    const cardRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = -(y - centerY) / 12;
        const rotateY = (x - centerX) / 12;
        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (card) card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    }, []);

    return (
        <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}
             className={`tilt-card ${className}`} style={{ transition: 'transform 0.15s ease-out' }}>
            {children}
        </div>
    );
};

// ══════════════════════════════════════
// TYPEWRITER
// ══════════════════════════════════════
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

// ══════════════════════════════════════
// HEATMAP PREVIEW
// ══════════════════════════════════════
const HeatmapPreview = () => {
    const rows = 5, cols = 14;
    const colors = ['bg-[#161b22]', 'bg-emerald-900/60', 'bg-emerald-700/80', 'bg-emerald-500', 'bg-emerald-400'];
    return (
        <div className="flex flex-col gap-[3px]">
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex gap-[3px]">
                    {Array.from({ length: cols }).map((_, c) => {
                        const seed = (r * cols + c) * 17 % 10;
                        const i = seed < 2 ? 0 : seed < 4 ? 1 : seed < 6 ? 2 : seed < 8 ? 3 : 4;
                        return (
                            <div key={c}
                                className={`w-[12px] h-[12px] rounded-[2px] ${colors[i]} heatmap-cell`}
                                style={{ animationDelay: `${(r * cols + c) * 25}ms` }}
                            />
                        );
                    })}
                </div>
            ))}
        </div>
    );
};

// ══════════════════════════════════════
// MAIN LANDING PAGE
// ══════════════════════════════════════
const LandingPage = () => {
    const { t, i18n } = useTranslation();
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [langDropdownOpen, setLangDropdownOpen] = useState(false);

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
        setLangDropdownOpen(false);
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'te', name: 'తెలుగు' },
        { code: 'or', name: 'ଓଡ଼ିଆ' },
        { code: 'mr', name: 'मराठी' },
        { code: 'kn', name: 'ಕನ್ನಡ' },
        { code: 'fr', name: 'Français' },
        { code: 'ja', name: '日本語' },
        { code: 'es', name: 'Español' }
    ];

    useEffect(() => {
        const handleMouse = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 2,
                y: (e.clientY / window.innerHeight - 0.5) * 2,
            });
        };
        window.addEventListener('mousemove', handleMouse);
        return () => window.removeEventListener('mousemove', handleMouse);
    }, []);

    const typewriterWords = t('landing.typewriter', { returnObjects: true });
    const twWords = Array.isArray(typewriterWords) ? typewriterWords : ['Open Source', 'GitHub', 'Contributions', 'Impact'];

    return (
        <div className="min-h-screen bg-[#030306] text-white overflow-hidden">
            {/* Particle System */}
            <ParticleField />

            {/* 3D Floating Objects */}
            <div className="fixed inset-0 pointer-events-none z-[1]"
                 style={{ transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)` }}>
                <FloatingObject3D shape="cube" size="40px" color="rgba(16,185,129,0.15)" top="15%" left="8%" delay="0s" duration="10s" />
                <FloatingObject3D shape="ring" size="60px" color="rgba(99,102,241,0.2)" top="25%" left="85%" delay="1.5s" duration="12s" />
                <FloatingObject3D shape="sphere" size="30px" color="rgba(245,158,11,0.15)" top="70%" left="12%" delay="3s" duration="9s" />
                <FloatingObject3D shape="diamond" size="35px" color="rgba(16,185,129,0.12)" top="60%" left="90%" delay="2s" duration="11s" />
                <FloatingObject3D shape="cube" size="25px" color="rgba(139,92,246,0.12)" top="80%" left="50%" delay="4s" duration="13s" />
                <FloatingObject3D shape="ring" size="45px" color="rgba(16,185,129,0.15)" top="10%" left="55%" delay="0.5s" duration="14s" />
                <FloatingObject3D shape="sphere" size="20px" color="rgba(236,72,153,0.1)" top="45%" left="75%" delay="2.5s" duration="8s" />
            </div>

            {/* Gradient mesh background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute w-[800px] h-[800px] top-[-300px] left-[-200px] rounded-full"
                     style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%)', transform: `translate(${mousePos.x * -20}px, ${mousePos.y * -20}px)` }}></div>
                <div className="absolute w-[600px] h-[600px] top-[200px] right-[-200px] rounded-full"
                     style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)', transform: `translate(${mousePos.x * 25}px, ${mousePos.y * 25}px)` }}></div>
                <div className="absolute w-[500px] h-[500px] bottom-[-100px] left-[30%] rounded-full"
                     style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 60%)', transform: `translate(${mousePos.x * -10}px, ${mousePos.y * -10}px)` }}></div>
            </div>

            {/* ── NAVBAR ── */}
            <nav className="fixed top-0 w-full z-50 nav-glass">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-sm logo-glow">
                            OS
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">OSTracker</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="nav-link-fancy">{t('landing.navFeatures', 'Features')}</a>
                        <a href="#stats" className="nav-link-fancy">{t('landing.navStats', 'Stats')}</a>
                        <a href="#preview" className="nav-link-fancy">{t('landing.navPreview', 'Preview')}</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button 
                                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5"
                            >
                                <FiGlobe size={14} className={langDropdownOpen ? "text-emerald-400" : ""} />
                                <span className="uppercase">{i18n.language.substring(0,2)}</span>
                                <FiChevronDown size={12} className={`transition-transform ${langDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                            </button>
                            
                            {langDropdownOpen && (
                                <div className="absolute top-10 right-0 w-36 bg-[#0f1115] border border-white/10 rounded-xl shadow-2xl py-2 z-50 animate-fadeInUp" style={{ animationDuration: '0.2s' }}>
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => changeLanguage(lang.code)}
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                i18n.language.startsWith(lang.code) 
                                                ? 'bg-emerald-500/10 text-emerald-400 font-bold' 
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <Link to="/login" className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-4 py-2">
                            {t('landing.navSignIn', 'Sign In')}
                        </Link>
                        <Link to="/register" className="cta-btn-glow">
                            {t('landing.navGetStarted', 'Get Started')} <FiArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* ── HERO SECTION ── */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
                <div className="grid-bg"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="hero-badge-glow mb-8">
                        <FiStar className="text-emerald-400" size={12} />
                        <span>{t('landing.badge', 'The Modern Open Source Tracker')}</span>
                    </div>

                    {/* Title with typewriter */}
                    <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black leading-[1] tracking-tight mb-8">
                        <span className="block text-white hero-fade" style={{ animationDelay: '0.1s' }}>{t('landing.title1', 'Track Your')}</span>
                        <span className="block mt-2 hero-fade" style={{ animationDelay: '0.3s' }}>
                            <TypeWriter words={twWords} />
                        </span>
                        <span className="block text-white mt-2 hero-fade" style={{ animationDelay: '0.5s' }}>{t('landing.title2', 'Journey')}</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed hero-fade" style={{ animationDelay: '0.6s' }}>
                        {t('landing.subtitle', 'Monitor commits, pull requests, and issues across repositories. Visualize your impact with stunning analytics and real-time sync.')}
                    </p>

                    {/* CTA */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 hero-fade" style={{ animationDelay: '0.8s' }}>
                        <Link to="/register" className="cta-primary-3d group">
                            <FiGithub size={20} />
                            {t('landing.startFree', 'Start Tracking Free')}
                            <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <a href="#preview" className="cta-secondary-glass">
                            <FiGrid size={18} />
                            {t('landing.viewDemo', 'View Demo')}
                        </a>
                    </div>

                    {/* Floating tech badges */}
                    <div className="flex flex-wrap gap-4 justify-center mt-16 hero-fade" style={{ animationDelay: '1s' }}>
                        {['React', 'Node.js', 'Supabase', 'GitHub API', 'Recharts'].map((tech, i) => (
                            <span key={tech} className="tech-badge" style={{ animationDelay: `${1 + i * 0.1}s` }}>
                                {tech}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 scroll-indicator">
                    <div className="scroll-mouse">
                        <div className="scroll-dot"></div>
                    </div>
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" className="relative py-32 px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="section-badge-glow">✦ {t('landing.navFeatures', 'Features')}</span>
                        <h2 className="text-4xl md:text-6xl font-black text-white mt-6 tracking-tight">
                            {t('landing.builtFor1', 'Built for')} <span className="gradient-text">{t('landing.builtFor2', 'Developers')}</span>
                        </h2>
                        <p className="text-slate-500 mt-4 max-w-lg mx-auto text-lg">
                            {t('landing.featuresSub', 'Powerful tools to track, analyze, and showcase your open source journey.')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: FiGithub, title: t('landing.f1Title', 'GitHub OAuth'), desc: t('landing.f1Desc', 'One-click secure authentication. Sync all your data in seconds.'), color: 'emerald' },
                            { icon: FiBarChart2, title: t('landing.f2Title', 'Live Analytics'), desc: t('landing.f2Desc', 'Interactive Recharts dashboards. Commits, PRs, issues visualized.'), color: 'indigo' },
                            { icon: FiTrendingUp, title: t('landing.f3Title', 'Activity Heatmap'), desc: t('landing.f3Desc', 'GitHub-style contribution grid showing your coding rhythm.'), color: 'amber' },
                            { icon: FiShield, title: t('landing.f4Title', 'JWT Security'), desc: t('landing.f4Desc', 'Enterprise-grade token authentication. Data encrypted end-to-end.'), color: 'cyan' },
                            { icon: FiZap, title: t('landing.f5Title', 'Instant Sync'), desc: t('landing.f5Desc', 'One-click pulls latest GitHub data and refreshes all metrics.'), color: 'rose' },
                            { icon: FiGrid, title: t('landing.f6Title', 'Multi-View Dashboard'), desc: t('landing.f6Desc', 'Dashboard, Repositories, and Analytics tabs. Collapsible sidebar.'), color: 'violet' },
                        ].map((f, i) => (
                            <TiltCard key={f.title} className="feature-card-3d">
                                <div className={`feature-icon-glow bg-${f.color}-500/10 text-${f.color}-400`}>
                                    <f.icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-white mt-5 mb-2">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                                <div className={`feature-line bg-${f.color}-500`}></div>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── STATS ── */}
            <section id="stats" className="relative py-32 px-6 z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { num: 10000, suffix: '+', label: t('landing.stat1', 'Commits Tracked'), color: 'text-emerald-400' },
                            { num: 500, suffix: '+', label: t('landing.stat2', 'Repositories'), color: 'gradient-text' },
                            { num: 99, suffix: '%', label: t('landing.stat3', 'Uptime'), color: 'text-white' },
                        ].map((s, i) => (
                            <TiltCard key={s.label} className="stats-card-3d">
                                <h3 className={`text-5xl md:text-6xl font-black ${s.color}`}>
                                    <AnimatedCounter target={s.num} suffix={s.suffix} />
                                </h3>
                                <p className="text-slate-600 mt-3 text-xs uppercase tracking-[0.2em] font-semibold">{s.label}</p>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── DASHBOARD PREVIEW ── */}
            <section id="preview" className="relative py-32 px-6 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="section-badge-glow">✦ {t('landing.navPreview', 'Preview')}</span>
                        <h2 className="text-4xl md:text-6xl font-black text-white mt-6 tracking-tight">
                            {t('landing.previewTitle1', 'A dashboard that')} <span className="gradient-text">{t('landing.previewTitle2', 'inspires')}</span>
                        </h2>
                    </div>

                    {/* 3D Perspective Dashboard */}
                    <div className="dashboard-preview-3d"
                         style={{
                             transform: `perspective(2000px) rotateX(${2 + mousePos.y * 3}deg) rotateY(${mousePos.x * 3}deg)`,
                         }}>
                        {/* Window chrome */}
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
                            <div className="w-3 h-3 rounded-full bg-[#ff5f57]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#febc2e]"></div>
                            <div className="w-3 h-3 rounded-full bg-[#28c840]"></div>
                            <span className="ml-4 text-[11px] text-slate-600 font-mono">OSTracker — {t('landing.navDashboard', 'Dashboard')}</span>
                        </div>

                        <div className="flex">
                            {/* Mini Sidebar */}
                            <div className="w-44 border-r border-white/[0.04] p-4 hidden md:block">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-[8px]">OS</div>
                                    <span className="text-white font-bold text-xs">OSTracker</span>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-[11px] font-medium">
                                        <FiGrid size={12} /> {t('landing.navDashboard', 'Dashboard')}
                                    </div>
                                    <div className="flex items-center gap-2 px-2.5 py-1.5 text-slate-600 text-[11px]">
                                        <FiBarChart2 size={12} /> {t('landing.navAnalytics', 'Analytics')}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 p-5">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    {[
                                        { icon: FiGitCommit, val: '247', label: t('landing.stat1', 'Commits'), c: 'text-emerald-400' },
                                        { icon: FiGitPullRequest, val: '34', label: 'PRs', c: 'text-indigo-400' },
                                        { icon: FiAlertCircle, val: '18', label: t('landing.f2Issues', 'Issues'), c: 'text-amber-400' },
                                        { icon: FiStar, val: '12', label: t('landing.stat2Short', 'Repos'), c: 'text-purple-400' },
                                    ].map(s => (
                                        <div key={s.label} className="bg-white/[0.02] rounded-xl p-3 border border-white/[0.04] preview-stat-pop">
                                            <div className={`${s.c} mb-1`}><s.icon size={14} /></div>
                                            <p className="text-lg font-bold text-white">{s.val}</p>
                                            <p className="text-[9px] text-slate-600 uppercase tracking-wider">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-white/[0.02] rounded-xl p-4 border border-white/[0.04]">
                                    <p className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-3">{t('landing.activityGraph', 'Activity Graph')}</p>
                                    <HeatmapPreview />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── FINAL CTA ── */}
            <section className="relative py-32 px-6 z-10">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">
                        {t('landing.ready1', 'Ready to track your')}<br /><span className="gradient-text">{t('landing.ready2', 'impact')}</span>?
                    </h2>
                    <p className="text-slate-500 mb-10 max-w-md mx-auto text-lg">
                        {t('landing.join', 'Join developers who visualize their open source journey with OSTracker.')}
                    </p>
                    <Link to="/register" className="cta-primary-3d inline-flex group">
                        <FiGithub size={20} />
                        {t('landing.getStartedNow', 'Get Started Now')}
                        <FiArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="border-t border-white/[0.04] py-10 px-6 relative z-10">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-[10px]">OS</div>
                        <span className="text-slate-700 text-sm">OSTracker © {new Date().getFullYear()}</span>
                    </div>
                    <span className="text-slate-800 text-xs">Built with MERN Stack + Supabase + GitHub API</span>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
