import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUserPlus, FiMail, FiLock, FiUser, FiShield, FiRefreshCw, FiArrowLeft } from 'react-icons/fi';

const Register = () => {
    const { register, requestOtp } = useContext(AuthContext);
    const navigate = useNavigate();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ username: '', email: '', password: '', otp: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [infoMsg, setInfoMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
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
        <div className="min-h-screen flex items-center justify-center p-4"
             style={{ background: 'var(--bg-base)' }}>

            <div className="dashboard-card w-full max-w-md p-8 md:p-10 space-y-7 animate-fadeInUp">

                {/* Header */}
                <div className="text-center auth-field-1">
                    <div className="w-11 h-11 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black text-sm mx-auto mb-4">
                        OS
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {step === 1 ? 'Create Account' : 'Verify Email'}
                    </h2>
                    <p className="text-slate-500 mt-2 text-sm">
                        {step === 1 ? 'Join to track your contributions' : `Enter the 6-digit code sent to ${email}`}
                    </p>

                    {/* Progress */}
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className={`h-1 w-16 rounded-full transition-all ${step >= 1 ? 'bg-emerald-500' : 'bg-white/10'}`} />
                        <div className={`h-1 w-16 rounded-full transition-all ${step >= 2 ? 'bg-emerald-500' : 'bg-white/10'}`} />
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

                {step === 1 ? (
                    <form className="space-y-5 step-enter" onSubmit={handleSendOtp}>
                        <div className="space-y-4">
                            <div className="relative auth-field-2">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiUser size={16} />
                                </div>
                                <input
                                    type="text" name="username" value={username} onChange={onChange} required
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder="Username"
                                />
                            </div>
                            <div className="relative auth-field-3">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiMail size={16} />
                                </div>
                                <input
                                    type="email" name="email" value={email} onChange={onChange} required
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder="Email address"
                                />
                            </div>
                            <div className="relative auth-field-4">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-600">
                                    <FiLock size={16} />
                                </div>
                                <input
                                    type="password" name="password" value={password} onChange={onChange} required minLength="6"
                                    className="w-full pl-10 pr-4 py-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-white placeholder-slate-600 transition-all outline-none text-sm"
                                    placeholder="Password (min 6 chars)"
                                />
                            </div>
                        </div>
                        <div className="auth-btn">
                            <button type="submit" disabled={isSubmitting}
                                className="btn-primary">
                                {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiMail size={16} />}
                                Send Verification Code
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
                                {isSubmitting ? <FiRefreshCw className="animate-spin" size={16} /> : <FiUserPlus size={16} />}
                                Complete Registration
                            </button>
                            <div className="flex items-center justify-between">
                                <button type="button" onClick={() => setStep(1)}
                                    className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors">
                                    <FiArrowLeft size={12} /> Edit Details
                                </button>
                                <button type="button" onClick={handleSendOtp}
                                    disabled={resendTimer > 0 || isSubmitting}
                                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 disabled:text-slate-700 transition-colors">
                                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                <p className="text-center text-sm text-slate-600 auth-field-4">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
