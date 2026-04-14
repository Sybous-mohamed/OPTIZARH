import api from './axiosConfig';

export const authApi = {
    login: (credentials) => api.post('/login', credentials),
    logout: () => api.post('/logout'),
    getMe: () => api.get('/user'),
};