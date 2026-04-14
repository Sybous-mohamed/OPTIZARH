import React, { useState } from 'react';
import { superAdminApi } from '../../lib/apis/superadmin';
import loginImg from '/LoginImg.jpg';

const SuperAdminRegister = () => {
    const [form, setForm] = useState({ 
        full_name: '', 
        email: '', 
        password: '', 
        password_confirmation: '' 
    });
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const res = await superAdminApi.setup(form);
            
            if (res.data && res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('role', 'superadmin'); 
                localStorage.setItem('user_name', res.data.user.full_name);
                localStorage.setItem('user', JSON.stringify(res.data.user));
            
                window.location.href = '/superadmin/dashboard';
            }
        } catch (err) {
            if (err.response?.status === 403) {
                alert("Systeme est deja confermer  !");
                window.location.href = '/login';
            } else if (err.response?.status === 422) {
                const errors = err.response.data.errors;
                alert(Object.values(errors).flat().join('\n'));
            } else {
                alert("Erreur technique: Check l-console");
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-white font-sans overflow-y-auto lg:overflow-hidden">
            
            {/* LEFT SECTION (Branding & Design) */}
            <div className="flex flex-col w-full lg:w-[55%] bg-gradient-to-br from-[#4F46E5] via-[#111248] to-[#8B5CF6] p-6 text-white justify-between shrink-0">
                <div className='flex flex-col justify-center lg:pl-11'>
                    <div className="flex items-center gap-1.5 mb-10">
                        <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                                <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                                <circle cx="12" cy="12" r="3" fill="white" strokeWidth="0" />
                            </svg>
                        </div>
                        <span className="font-bold text-2xl tracking-tighter">Optiza<span className="opacity-80 ml-0.5 font-medium">RH</span></span>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-4xl font-bold leading-tight mb-4 uppercase text-white">
                            Installation <br /> du Système
                        </h1>
                        <p className="text-blue-100 text-sm opacity-90 hidden sm:block">
                            Configurez le compte Super Administrateur pour commencer à gérer vos entreprises et vos ressources.
                        </p>
                    </div>
                </div>

                <div className="relative mt-8 lg:mt-0 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-xl max-w-[85%]">
                        <div className="w-full aspect-video rounded-xl overflow-hidden relative">   
                            <img src={loginImg} alt="Setup" className="w-full h-full object-cover opacity-90" />
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                            <p className="text-[10px] text-blue-50/70 font-medium uppercase tracking-widest">Configuration Initiale en cours</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION (Registration Form) */}
            <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 bg-white text-gray-900">
                <div className="w-full max-w-md">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Super Admin</h2>
                        <p className="text-gray-400 text-xs tracking-tight">Identifiants Maîtres pour la gestion globale du système.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Nom Complet</label>
                            <input 
                                type="text" 
                                placeholder="Ex: Mohamed Bouray" 
                                required
                                value={form.full_name}
                                onChange={e => setForm({...form, full_name: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm text-gray-900"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Email Maître</label>
                            <input 
                                type="email" 
                                placeholder="admin@system.com" 
                                required
                                value={form.email}
                                onChange={e => setForm({...form, email: e.target.value})}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm text-gray-900"
                            />
                        </div>

                        {/* Passwords */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Mot de passe</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    required
                                    value={form.password}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm text-gray-900"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1.5">Confirmation</label>
                                <input 
                                    type="password" 
                                    placeholder="••••••••" 
                                    required
                                    value={form.password_confirmation}
                                    onChange={e => setForm({...form, password_confirmation: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm text-gray-900"
                                />
                            </div>
                        </div>

                        <div className="py-2"></div>

                        <button 
                            disabled={loading}
                            type="submit"
                            className="w-full bg-gradient-to-br from-[#4F46E5] via-[#30317c] to-[#8B5CF6] hover:opacity-90 text-white font-bold p-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] disabled:opacity-50">
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Enregestring...
                                </span>
                            ) : "Enregestrer →"}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-[11px] text-gray-400 font-medium uppercase tracking-widest">
                        Accès réservé au propriétaire du système
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminRegister;