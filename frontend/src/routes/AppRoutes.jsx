import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import LandingPage from '../pages/LandingPage';
import ProtectedRoute from '../components/ProtectedRoute';
import GithubAuthSuccess from '../pages/GithubAuthSuccess';
import { AuthContext } from '../context/AuthContext';

const AppRoutes = () => {
    const { user } = useContext(AuthContext);

    return (
        <Routes>
            {/* Landing page: show only when NOT logged in */}
            <Route path="/" element={
                user ? <ProtectedRoute><Dashboard /></ProtectedRoute> : <LandingPage />
            } />
            <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
            <Route path="/github-auth-success" element={<GithubAuthSuccess />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;
