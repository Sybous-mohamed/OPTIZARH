import axios from 'axios';
const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});
export const getCsrfToken = () => {
    return axios.get('http://localhost:8000/sanctum/csrf-cookie', { withCredentials: true });
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { status } = error.response || {};
        const currentPath = window.location.pathname;

        if (status === 401) {
            const currentPath = window.location.pathname;
            if (currentPath.includes('login')) {
                return Promise.reject(error);
            }
            if (currentPath.includes('verify-notice') || currentPath.includes('verify-email')) {
                return Promise.reject(error);
            }
            localStorage.clear();
            window.location.href = '/auth/login';
        }

        if (status === 403) {
            if (currentPath.includes('verify-notice')) {
                return new Promise(() => {}); 
            }
            window.location.href = '/auth/verify-notice';
            return Promise.reject(error);;
        }

        if (status === 500) {
            console.error("Internal Server Error: Check l-Backend dyalk (logs/laravel.log)");
        }

        return Promise.reject(error);
    }
);
export default api;