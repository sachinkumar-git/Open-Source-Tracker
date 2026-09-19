import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../context/AuthContext';
import { FiUserPlus, FiMail, FiLock, FiUser, FiShield, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

const PARTICLES = [
    { size: 3, left: '8%',  delay: '0s',  duration: '16s', color: 'rgba(16,185,129,0.5)' },
    { size: 2, left: '35%', delay: '4s',  duration: '13s', color: 'rgba(99,102,241,0.4)' },
    { size: 4, left: '60%', delay: '1s',  duration: '19s', color: 'rgba(16,185,129,0.3)' },
    { size: 2, left: '80%', delay: '6s',  duration: '14s', color: 'rgba(245,158,11,0.35)' },
    { size: 3, left: '90%', delay: '2s',  duration: '11s', color: 'rgba(16,185,129,0.4)' },
    { size: 2, left: '50%', delay: '8s',  duration: '17s', color: 'rgba(99,102,241,0.3)' },
];

const Register = () => {
    const { register, requestOtp } = useContext(AuthContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', otp: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [otpFilled, setOtpFilled] = useState(false);
    const timerRef = useRef(null);

    const { username, email, password, otp } = formData;

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

    const handleSendOtp = async (e) => {
        if (e) e.preventDefault();
        if (!email || !username || !password) { setErrorMsg('Please fill in all details first'); return; }
        setIsSubmitting(true); setErrorMsg('');
        try {
            const msg = await requestOtp(email);
            setInfoMsg(msg); setStep(2); setResendTimer(60);
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Failed to send verification code');
        } finally { setIsSubmitting(false); }
    };

    const onSubmit = async e => {
        e.preventDefault(); setIsSubmitting(true); setErrorMsg('');
        try {
            await register(username, email, password, otp);
            navigate('/');
        } catch (err) {
            setErrorMsg(err.response?.data?.msg || 'Registration failed');
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
             style={{ background: 'var(--bg-base)', transition: 'background 0.35s ease' }}>

            {/* Animated orbs */}
            <div className="absolute top-[-180px] left-[-80px] w-[520px] h-[520px] bg-emerald-600/10 rounded-full blur-[130px] orb-1 pointer-events-none" />
            <div className="absolute bottom-[-180px] right-[-80px] w-[420px] h-[420px] bg-indigo-600/10 rounded-full blur-[130px] orb-2 pointer-events-none" />
            <div className="absolute top-[30%] right-[15%] w-[280px] h-[280px] bg-amber-500/5 rounded-full blur-[100px] orb-3 pointer-events-none" />

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

                {/* Logo */}
                <div className="text-center auth-field-1">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black text-lg mx-auto mb-4 logo-pulse">
                        OS
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {step === 1 ? t('register.title') : t('register.verifyTitle')}
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        {step === 1 ? t('register.subtitle') : `${t('register.verifySubtitle')} ${email}`}
                    </p>

                    {/* Progress indicator */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <div className={`h-1 w-16 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-emerald-500' : 'bg-white/10'}`} />
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

                {step === 1 ? (
                    <form className="space-y-5 step-enter" onSubmit={handleSendOtp}>
                        <div className="space-y-4">
                            <div className="relative auth-field-2">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiUser size={16} />
                                </div>
                                <input
                                    type="text" name="username" value={username} onChange={onChange} required
                                    className="input-focus-ring w-full pl-10 pr-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder={t('register.username')}
                                />
                            </div>
                            <div className="relative auth-field-3">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiMail size={16} />
                                </div>
                                <input
                                    type="email" name="email" value={email} onChange={onChange} required
                                    className="input-focus-ring w-full pl-10 pr-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder={t('register.emailPlaceholder')}
                                />
                            </div>
                            <div className="relative auth-field-4">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password" name="password" value={password} onChange={onChange} required minLength="6"
                                    className="input-focus-ring w-full pl-10 pr-4 py-3 bg-[#0e0e16] border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/40 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder={t('register.passwordPlaceholder')}
                                />
                            </div>
                        </div>
                        <div className="auth-btn">
                            <button type="submit" disabled={isSubmitting}
                                className="btn-shimmer w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiMail size={16} />}
                                {t('register.sendOtp')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="space-y-6 step-enter" onSubmit={onSubmit}>
                        <div className="space-y-4">
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
                        </div>
                        <div className="space-y-3 auth-btn">
                            <button type="submit" disabled={isSubmitting}
                                className="btn-shimmer w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiUserPlus size={16} />}
                                {t('register.completeBtn')}
                            </button>
                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => setStep(1)}
                                    className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                    <FiArrowLeft size={12} /> {t('register.editDetails')}
                                </button>
                                <button type="button" onClick={handleSendOtp}
                                    disabled={resendTimer > 0 || isSubmitting}
                                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 disabled:text-slate-700 transition-colors">
                                    {resendTimer > 0 ? t('register.resendTimer', { time: resendTimer }) : t('register.resendCode')}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <p className="text-center text-sm text-slate-600 auth-field-4">
                    {t('register.haveAccount')}{' '}
                    <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                        {t('register.loginHere')}
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
