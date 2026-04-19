import React from 'react';
import { Users, UserCheck, Clock, Layout, Settings } from 'lucide-react';

const Dashboard = () => {
    // 1. Stats Cards (Sghert l-Paddings o l-Gap)
    const stats = [
        { label: 'Total Employés', value: '2 450', growth: '+12%', color: 'text-indigo-600', icon: <Users size={18} /> },
        { label: 'Employés actifs', value: '2 100', color: 'text-green-600', icon: <UserCheck size={18} /> },
        { label: 'Demandes en attente', value: '47', badge: 'URGENT', color: 'text-orange-600', icon: <Clock size={18} /> },
        { label: 'Modules actifs', value: '12/12', color: 'text-blue-600', icon: <Layout size={18} /> },
    ];

    const modules = [
        { title: 'RCAR', desc: 'Régime Collectif d\'Allocation de Retraite. Gestion des cotisations et affiliation.', status: 'ACTIF' },
        { title: 'IR (Impôt sur le Revenu)', desc: 'Barèmes d\'imposition automatique et calcul des tranches selon la législation.', status: 'ACTIF' },
        { title: 'Indemnités', desc: 'Frais de déplacement, logement, et primes exceptionnelles de rendement.', status: 'ACTIF' },
        { title: 'SNTL', desc: 'Gestion des ordres de mission et logistique des employés sur le terrain.', status: 'CONFIGURE' },
        { title: 'Retraite', desc: 'Planification de fin de carrière et calcul des prévisions de pension.', status: 'ACTIF' },
        { title: 'Crédit', desc: 'Avances sur salaire et prêts sociaux, suivi des remboursements mensuels.', status: 'ACTIF' },
    ];

    return (
        <div className="p-6 bg-[#f8faff] min-h-screen font-sans text-slate-900">
            
            {/* 1. Top Stats Cards - Sghert l-hjam dyalhom */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {stats.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 transition-hover hover:shadow-md">
                        <div className="p-2.5 bg-slate-50 rounded-xl text-indigo-600">
                            {item.icon}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-gray-400 text-[11px] font-bold uppercase tracking-wider">{item.label}</h4>
                            <div className="flex items-baseline gap-2">
                                <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                                {item.growth && <span className="text-[10px] font-bold text-green-500">{item.growth}</span>}
                                {item.badge && <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">{item.badge}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. Middle Section: Evolution (8/12) & Charges (4/12) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
                {/* Graphique Kbir */}
                <div className="lg:col-span-8 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[400px] flex flex-col">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Évolution de la Masse Salariale</h3>
                            <p className="text-sm text-gray-400 mt-1">Comparatif mensuel vs année précédente</p>
                        </div>
                        <div className="flex gap-1 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                            <button className="px-5 py-2 bg-white shadow-sm rounded-xl text-xs font-black text-indigo-600">12 Mois</button>
                            <button className="px-5 py-2 text-xs font-bold text-gray-400">6 Mois</button>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end justify-between gap-3 px-2 pt-4">
                        {[35, 60, 45, 80, 55, 95, 70, 115, 65, 50, 75, 90].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                                <div 
                                    style={{ height: `${(h / 115) * 100}%` }} 
                                    className={`w-full rounded-t-xl transition-all duration-500 ${i === 7 ? 'bg-indigo-600 shadow-lg shadow-indigo-100' : 'bg-indigo-100 group-hover:bg-indigo-200'}`}
                                ></div>
                                <span className="text-[9px] font-bold text-gray-300">M{i+1}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Charges Sghar */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-white p-8 rounded-[2.5rem] shadow-sm border-l-[6px] border-indigo-600 flex flex-col justify-center relative overflow-hidden group">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Charges IR</span>
                        <p className="text-3xl font-black text-slate-800 mt-3">428,000 <span className="text-base font-bold text-gray-400">DH</span></p>
                        <span className="text-xs text-red-500 font-bold mt-2">↓ 2.1% par rapport au mois dernier</span>
                    </div>

                    <div className="flex-1 bg-white p-8 rounded-[2.5rem] shadow-sm border-l-[6px] border-blue-500 flex flex-col justify-center relative overflow-hidden group">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Charges RCAR</span>
                        <p className="text-3xl font-black text-slate-800 mt-3">892,150 <span className="text-base font-bold text-gray-400">DH</span></p>
                        <span className="text-xs text-green-500 font-bold mt-2">↑ 5.4% de croissance</span>
                    </div>
                </div>
            </div>

            {/* 3. Centre de Contrôle des Modules - Kima kan lte7t */}
            <div className="flex justify-between items-center mb-6 px-2">
                <h3 className="text-xl font-black text-slate-800">Centre de Contrôle des Modules</h3>
                <button className="text-xs font-bold text-indigo-600 hover:underline tracking-tight">Voir tous les services</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex justify-between items-start mb-5">
                            <div className="p-3.5 bg-slate-50 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <Settings size={20} />
                            </div>
                            <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg tracking-wider ${mod.status === 'ACTIF' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-400'}`}>
                                {mod.status}
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{mod.title}</h4>
                        <p className="text-xs text-gray-400 mt-3 leading-relaxed font-medium">{mod.desc}</p>
                        <button className="w-full mt-6 py-3 bg-gray-50 text-gray-600 text-[10px] font-black rounded-xl hover:bg-indigo-600 hover:text-white transition-all tracking-widest uppercase">
                            Configurer
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;