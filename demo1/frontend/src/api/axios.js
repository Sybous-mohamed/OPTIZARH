import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8000', 
    withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
    const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    if (token) {
        config.headers['X-XSRF-TOKEN'] = decodeURIComponent(token);
    }
    return config;
});

export default axiosClient;