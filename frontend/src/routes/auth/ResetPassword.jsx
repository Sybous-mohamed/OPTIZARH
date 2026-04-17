import React, { useState } from 'react';
import { useSearchParams, useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, ShieldCheck } from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';

const ResetPassword = () => {
    const { token } = useParams();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email');
    const navigate = useNavigate();
    const { showNotification } = useNotification();

    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleReset = async (e) => {
        e.preventDefault();
        
        if (!email) {
            showNotification("L'email est manquant dans l'URL.", "error");
            return;
        }

        if (password !== passwordConfirmation) {
            showNotification("Les mots de passe ne correspondent pas.", "error");
            return;
        }

        setLoading(true);
        try {
            await api.post('/reset-password', {
                token: token,
                email: email,
                password: password,
                password_confirmation: passwordConfirmation
            });
            
            showNotification("Mot de passe réinitialisé avec succès !", "success");
            setTimeout(() => navigate('/auth/login'), 2000);
        } catch (error) {
            const msg = error.response?.data?.message || "Une erreur est survenue.";
            showNotification(msg, "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-[#f8fafc] font-sans overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 w-full max-w-[440px] px-4">
                <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-gray-100 p-8 md:p-10 transform transition-all">
                    
                    {/* Brand Logo */}
                    <div className="flex items-center gap-1.5 mb-8 justify-center">
                        <div className="bg-[#4F46E5] p-1.5 rounded-lg">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                                <circle cx="12" cy="12" r="3" fill="white" />
                            </svg>
                        </div>
                        <div className="flex items-baseline text-gray-950 font-bold text-xl tracking-tighter">
                            Optiza<span className="text-[#4F46E5] font-medium ml-0.5">RH</span>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#4F46E5]">
                            <ShieldCheck size={32} />
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2 uppercase italic">Nouveau Pass</h1>
                        <p className="text-gray-500 text-[13px] leading-relaxed">
                            Sécurisez votre compte avec un nouveau mot de passe.
                        </p>
                    </div>

                    <form onSubmit={handleReset} className="space-y-4">
                        {/* Password Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4 block">
                                Nouveau mot de passe
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4F46E5] transition-colors" size={18} />
                                <input 
                                    type={showPass ? "text" : "password"} 
                                    required
                                    onChange={(e) => setPassword(e.target.value)} 
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-12 text-[14px] focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-gray-900 font-medium"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmation Input */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-4 block">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative group">
                                <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4F46E5] transition-colors" size={18} />
                                <input 
                                    type={showPass ? "text" : "password"} 
                                    required
                                    onChange={(e) => setPasswordConfirmation(e.target.value)} 
                                    placeholder="••••••••"
                                    className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-12 pr-4 text-[14px] focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-gray-900 font-medium"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#4F46E5] hover:bg-[#4338ca] text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-indigo-100 disabled:opacity-70 mt-4 cursor-pointer"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Réinitialiser le mot de passe"
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                        <Link 
                            to="/auth/login" 
                            className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-950 text-[13px] font-bold transition-all"
                        >
                            <ArrowLeft size={16} />
                            Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;