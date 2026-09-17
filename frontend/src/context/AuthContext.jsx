import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/me');
                    setUser(res.data);
                } catch (err) {
                    console.error(err);
                    localStorage.removeItem('token');
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const requestOtp = async (email) => {
        const res = await api.post('/auth/request-otp', { email });
        return res.data.msg;
    };

    const loginWithOtp = async (email, otp) => {
        const res = await api.post('/auth/login-otp', { email, otp });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };

    const register = async (username, email, password, otp) => {
        const res = await api.post('/auth/register', { username, email, password, otp });
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
    };


    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const loginWithToken = async (token) => {
        localStorage.setItem('token', token);
        try {
            const res = await api.get('/auth/me');
            setUser(res.data);
        } catch (err) {
            console.error(err);
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, loginWithToken, register, requestOtp, loginWithOtp, logout }}>

            {children}
        </AuthContext.Provider>
    );
};
