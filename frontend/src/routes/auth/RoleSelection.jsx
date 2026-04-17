import React from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, Briefcase, ArrowRight } from 'lucide-react';

const RoleSelection = () => {
    const roles = [
        { 
            id: 'admin', 
            title: 'Admin Entreprise', 
            desc: 'Inscrire mon entreprise et gérer les ressources humaines.', 
            icon: <Building2 size={32} />,
            color: 'from-[#4F46E5] to-[#30317c]',
            shadow: 'shadow-indigo-100'
        },
        { 
            id: 'rh', 
            title: 'Responsable RH', 
            desc: 'Rejoindre une équipe pour gérer les contrats et les paies.', 
            icon: <Briefcase size={32} />,
            color: 'from-[#8B5CF6] to-[#6366F1]',
            shadow: 'shadow-purple-100'
        },
        { 
            id: 'employee', 
            title: 'Employé', 
            desc: 'Accéder à mon espace, mes documents et mes fiches de paie.', 
            icon: <User size={32} />,
            color: 'from-[#111248] to-[#4F46E5]',
            shadow: 'shadow-blue-100'
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-sans">
            
            {/* Branding Header */}
            <div className="flex items-center gap-1.5 mb-12">
                <div className="bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] p-2 rounded-xl shadow-lg shadow-indigo-100">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M12 2v20M12 2l4 4M12 2L8 6" />
                        <circle cx="12" cy="12" r="3" fill="white" strokeWidth="0" />
                    </svg>
                </div>
                <div className="flex items-baseline">
                    <span className="font-black text-2xl tracking-tighter text-gray-900">Optiza</span>
                    <span className="font-bold text-2xl tracking-tighter text-[#4F46E5] ml-0.5">RH</span>
                </div>
            </div>

            <div className="text-center mb-16">
                <h2 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Choisir votre rôle</h2>
                <p className="text-gray-500 max-w-sm mx-auto text-sm font-medium uppercase tracking-widest opacity-70">
                    Sélectionnez votre type de profil pour continuer
                </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {roles.map((role) => (
                    <Link key={role.id} to={`/auth/register/${role.id}`} className="group relative">
                        <div className={`h-full p-8 rounded-[2.5rem] bg-white border border-gray-100 shadow-xl ${role.shadow} transition-all duration-500 group-hover:-translate-y-4 group-hover:shadow-2xl flex flex-col items-center text-center overflow-hidden`}>
                            {/* Decorative Background Circle */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${role.color} opacity-[0.03] rounded-full group-hover:scale-[3] transition-transform duration-700`}>
                                
                            </div>
                            {/* Icon Box */}
                            <div className={`mb-8 p-5 rounded-3xl bg-gradient-to-br ${role.color} text-white shadow-lg shadow-indigo-200 transition-transform duration-500 group-hover:rotate-6 group-hover:scale-110`}>
                                {role.icon}
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">{role.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-10 px-4">
                                {role.desc}
                            </p>

                            <div className={`mt-auto flex items-center gap-2 font-black text-xs uppercase tracking-[0.15em] transition-all duration-300 group-hover:gap-4`}>
                                <span className="text-gray-900">Sélectionner</span>
                                <div className={`p-2 rounded-full bg-gray-900 text-white group-hover:bg-indigo-600 transition-colors`}>
                                    <ArrowRight size={14} />
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link to="/auth/login" className="mt-16 flex items-center gap-2 group">
                <span className="text-gray-400 text-sm font-bold tracking-wide">DÉJÀ INSCRIT ?</span>
                <span className="text-[#4F46E5] text-sm font-black group-hover:underline decoration-2 underline-offset-4 transition-all uppercase">
                    Se connecter
                </span>
            </Link>
        </div>
    );
};

export default RoleSelection;