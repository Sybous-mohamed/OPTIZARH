import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { 
    Users, UserCheck, Wallet, Layout, Settings, TrendingUp, Bell, ShieldCheck, Banknote, 
    ArrowUpRight, Activity, Zap
} from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState({
        cards: [],
        cotisationStats: [], 
        modules: [], 
        charges: { ir: 0, rcar: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/superadmin/dashboard-stats');
                if (res.data) setData(res.data);
            } catch (err) {
                console.error("Erreur Backend:", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const icons = [
        <Users className="w-5 h-5" />,      
        <UserCheck className="w-5 h-5" />,  
        <Banknote className="w-5 h-5" />,   
        <Wallet className="w-5 h-5" />      
    ];

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#fdfdff] dark:bg-[#080808]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="text-indigo-600 font-black tracking-widest text-sm uppercase animate-pulse">OptizaRH System</div>
            </div>
        </div>
    );

    return (
        <div className=" bg-[#fdfdff] dark:bg-[#080808] min-h-screen transition-colors duration-500">
            
            {/* Top Navigation / Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        Dashboard <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Overview</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-widest mt-1 opacity-70">
                        Bienvenue sur votre centre de pilotage
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-all cursor-pointer shadow-sm">
                        <Activity size={16} /> Rapport Global
                    </button>
                    <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/30 cursor-pointer hover:scale-105 transition-all">
                        <Bell size={20} />
                    </div>
                </div>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 transition-colors duration-500">
                {data.cards.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white dark:bg-[#0f0f0f] p-5 rounded-[2rem] border border-slate-100 dark:border-[#1a1a1a] flex flex-col justify-between group hover:border-indigo-500 transition-all duration-300 shadow-sm">
                        {/* Icon Container */}
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#1a1a1a] flex items-center justify-center text-indigo-500 mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {icons[idx]}
                        </div>

                        {/* Content Area */}
                        <div>
                            <h4 className="text-slate-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-[0.15em] mb-2">
                                {item.label}
                            </h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                                    {item.value}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                                    <TrendingUp size={10} /> 12%
                                </span>
                            </div>
                            {/* Currency tag with adaptive color */}
                            {item.label.includes('MASSE') && (
                                <span className="text-sm font-black text-slate-900 dark:text-white mt-1 block">DH</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Chart + Financials */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
                
                {/* Visualisation Card */}
                <div className="lg:col-span-8 bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] border border-slate-100 dark:border-[#1c1c1c] shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Répartition des Cotisations</h3>
                            <p className="text-xs text-slate-400 font-medium italic mt-1">Comparaison des taux par organisme</p>
                        </div>
                        <div className="flex bg-slate-50 dark:bg-[#1c1c1c] p-1 rounded-xl">
                            <button className="px-4 py-1.5 bg-white dark:bg-[#262626] text-indigo-600 dark:text-white text-[10px] font-bold rounded-lg shadow-sm">Mensuel</button>
                            <button className="px-4 py-1.5 text-slate-400 text-[10px] font-bold">Annuel</button>
                        </div>
                    </div>
                    
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.cotisationStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#818cf8" />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" dark:stroke="#262626" opacity={0.5} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '700'}} dy={15} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                <Tooltip 
                                    cursor={{fill: '#f8faff', dark: {fill: '#1c1c1c'}, radius: 15}}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) return (
                                            <div className="bg-white dark:bg-[#1c1c1c] p-4 rounded-2xl shadow-2xl border-none outline-none">
                                                <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{payload[0].payload.name}</p>
                                                <p className="text-xl font-black dark:text-white">{payload[0].value}%</p>
                                            </div>
                                        );
                                        return null;
                                    }}
                                />
                                <Bar dataKey="taux" radius={[10, 10, 10, 10]} barSize={40}>
                                    {data.cotisationStats.map((entry, index) => (
                                        <Cell key={index} fill={entry.name === 'RCAR' ? 'url(#barGradient)' : '#e2e8f0'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Financial Sum-up */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="flex-1 bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-[2.5rem] shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden group">
                        <Zap className="absolute -right-2 -top-2 w-32 h-32 text-white/5 -rotate-12" />
                        <div className="relative z-10 flex flex-col h-full justify-between">
                            <div>
                                <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">Charges RCAR</span>
                                <h2 className="text-4xl font-black mt-4 tracking-tight leading-none">
                                    {Number(data.charges.rcar).toLocaleString('fr-FR')} <span className="text-lg font-medium opacity-60">DH</span>
                                </h2>
                            </div>
                            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                                <div className="text-xs font-semibold opacity-80 italic">Prélèvements Employeur</div>
                                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center"><TrendingUp size={16} /></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] border border-slate-100 dark:border-[#1c1c1c] shadow-sm">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retenue IR Globale</span>
                         <h2 className="text-4xl font-black text-slate-900 dark:text-white mt-4 tracking-tight">
                            {Number(data.charges.ir).toLocaleString('fr-FR')} <span className="text-lg font-bold text-slate-400">DH</span>
                         </h2>
                         <div className="mt-6 flex items-center gap-2">
                             <div className="flex -space-x-2">
                                 {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full border-2 border-white dark:border-[#121212] bg-slate-200 dark:bg-[#262626]"></div>)}
                             </div>
                             <span className="text-[10px] text-slate-400 font-bold">Basé sur +{data.cards[1]?.value || 0} employés</span>
                         </div>
                    </div>
                </div>
            </div>

            {/* Modern Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod, idx) => (
                    <div key={idx} className="group bg-white dark:bg-[#121212] p-8 rounded-[2rem] border border-slate-100 dark:border-[#1c1c1c] hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-500/5 text-indigo-600 rounded-2xl transition-transform group-hover:scale-110">
                                <Settings size={22} strokeWidth={2.5} />
                            </div>
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg tracking-wider ${mod.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                {mod.status}
                            </span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2">{mod.title}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{mod.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const modules = [
    { title: 'RCAR', desc: 'Gestion automatisée des cotisations de retraite collective et affiliation des agents.', status: 'ACTIF' },
    { title: 'IR Fiscalité', desc: 'Calcul précis de l\'impôt sur le revenu basé sur les derniers barèmes légaux.', status: 'ACTIF' },
    { title: 'Indemnités', desc: 'Moteur de calcul des primes, indemnités de fonction et frais de déplacement.', status: 'ACTIF' },
    { title: 'SNTL Mission', desc: 'Planification logistique, ordres de mission et gestion des véhicules de service.', status: 'CONFIGURE' },
    { title: 'Retraite', desc: 'Simulations de fin de carrière et accompagnement au départ à la retraite.', status: 'ACTIF' },
    { title: 'Crédit Social', desc: 'Traitement des demandes de prêts sociaux et avances sur salaire.', status: 'ACTIF' },
];

export default Dashboard;