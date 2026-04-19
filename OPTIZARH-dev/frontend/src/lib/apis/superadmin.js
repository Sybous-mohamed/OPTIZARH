import api from './axiosConfig';

export const superAdminApi = {
    checkSetup: () => api.get('/api/check-setup'),
    setup: (data) => api.post('/api/setup-superadmin', data),
    getStatus: () => api.get('/api/system-status'),
};