import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { FiLogIn, FiMail, FiLock, FiShield, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

/* Floating particles config */
const PARTICLES = [
    { size: 3, left: '12%', delay: '0s',  duration: '14s', color: 'rgba(16,185,129,0.5)' },
    { size: 2, left: '28%', delay: '3s',  duration: '18s', color: 'rgba(99,102,241,0.4)' },
    { size: 4, left: '55%', delay: '1s',  duration: '12s', color: 'rgba(16,185,129,0.3)' },
    { size: 2, left: '70%', delay: '5s',  duration: '16s', color: 'rgba(245,158,11,0.35)' },
    { size: 3, left: '85%', delay: '2s',  duration: '20s', color: 'rgba(16,185,129,0.4)' },
    { size: 2, left: '40%', delay: '7s',  duration: '11s', color: 'rgba(99,102,241,0.3)' },
];

const Login = () => {
    const { login, requestOtp, loginWithOtp } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();
    
    const [loginMode, setLoginMode] = useState('password');
    const [otpStep, setOtpStep] = useState(1);
    const [formData, setFormData] = useState({ email: '', password: '', otp: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [otpFilled, setOtpFilled] = useState(false);
    const timerRef = useRef(null);

    const { email, password, otp } = formData;

    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [resendTimer]);

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (e.target.name === 'otp' && e.target.value.length === 6) {
            setOtpFilled(true);
            setTimeout(() => setOtpFilled(false), 400);
        }
    };

    const handleRequestOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email) { setErrorMsg('Please enter your email address'); return; }
        setIsSubmitting(true); setErrorMsg('');
        try {
            const msg = await requestOtp(email);
            setInfoMsg(msg); setOtpStep(2); setResendTimer(60);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to send verification code');
        } finally { setIsSubmitting(false); }
    };

    const onSubmit = async e => {
        e.preventDefault(); setIsSubmitting(true); setErrorMsg('');
        try {
            if (loginMode === 'password') await login(email, password);
            else await loginWithOtp(email, otp);
            navigate('/');
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Login failed. Please check your credentials.');
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
             style={{ background: 'var(--bg-base)', transition: 'background 0.35s ease' }}>

            {/* Animated floating orbs */}
            <div className="absolute top-[-180px] right-[-80px] w-[520px] h-[520px] bg-emerald-600/10 rounded-full blur-[130px] orb-1 pointer-events-none" />
            <div className="absolute bottom-[-180px] left-[-80px] w-[420px] h-[420px] bg-indigo-600/10 rounded-full blur-[130px] orb-2 pointer-events-none" />
            <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] orb-3 pointer-events-none" />

            {/* Drifting particles */}
            {PARTICLES.map((p, i) => (
                <span key={i} className="particle" style={{
                    width: p.size, height: p.size,
                    left: p.left, bottom: '-10px',
                    background: p.color,
                    animationDelay: p.delay,
                    animationDuration: p.duration,
                    boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
                }} />
            ))}

            {/* Auth card */}
            <div className="dashboard-card auth-card-enter auth-card-glow w-full max-w-md p-8 md:p-10 space-y-8 relative z-10 overflow-hidden">

                {/* Scan line */}
                <div className="scan-line" />

                {/* Logo & title */}
                <div className="text-center auth-field-1">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg mx-auto mb-4 logo-pulse">
                        OS
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t('login.title')}</h2>

                    {/* Mode toggle */}
                    <div className="p-1 rounded-xl flex mt-6" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                        <button
                            onClick={() => { setLoginMode('password'); setErrorMsg(''); setInfoMsg(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'password' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 tab-active' : 'hover:text-white'}`}
                            style={{ color: loginMode === 'password' ? 'white' : 'var(--text-muted)' }}
                        >
                            {t('login.passwordMode')}
                        </button>
                        <button
                            onClick={() => { setLoginMode('otp'); setErrorMsg(''); setInfoMsg(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${loginMode === 'otp' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 tab-active' : 'hover:text-white'}`}
                            style={{ color: loginMode === 'otp' ? 'white' : 'var(--text-muted)' }}
                        >
                            {t('login.otpMode')}
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm text-center animate-pulse">
                        {errorMsg}
                    </div>
                )}
                {infoMsg && !errorMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-lg text-sm text-center check-pop">
                        ✓ {infoMsg}
                    </div>
                )}

                {loginMode === 'password' ? (
                    <form className="space-y-6" onSubmit={onSubmit}>
                        <div className="space-y-4">
                            <div className="relative auth-field-2">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiMail size={16} />
                                </div>
                                <input
                                    type="email" name="email" value={email} onChange={onChange} required
                                    className="input-focus-ring w-full pl-10 pr-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder={t('login.emailPlaceholder')}
                                />
                            </div>
                            <div className="relative auth-field-3">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password" name="password" value={password} onChange={onChange} required
                                    className="input-focus-ring w-full pl-10 pr-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder={t('login.passwordPlaceholder')}
                                />
                            </div>
                        </div>
                        <div className="auth-btn">
                            <button type="submit" disabled={isSubmitting}
                                className="btn-shimmer w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiLogIn size={16} />}
                                {t('login.signInButton')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-6">
                        {otpStep === 1 ? (
                            <form className="space-y-6 step-enter" onSubmit={handleRequestOtp}>
                                <div className="relative auth-field-2">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                        <FiMail size={16} />
                                    </div>
                                    <input
                                        type="email" name="email" value={email} onChange={onChange} required
                                        className="input-focus-ring w-full pl-10 pr-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                        placeholder={t('login.enterEmail')}
                                    />
                                </div>
                                <div className="auth-btn">
                                    <button type="submit" disabled={isSubmitting}
                                        className="btn-shimmer w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                        {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiShield size={16} />}
                                        {t('login.getOtp')}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="space-y-6 step-enter" onSubmit={onSubmit}>
                                <div className="relative auth-field-2">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                        <FiShield size={16} />
                                    </div>
                                    <input
                                        type="text" name="otp" value={otp} onChange={onChange} required maxLength="6"
                                        className={`input-focus-ring w-full pl-10 pr-4 py-4 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-center text-2xl font-bold tracking-[0.5em] ${otpFilled ? 'otp-filled' : ''}`}
                                        placeholder="000000"
                                    />
                                </div>
                                <div className="space-y-3 auth-btn">
                                    <button type="submit" disabled={isSubmitting}
                                        className="btn-shimmer w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                        {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiLogIn size={16} />}
                                        {t('login.verifyButton')}
                                    </button>
                                    <div className="flex items-center justify-between">
                                        <button type="button" onClick={() => setOtpStep(1)}
                                            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                            <FiArrowLeft size={12} /> {t('login.changeEmail')}
                                        </button>
                                        <button type="button" onClick={handleRequestOtp}
                                            disabled={resendTimer > 0 || isSubmitting}
                                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:text-slate-700 transition-colors">
                                            {resendTimer > 0 ? t('login.resendTimer', { time: resendTimer }) : t('login.resendCode')}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                <div className="flex items-center my-2 auth-field-4">
                    <div className="flex-grow border-t border-white/[0.06]" />
                    <span className="px-3 text-slate-600 text-xs uppercase tracking-wider font-medium">{t('login.orContinue')}</span>
                    <div className="flex-grow border-t border-white/[0.06]" />
                </div>

                <a
                    href={(import.meta.env.MODE === 'production' ? '' : 'http://127.0.0.1:5005') + '/api/auth/github'}
                    className="github-btn w-full flex justify-center items-center gap-2 py-3 px-4 border rounded-xl text-sm font-semibold transition-all auth-field-4"
                    style={{ borderColor: 'var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                >
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    {t('login.githubSignIn')}
                </a>

                <p className="text-center text-sm text-slate-600 auth-field-4">
                    {t('login.noAccount')}{' '}
                    <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                        {t('login.registerHere')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
