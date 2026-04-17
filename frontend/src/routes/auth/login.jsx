import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import api from '../../lib/apis/axiosConfig'; 
import loginImg from "/LoginImg.jpg";
import { Eye, EyeOff } from 'lucide-react';

import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext'; 

const Login = () => {
    const { showNotification } = useNotification();
    const { login } = useAuth();

    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/login', credentials);
            const { access_token, user } = response.data;
            login(user, access_token); 
            if (user.email_verified_at === null) {
                showNotification("Veuillez vérifier votre email avant de continuer.", "warning");
                navigate('/auth/verify-notice'); 
                return; 
            }

            showNotification(`Bienvenue, ${user.full_name || 'utilisateur'}`, "success");
            
            const paths = {
                superadmin: '/SuperAdmin/Dashboard',
                admin: '/admin/dashboard',
                rh: '/rh/dashboard',
                employee: '/employee/dashboard'
            };
            navigate(paths[user.role] || '/');

        } catch (error) {
        const errorMsg = error.response?.data?.message || "Erreur de connexion";
        showNotification(errorMsg, "error");
        console.warn("Détails de l'erreur:", errorMsg); 
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-white font-sans overflow-y-auto lg:overflow-hidden">
            {/* LEFT SECTION */}
            <div className="flex flex-col w-full lg:w-[55%] bg-gradient-to-br from-[#4F46E5] via-[#111248] to-[#8B5CF6] p-6 text-white justify-between shrink-0">
                <div className='flex flex-col justify-center lg:pl-11'>
                    <div className="flex items-center gap-1.5 mb-6 lg:mb-10">
                        <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                                <circle cx="12" cy="12" r="3" fill="white" />
                            </svg>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-bold text-xl md:text-2xl tracking-tighter">Optiza</span>
                            <span className="font-medium text-xl md:text-2xl tracking-tighter text-indigo-100 opacity-80 ml-0.5">RH</span>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">Bienvenue sur votre plateforme RH</h1>
                        <p className="text-blue-100 text-sm leading-relaxed opacity-90 hidden sm:block">
                            Gérez vos ressources humaines de manière simple, sécurisée et intelligente.
                        </p>
                    </div>
                </div>

                <div className="relative mt-8 lg:mt-0 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl max-w-[90%]">
                        <div className="w-full aspect-video rounded-xl overflow-hidden relative shadow-inner">   
                            <img src={loginImg} alt="Dashboard" className="w-full h-full object-cover opacity-90 transition-transform duration-700"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 bg-white">
                <div className="w-full max-w-md lg:max-w-xl">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Connexion</h2>
                        <p className="text-gray-400 text-xs">Saisissez vos identifiants pour accéder à votre tableau de bord.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">ADRESSE EMAIL</label>
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">@</span>
                                <input type="email" name='email' value={credentials.email} onChange={handleChange} placeholder="nom@entreprise.com" 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm"
                                    required/>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest">MOT DE PASSE</label>
                                <button  className="text-[11px] font-bold text-[#4F46E5] hover:underline transition">
                                    <Link to="/auth/forgot-password" className="text-[11px] font-bold text-[#4F46E5] hover:underline transition">Oublié?
                                    </Link>
                                </button>
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                </span>
                                <input type={showPassword ? "text" : "password"} name='password' value={credentials.password} onChange={handleChange} placeholder="••••••••" 
                                    className="w-full pl-10 pr-12 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm"
                                    required/>
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-indigo-600 transition">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-[#476bebf3] via-[#30317c] to-[#b798fe] hover:opacity-90 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] text-sm cursor-pointer">
                            {loading ? "Connexion..." : "Se connecter"} <span className="text-lg">→</span>
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[13px] text-gray-500 font-medium">
                        Nouvelle entreprise ? <Link to="/auth/register" className="text-[#4F46E5] font-black hover:underline">Créer un compte</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;