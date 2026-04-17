import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, CheckCircle2, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

import api from '../../lib/apis/axiosConfig'; 
import { useNotification } from '../../context/NotificationContext';


const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying'); 
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    useEffect(() => {
    const verify = async () => {
        const callbackUrl = searchParams.get('url');
        if (!callbackUrl) {
            setStatus('error');
            setErrorMsg("Lien de vérification invalide ou manquant.");
            return;
        }

        try {

            const cleanPath = callbackUrl.replace('http://localhost:8000/api', '');
            const response = await api.get(cleanPath);
            if (response.data.user) {
                const user = response.data.user;
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('role', user.role);
                
                setStatus('success');
                showNotification("Email vérifié !", "success");

                setTimeout(() => {
                    const role = user.role;
                    const paths = {
                        superadmin: "/SuperAdmin/Dashboard",
                        admin: "/Admin/Dashboard",
                        rh: "/RH/Dashboard",
                        employee: "/Employee/Dashboard"
                    };
                    window.location.href = paths[role] || '/auth/login';
                }, 2000);
            }
        } catch (error) {
            setStatus('error');
            setErrorMsg(error.response?.data?.message || "Le lien a expiré ou est invalide.");
        }
    };
    verify();
}, [searchParams, showNotification]); 

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#f8fafc] font-sans overflow-hidden">
            
            {/* Subtle Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-5%] left-[-5%] w-[35%] h-[35%] bg-indigo-50/40 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[35%] h-[35%] bg-blue-50/40 rounded-full blur-[100px]" />
            </div>

            {/* Compact Fixed Card */}
            <div className="relative z-10 w-full max-w-[420px] px-4">
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-gray-100 p-10 text-center">
                    
                    {/* Brand Logo */}
                    <div className="flex items-center gap-1.5 mb-10 justify-center">
                        <div className="bg-[#4F46E5] p-1.5 rounded-lg shadow-sm">
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

                    {/* Status Content */}
                    <div className="space-y-6">
                        {status === 'verifying' && (
                            <div className="flex flex-col items-center animate-pulse">
                                <div className="w-20 h-20 bg-indigo-50 rounded-[1.8rem] flex items-center justify-center mb-4">
                                    <Loader2 className="w-10 h-10 text-[#4F46E5] animate-spin" />
                                </div>
                                <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase">Vérification en cours</h2>
                                <p className="text-gray-400 text-[12px] italic">Sécurisation de votre accès...</p>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-green-50 rounded-[1.8rem] flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase italic text-green-600">Email vérifié !</h2>
                                <p className="text-gray-500 text-[13px] px-4">
                                    Votre compte est maintenant activé. Redirection vers votre tableau de bord...
                                </p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center">
                                <div className="w-20 h-20 bg-red-50 rounded-[1.8rem] flex items-center justify-center mb-4">
                                    <XCircle className="w-10 h-10 text-red-500" />
                                </div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase text-red-600">Échec</h2>
                                <div className="mt-2 px-4 py-3 bg-red-50/50 text-red-600 text-[12px] font-bold rounded-xl border border-red-100/50 w-full italic">
                                    {errorMsg}
                                </div>
                                <button 
                                    onClick={() => navigate('/auth/login')}
                                    className="mt-8 w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.97] text-[13px] tracking-wide">
                                    Retour à la connexion
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Security Badge */}
                    <div className="mt-10 pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} className="opacity-50" />
                        Accès Sécurisé par Optiza
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifyEmail;