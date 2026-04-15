import api from './axiosConfig';

export const superAdminApi = {
    checkSetup: () => api.get('/check-setup'),
    setup: (data) => api.post('/setup-superadmin', data),
    getStatus: () => api.get('/system-status'),
};