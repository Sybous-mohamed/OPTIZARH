import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../lib/apis/axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Verifier l-token m3a l-backend
            api.get('/user')
                .then(res => setUser(res.data))
                .catch(() => localStorage.clear())
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = (userData, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('role', userData.role);
        setUser(userData);
    };

    const logout = () => {
        api.post('/logout').finally(() => {
            localStorage.clear();
            setUser(null);
            window.location.href = '/auth/login';
        });
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);