import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';
import api from '../../lib/apis/axiosConfig'; 
import { useNotification } from '../../context/NotificationContext';

const VerifyNotice = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.email) setEmail(user.email);

        const checkVerification = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await api.get('/auth/user-status');

                if (response.data.user.email_verified_at) {
                    clearInterval(checkVerification);

                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    localStorage.setItem('role', response.data.role);
                    
                    showNotification("Email vérifié ! Bienvenue.", "success");

                    const rolePaths = {
                        superadmin: '/SuperAdmin/Dashboard',
                        admin: '/Admin/Dashboard',
                        rh: '/RH/Dashboard',
                        employee: '/Employee/Dashboard'
                    };

                    setTimeout(() => {
                        window.location.href = rolePaths[response.data.role] || '/';
                    }, 1000);
                }
            } catch (error) {
                 if (error.response?.status === 401) {
                        clearInterval(checkVerification);
                        localStorage.clear();
                        navigate('/auth/login');
                    }
                    console.log("En attente de vérification...");
            }
        }, 3000);
        return () => clearInterval(checkVerification);
    }, [navigate, showNotification]);

    const handleResendEmail = async () => {
        setLoading(true);
        try {
            await api.post('/email/verification-notification');
            showNotification("Lien envoyé ! Vérifiez votre boîte mail.", "success");
        } catch (error) {
            showNotification("Erreur ou trop de tentatives.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.clear();
        navigate('/auth/login');
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#f8fafc] font-sans overflow-hidden">
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-50/50 rounded-full blur-[120px]" />
            </div>
            <div className="relative z-10 w-full max-w-[440px] px-4">
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 p-8 md:p-10 text-center transform transition-all">
                    <div className="flex items-center gap-1.5 mb-8 justify-center">
                        <div className="bg-[#4F46E5] p-1.5 rounded-lg">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                                <circle cx="12" cy="12" r="3" fill="white" />
                            </svg>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-bold text-xl tracking-tighter text-gray-950">Optiza</span>
                            <span className="font-medium text-xl tracking-tighter text-[#4F46E5] ml-0.5">RH</span>
                        </div>
                    </div>
                    <div className="relative inline-block mb-6">
                        <div className="w-20 h-20 bg-indigo-50/50 rounded-[1.8rem] flex items-center justify-center mx-auto">
                            <Mail className="w-10 h-10 text-[#4F46E5]" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-[#4F46E5] w-6 h-6 rounded-full border-[3px] border-white flex items-center justify-center shadow-sm">
                            <CheckCircle size={12} className="text-white" />
                        </div>
                    </div>
                    <div className="space-y-2 mb-8">
                        <span className="text-[10px] font-bold text-[#4F46E5] uppercase tracking-[0.15em] opacity-80">
                            Vérification requise
                        </span>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Confirmez votre e-mail</h1>
                        <p className="text-gray-500 text-[13px] leading-relaxed px-4">
                            Un email a été envoyé à :
                            <span className="block font-bold text-[#4F46E5] mt-1 truncate">
                                {email || "votre email"}
                            </span>
                        </p>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={handleResendEmail}
                            disabled={loading}
                            className="w-full bg-[#4F46E5] hover:bg-[#4338ca] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] text-[13px] shadow-sm disabled:opacity-50 cursor-pointer">
                            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Renvoyer l'e-mail"}
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full bg-transparent text-gray-400 hover:text-gray-600 font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-[12px] cursor-pointer">
                            <LogOut size={14} /> Quitter la session
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyNotice;