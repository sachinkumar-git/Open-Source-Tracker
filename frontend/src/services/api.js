import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.MODE === 'production' ? '/api' : 'http://127.0.0.1:5005/api',
});

// Add a request interceptor to attach the JWT token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
