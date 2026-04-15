import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/apis/axiosConfig'; 
import loginImg from "/LoginImg.jpg";

const Register = () => {
    const { role } = useParams();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '', // Ghadi nbedlouha f l-payload l-full_name
        email: '',
        password: '',
        password_confirmation: '',
        company_name: '',
        sector: 'Technologie',
        employee_count: '',
        role: role || 'admin'
    });

    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        // Match l-keys m3a l-Backend (Laravel) bach t-7id erreur 422
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
            if (response.status === 201 || response.status === 200) {
                alert("Compte créé avec succès !");
                navigate('/login');
            }
        } catch (error) {
            console.error("Erreur Laravel:", error.response?.data);
            const serverMessage = error.response?.data?.errors 
                ? Object.values(error.response.data.errors).flat().join(" ")
                : error.response?.data?.message;
            alert(serverMessage || "Erreur d'inscription");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row h-screen w-full bg-white font-sans overflow-y-auto lg:overflow-hidden">
            
            {/* LEFT SECTION */}
            <div className="flex flex-col w-full lg:w-[45%] bg-gradient-to-br from-[#4F46E5] via-[#111248] to-[#8B5CF6] p-6 sm:p-10 text-white justify-between shrink-0">
                <div className='flex flex-col justify-center lg:pl-6'>
                    <div className="flex items-center gap-1.5 mb-6">
                        <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10" strokeOpacity="0.3"/>
                                <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                                <circle cx="12" cy="12" r="3" fill="white" strokeWidth="0" />
                            </svg>
                        </div>
                        <div className="flex items-baseline">
                            <span className="font-bold text-xl tracking-tighter text-white">Optiza</span>
                            <span className="font-medium text-xl tracking-tighter text-indigo-100 opacity-80 ml-0.5">RH</span>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-3xl font-bold leading-tight mb-4">
                            Créez le compte de <br /> votre entreprise
                        </h1>
                    </div>
                </div>

                <div className="relative mt-8 flex justify-center">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-xl w-full max-w-[320px]">
                        <div className="w-full aspect-square rounded-xl overflow-hidden relative shadow-inner">   
                            <img src={loginImg} alt="Register" className="w-full h-full object-cover opacity-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SECTION */}
            <div className="w-full lg:w-[55%] flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
                <div className="w-full max-w-2xl">
                    <div className="mb-8">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">Inscription ({role})</h2>
                        <p className="text-gray-400 text-xs text-center lg:text-left">Configurez l'espace de travail de votre organisation.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Entreprise Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-[#4F46E5] uppercase tracking-[0.1em] border-b border-gray-100 pb-2">L'Entreprise</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Nom de l'entreprise</label>
                                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} required placeholder="Ex: Optiza Tech" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Secteur d'activité</label>
                                    <select name="sector" value={formData.sector} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm">
                                        <option value="Technologie">Technologie</option>
                                        <option value="Services">Services</option>
                                        <option value="Industrie">Industrie</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Nombre d'employés</label>
                                    <input type="number" name="employee_count" value={formData.employee_count} onChange={handleChange} placeholder="Ex: 50" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm"/>
                                </div>
                            </div>

                            {/* Admin Info */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-[#4F46E5] uppercase tracking-[0.1em] border-b border-gray-100 pb-2">Administrateur RH</h3>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Nom complet</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Mohamed Amine" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm"/>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Email professionnel</label>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="admin@entreprise.com" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm"/>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Mot de passe</label>
                                        <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="••••" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm"/>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1.5">Confirmation</label>
                                        <input type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required placeholder="••••" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#4F46E5] outline-none text-sm"/>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-gradient-to-br from-[#4F46E5] via-[#30317c] to-[#8B5CF6] text-white font-bold p-3.5 rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50 text-sm mt-4"
                        >
                            {loading ? "Création..." : "Créer mon espace RH →"}
                        </button>

                        <p className="text-center text-[13px] text-gray-500 font-medium">
                            Déjà inscrit ? <Link to="/login" className="text-[#4F46E5] font-black hover:underline ml-1">Se connecter</Link>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;