import React from 'react';
import { Link } from 'react-router-dom';

const RoleSelection = () => {
    const roles = [
        { 
            id: 'admin', 
            title: 'Admin Entreprise', 
            desc: 'Inscrire mon entreprise et gérer les ressources.', 
            color: 'from-blue-600 to-indigo-700' 
        },
        { 
            id: 'rh', 
            title: 'Responsable RH', 
            desc: 'Rejoindre une entreprise pour gérer les contrats.', 
            color: 'from-purple-600 to-pink-600' 
        },
        { 
            id: 'employee', 
            title: 'Employé', 
            desc: 'Accéder à mon espace personnel et fiches de paie.', 
            color: 'from-emerald-500 to-teal-600' 
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 font-sans">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tight">Choisir votre rôle</h2>
                <p className="text-gray-500 max-w-xs mx-auto">Sélectionnez le type de compte que vous souhaitez créer sur OptizaRH.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                {roles.map(role => (
                    <Link key={role.id} to={`/auth/register/${role.id}`} className="group">
                        <div className={`h-full p-10 rounded-[2.5rem] bg-gradient-to-br ${role.color} text-white shadow-2xl transition-all duration-300 group-hover:-translate-y-3 group-hover:scale-[1.02] active:scale-95 flex flex-col justify-between`}>
                            <div>
                                <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                                    <span className="text-2xl font-bold">0{roles.indexOf(role) + 1}</span>
                                </div>
                                <h3 className="text-2xl font-black mb-3">{role.title}</h3>
                                <p className="text-white/80 text-sm leading-relaxed">{role.desc}</p>
                            </div>
                            <div className="mt-10 flex items-center gap-2 font-bold text-sm uppercase tracking-wider">
                                Sélectionner <span className="group-hover:translate-x-2 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <Link to="/login" className="mt-12 text-gray-400 font-semibold hover:text-[#4F46E5] transition-colors border-b border-transparent hover:border-[#4F46E5]">
                DÉJÀ INSCRIT ? SE CONNECTER
            </Link>
        </div>
    );
};

export default RoleSelection;