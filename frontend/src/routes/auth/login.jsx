import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/apis/axiosConfig'; 
import loginImg from "/LoginImg.jpg";

const Login = () => {
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/login', credentials);
            const { access_token, user } = response.data;
            
            // Stockage dyal data
            localStorage.setItem('token', access_token);
            localStorage.setItem('role', user.role);
            localStorage.setItem('user_name', user.name);

            // Redirect 3la 7sab l-role
            switch(user.role) {
                case 'admin': navigate('/admin/dashboard'); break;
                case 'rh': navigate('/rh/dashboard'); break;
                case 'employee': navigate('/employee/dashboard'); break;
                case 'superadmin': navigate('/superadmin/dashboard'); break;
                default: navigate('/');
            }

        } catch (error) {
            alert(error.response?.data?.message || "Erreur de connexion");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-white font-sans overflow-y-auto lg:overflow-hidden">
            
            {/* LEFT SECTION - Design dyalk l-asli */}
            <div className="flex flex-col w-full lg:w-[55%] bg-gradient-to-br from-[#4F46E5] via-[#111248] to-[#8B5CF6] p-6 sm:p-6 text-white justify-between shrink-0">
                <div className='flex flex-col justify-center lg:pl-11'>
                    <div className="flex items-center gap-1.5 mb-6 lg:mb-10">
                        <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 shadow-inner backdrop-blur-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" strokeDasharray="4 2"/>
                                <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                                <circle cx="12" cy="12" r="3" fill="white" strokeWidth="0" />
                            </svg>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-bold text-xl md:text-2xl tracking-tighter text-white">Optiza</span>
                            <span className="font-medium text-xl md:text-2xl tracking-tighter text-indigo-100 opacity-80 ml-0.5">RH</span>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
                            Bienvenue sur votre <br /> plateforme RH
                        </h1>
                        <p className="text-blue-100 text-sm leading-relaxed opacity-90 hidden sm:block">
                            Gérez vos ressources humaines de manière simple, sécurisée et intelligente. 
                            Centralisez vos données et optimisez vos processus administratifs.
                        </p>
                    </div>
                </div>

                <div className="relative mt-8 lg:mt-0 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 sm:p-4 border border-white/20 shadow-xl max-w-[90%] sm:max-w-[85%]">
                        <div className="w-full aspect-video rounded-xl overflow-hidden relative shadow-inner">   
                            <img 
                                src={loginImg} 
                                alt="Dashboard"
                                className="w-full h-full object-cover opacity-90 transition-transform duration-700"
                            />
                        </div>
                        <div className="mt-3 flex items-center gap-3 px-1">
                            <div className="flex -space-x-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#4F46E5] bg-indigo-300"></div>
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-[#4F46E5] bg-indigo-400"></div>
                            </div>
                            <p className="text-[9px] sm:text-[10px] text-blue-50/70 font-medium">
                                Rejoignez plus de 500 entreprises déjà inscrites.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION - Design dyalk l-asli */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 bg-white">
                <div className="w-full max-w-md lg:max-w-xl">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Connexion</h2>
                        <p className="text-gray-400 text-xs">Saisissez vos identifiants pour accéder à votre tableau de bord.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">
                                ADRESSE EMAIL
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">@</span>
                                <input 
                                    type="email" 
                                    name='email'
                                    onChange={handleChange}
                                    placeholder="nom@entreprise.com" 
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between mb-1.5">
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest">MOT DE PASSE</label>
                                <a href="#" className="text-[11px] font-bold text-[#4F46E5] hover:text-indigo-700 transition">Oublié?</a>
                            </div>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                </span>
                                <input 
                                    type="password" 
                                    name='password'
                                    onChange={handleChange}
                                    placeholder="••••••••" 
                                    className="w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 py-1">
                            <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-[#4F46E5] focus:ring-[#4F46E5]" />
                            <span className="text-xs text-gray-500">Se souvenir de moi</span>
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-[#476bebf3] via-[#30317c] to-[#b798fe] hover:opacity-90 text-white font-bold p-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] text-sm">
                            {loading ? "Connexion..." : "Se connecter"} <span className="text-lg">→</span>
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <span className="relative bg-white px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mx-auto block w-fit">OU CONTINUER AVEC</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-xs font-bold text-gray-600">
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-4 h-4" alt="G" /> Google
                        </button>
                        <button className="flex items-center justify-center gap-2 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all text-xs font-bold text-gray-600">
                            <img src="https://www.svgrepo.com/show/448239/microsoft.svg" className="w-4 h-4" alt="M" /> Microsoft
                        </button>
                    </div>

                    <p className="mt-8 text-center text-[13px] text-gray-500 font-medium">
                        Nouvelle entreprise ? <Link to="/register" className="text-[#4F46E5] font-black hover:underline">Créer un compte</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;