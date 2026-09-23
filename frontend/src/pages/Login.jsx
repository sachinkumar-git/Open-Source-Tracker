import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogIn, FiMail, FiLock, FiShield, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

const Login = () => {
    const { login, requestOtp, loginWithOtp } = useContext(AuthContext);
    const navigate = useNavigate();

    const [loginMode, setLoginMode] = useState('password');
    const [otpStep, setOtpStep] = useState(1);
    const [formData, setFormData] = useState({ email: '', password: '', otp: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
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
        <div className="min-h-screen flex items-center justify-center p-4"
             style={{ background: 'var(--bg-base)' }}>

            {/* Auth card */}
            <div className="dashboard-card w-full max-w-md p-8 md:p-10 space-y-7 animate-fadeInUp">

                {/* Logo & title */}
                <div className="text-center auth-field-1">
                    <div className="w-11 h-11 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm mx-auto mb-4">
                        OS
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">Welcome Back</h2>

                    {/* Mode toggle */}
                    <div className="p-1 rounded-lg flex mt-5" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                        <button
                            onClick={() => { setLoginMode('password'); setErrorMsg(''); setInfoMsg(''); }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${loginMode === 'password' ? 'bg-emerald-500 text-white' : 'hover:text-white'}`}
                            style={{ color: loginMode === 'password' ? 'white' : 'var(--text-muted)' }}
                        >
                            PASSWORD
                        </button>
                        <button
                            onClick={() => { setLoginMode('otp'); setErrorMsg(''); setInfoMsg(''); }}
                            className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${loginMode === 'otp' ? 'bg-emerald-500 text-white' : 'hover:text-white'}`}
                            style={{ color: loginMode === 'otp' ? 'white' : 'var(--text-muted)' }}
                        >
                            OTP CODE
                        </button>
                    </div>
                </div>

                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm text-center">
                        {errorMsg}
                    </div>
                )}
                {infoMsg && !errorMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg text-sm text-center">
                        ✓ {infoMsg}
                    </div>
                )}

                {loginMode === 'password' ? (
                    <form className="space-y-5" onSubmit={onSubmit}>
                        <div className="space-y-4">
                            <div className="relative auth-field-2">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiMail size={16} />
                                </div>
                                <input
                                    type="email" name="email" value={email} onChange={onChange} required
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div className="relative auth-field-3">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password" name="password" value={password} onChange={onChange} required
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder="Password"
                                />
                            </div>
                        </div>
                        <div className="auth-btn">
                            <button type="submit" disabled={isSubmitting}
                                className="btn-primary">
                                {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiLogIn size={16} />}
                                Sign In
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5">
                        {otpStep === 1 ? (
                            <form className="space-y-5 step-enter" onSubmit={handleRequestOtp}>
                                <div className="relative auth-field-2">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                        <FiMail size={16} />
                                    </div>
                                    <input
                                        type="email" name="email" value={email} onChange={onChange} required
                                        className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                        placeholder="Enter your email"
                                    />
                                </div>
                                <div className="auth-btn">
                                    <button type="submit" disabled={isSubmitting}
                                        className="btn-primary">
                                        {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiShield size={16} />}
                                        Get Single-Use Code
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <form className="space-y-5 step-enter" onSubmit={onSubmit}>
                                <div className="relative auth-field-2">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                        <FiShield size={16} />
                                    </div>
                                    <input
                                        type="text" name="otp" value={otp} onChange={onChange} required maxLength="6"
                                        className="w-full pl-10 pr-4 py-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-center text-2xl font-bold tracking-[0.5em]"
                                        placeholder="000000"
                                    />
                                </div>
                                <div className="space-y-3 auth-btn">
                                    <button type="submit" disabled={isSubmitting}
                                        className="btn-primary">
                                        {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiLogIn size={16} />}
                                        Verify & Enter
                                    </button>
                                    <div className="flex items-center justify-between">
                                        <button type="button" onClick={() => setOtpStep(1)}
                                            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                            <FiArrowLeft size={12} /> Change Email
                                        </button>
                                        <button type="button" onClick={handleRequestOtp}
                                            disabled={resendTimer > 0 || isSubmitting}
                                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:text-slate-700 transition-colors">
                                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                )}

                <div className="flex items-center my-1 auth-field-4">
                    <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }} />
                    <span className="px-3 text-slate-600 text-xs uppercase tracking-wider font-medium">Or continue with</span>
                    <div className="flex-grow border-t" style={{ borderColor: 'var(--border-color)' }} />
                </div>

                <a
                    href={(import.meta.env.MODE === 'production' ? '' : 'http://127.0.0.1:5005') + '/api/auth/github'}
                    className="github-btn auth-field-4"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                    GitHub Sign In
                </a>

                <p className="text-center text-sm text-slate-600 auth-field-4">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
