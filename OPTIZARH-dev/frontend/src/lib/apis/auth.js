import api from './axiosConfig';

export const authApi = {
    login: (credentials) => api.post('/api/login', credentials),
    logout: () => api.post('/api/logout'),
    getMe: () => api.get('/api/user'),
};