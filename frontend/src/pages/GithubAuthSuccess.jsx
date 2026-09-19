import React, { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const GithubAuthSuccess = () => {
    const { loginWithToken } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');

        if (token) {
            loginWithToken(token);
            setTimeout(() => {
                navigate('/');
            }, 500);
        } else {
            navigate('/login');
        }
    }, [location, loginWithToken, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050508] relative overflow-hidden">
            {/* Glow */}
            <div className="absolute w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px]"></div>

            <div className="text-center space-y-6 relative z-10">
                {/* Animated spinner */}
                <div className="relative w-16 h-16 mx-auto">
                    <div className="w-16 h-16 border-2 border-emerald-500/20 rounded-full"></div>
                    <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-t-emerald-500 rounded-full animate-spin"></div>
                </div>
                <h2 className="text-xl font-bold text-white">Authenticating with GitHub...</h2>
                <p className="text-slate-600 text-sm">Setting up your dashboard</p>
            </div>
        </div>
    );
};

export default GithubAuthSuccess;
