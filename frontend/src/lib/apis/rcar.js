import axiosInstance from './axiosConfig';

export const rcarApi = {
    getAll: () => axiosInstance.get('/rcar'),
    create: (data) => axiosInstance.post('/rcar', data),
    update: (id, data) => axiosInstance.put(`/rcar/${id}`, data),
    delete: (id) => axiosInstance.delete(`/rcar/${id}`),
};