import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

import api from '../../lib/apis/axiosConfig'; 
import loginImg from "/LoginImg.jpg";

import { useNotification } from '../../context/NotificationContext';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        name: '', 
        email: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        sector: 'Technologie',
        employee_count: '',
        role: role || 'admin'
    });

    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.password_confirmation) {
            showNotification("Les mots de passe ne correspondent pas.", "error");
            return;
        }

        setLoading(true);

        const payload = {
            full_name: formData.name,
            email: formData.email, 
            password: formData.password,
            password_confirmation: formData.password_confirmation,
            company_name: formData.company_name,
            sector: formData.sector,
            employee_count: formData.employee_count,
            role: formData.role
        };

        try {
            const response = await api.post('/register', payload);
            
            if (response.status === 201) {
                const token = response.data.access_token; 
                if (token) {
                    localStorage.setItem('token', token);
                }
                localStorage.setItem('email_to_verify', formData.email);
                showNotification("Compte créé ! Veuillez vérifier votre email.", "success");
                navigate('/auth/verify-notice');
            }
        } catch (error) {
            let errorMessage = "Une erreur est survenue lors de l'inscription.";
            if (error.response?.status === 422) {
                const errors = error.response.data.errors;
                errorMessage = Object.values(errors).flat().join(" ");
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }
            showNotification(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full bg-white font-sans overflow-x-hidden">
            
            {/* LEFT SECTION */}
            <div className="flex flex-col w-full lg:w-[45%] bg-gradient-to-br from-[#4F46E5] via-[#111248] to-[#8B5CF6] p-6 text-white justify-between shrink-0">
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
                        <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4 tracking-tight">Propulsez votre gestion RH</h1>
                        <p className="text-blue-100 text-sm leading-relaxed opacity-90 hidden sm:block">
                            Créez votre espace de travail en quelques secondes et commencez à gérer vos talents efficacement.
                        </p>
                    </div>
                </div>

                <div className="relative mt-8 lg:mt-0 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl max-w-[90%]">
                        <div className="w-full aspect-video rounded-xl overflow-hidden relative shadow-inner">   
                            <img src={loginImg} alt="Register" className="w-full h-full object-cover opacity-90"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-10 bg-white">
                <div className="w-full max-w-2xl lg:max-w-3xl">
                    <div className="mb-8 text-center lg:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight uppercase">Inscription</h2>
                        <span className="inline-block px-3 py-1 bg-indigo-50 text-[#4F46E5] text-[10px] font-black rounded-full uppercase tracking-widest border border-indigo-100">
                            Role: {role}
                        </span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5"> 
                            {/* Company Info */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-2">L'Entreprise</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Nom commercial</label>
                                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="Optiza Tech" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none transition-all text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Secteur</label>
                                    <select name="sector" value={formData.sector} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl outline-none text-sm cursor-pointer">
                                        <option value="Technologie">Technologie</option>
                                        <option value="Services">Services</option>
                                        <option value="Industrie">Industrie</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Effectif</label>
                                    <input type="number" name="employee_count" value={formData.employee_count} onChange={handleChange} placeholder="Nombre d'employés" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl outline-none text-sm"/>
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] border-b border-gray-100 pb-2">Administrateur</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Nom Complet</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Jean Dupont" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Email Professionnel</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="admin@domaine.com" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-300 rounded-xl focus:bg-white focus:border-[#4F46E5] outline-none text-sm"/>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="relative">
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Password</label>
                                        <input type={showPassword ? "text" : "password"} name="password" value={formData.password} placeholder="••••••••••" onChange={handleChange} required className="w-full px-3 py-3 bg-gray-50/50 border border-gray-300 rounded-xl outline-none text-sm"/>
                                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-8 text-gray-400">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5 ml-1">Confirmer</label>
                                        <input type={showPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation} placeholder="••••••••••"  onChange={handleChange} required className="w-full px-3 py-3 bg-gray-50/50 border border-gray-300 rounded-xl outline-none text-sm"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 pb-8"> {/* Zdnawa chwiya dyal padding ta7t */}
                            <button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-[#476bebf3] via-[#30317c] to-[#b798fe] hover:opacity-90 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] text-sm uppercase">
                                {loading ? "Création..." : "Créer mon espace RH →"}
                            </button>
                            <p className="mt-6 text-center text-[13px] text-gray-500 font-medium italic">
                                Déjà inscrit ? <Link to="/auth/login" className="text-[#4F46E5] font-black not-italic hover:underline ml-1">Se connecter</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;