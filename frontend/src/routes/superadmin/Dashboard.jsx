import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    Cell
} from 'recharts';
import { 
    Users, 
    UserCheck, 
    Wallet, 
    Layout, 
    Settings, 
    TrendingUp, 
    Bell,
    ShieldCheck,
    Banknote 
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
                if (res.data) {
                    setData(res.data);
                }
            } catch (err) {
                console.error("Erreur Backend:", err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const icons = [
        <Users size={20} />,      
        <UserCheck size={20} />,  
        <Banknote size={20} />,   
        <Wallet size={20} />      
    ];

    const modules = [
        { title: 'RCAR', desc: 'Gestion des cotisations et affiliation.', status: 'ACTIF' },
        { title: 'IR', desc: 'Barèmes d\'imposition et calcul fiscal.', status: 'ACTIF' },
        { title: 'Indemnités', desc: 'Primes et frais de déplacement.', status: 'ACTIF' },
        { title: 'SNTL', desc: 'Logistique et ordres de mission.', status: 'CONFIGURE' },
        { title: 'Retraite', desc: 'Prévisions et fin de carrière.', status: 'ACTIF' },
        { title: 'Crédit', desc: 'Prêts sociaux et avances.', status: 'ACTIF' },
    ];

    // Custom Tooltip bach may-t-khbech l-graph
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-2xl shadow-2xl border dark:border-[#333] border-slate-100">
                    <p className="text-[10px] font-black text-indigo-500 uppercase mb-1">{label}</p>
                    <p className="text-lg font-black dark:text-white">
                        {payload[0].value}% <span className="text-[10px] text-gray-400">Taux</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#f8faff] dark:bg-[#050505]">
            <div className="animate-pulse text-indigo-600 font-black text-xl tracking-tighter">
                OPTIZARH <span className="text-gray-400 italic font-medium">SYSTEM...</span>
            </div>
        </div>
    );

    return (
        <div className="p-6 bg-[#f8faff] dark:bg-[#050505] min-h-screen font-sans transition-colors duration-300">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-8 px-2">
                <div className="flex flex-col">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight italic">
                        OptizaRH <span className="text-indigo-600 font-medium">Dashboard</span>
                    </h2>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Système de pilotage RH v1.0</span>
                </div>
                <div className="p-3 bg-white dark:bg-[#121212] border dark:border-[#262626] rounded-2xl text-gray-400 shadow-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-[#1c1c1c] transition-all relative">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-indigo-600 rounded-full border-2 border-white dark:border-[#121212]"></span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {data.cards.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#121212] p-6 rounded-[2.5rem] border dark:border-[#262626] flex items-center gap-5 hover:border-indigo-500 transition-all shadow-sm group">
                        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-[#1c1c1c] text-indigo-500 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                            {icons[idx] || <Layout size={20} />}
                        </div>
                        <div className="flex-1">
                            <h4 className="text-gray-400 text-[10px] font-black uppercase tracking-widest leading-none mb-1">{item.label}</h4>
                            <p className="text-2xl font-black dark:text-gray-100 tracking-tight">{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
                
                {/* Visualisation Chart */}
                <div className="lg:col-span-8 bg-white dark:bg-[#121212] p-8 rounded-[3rem] border dark:border-[#262626] shadow-sm relative">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black dark:text-gray-100 flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                <ShieldCheck className="text-indigo-600" size={20} />
                            </div>
                            Taux de Cotisation (%)
                        </h3>
                        <div className="flex gap-2">
                             <span className="w-3 h-3 rounded-full bg-indigo-600"></span>
                             <span className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800"></span>
                        </div>
                    </div>
                    
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {data.cotisationStats && data.cotisationStats.length > 0 ? (
                                <BarChart data={data.cotisationStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" dark:stroke="#262626" />
                                    <XAxis 
                                        dataKey="name" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '900'}} 
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="taux" radius={[12, 12, 12, 12]} barSize={45}>
                                        {data.cotisationStats.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={entry.name === 'RCAR' ? '#6366f1' : (entry.name.includes('IR') ? '#94a3b8' : '#cbd5e1')} 
                                                fillOpacity={entry.name === 'RCAR' ? 1 : 0.4}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400 italic text-sm">Chargement du graphique...</div>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Vertical Highlights */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    
                    <div className="flex-1 bg-indigo-600 p-8 rounded-[3rem] shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 h-full flex flex-col justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-white/70">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Charges RCAR ({new Date().getFullYear()})</span>
                                </div>
                                <p className="text-4xl font-black text-white mt-1">
                                    {Number(data.charges.rcar).toLocaleString('fr-FR')} <span className="text-lg font-medium opacity-60 italic uppercase">dh</span>
                                </p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 w-fit">
                                <p className="text-[9px] text-white font-black uppercase tracking-tighter">Barème RG/RC Actif</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 bg-white dark:bg-[#121212] p-8 rounded-[3rem] border dark:border-[#262626] shadow-sm group">
                        <div className="flex flex-col h-full justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-gray-400">
                                    <TrendingUp size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Retenue IR Totale</span>
                                </div>
                                <p className="text-4xl font-black dark:text-gray-100 mt-1">
                                    {Number(data.charges.ir).toLocaleString('fr-FR')} <span className="text-lg font-bold text-gray-400 italic uppercase">dh</span>
                                </p>
                            </div>
                            <p className="text-[10px] text-gray-400 font-medium italic border-t dark:border-[#262626] pt-4 mt-4">
                                Calculé sur {data.cards[1]?.value || 0} employés actifs
                            </p>
                        </div>
                    </div>

                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((mod, idx) => (
                    <div key={idx} className="bg-white dark:bg-[#121212] p-7 rounded-[2.5rem] border dark:border-[#262626] group hover:border-indigo-500 transition-all shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-slate-50 dark:bg-[#1c1c1c] rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                <Settings size={20} />
                            </div>
                            <span className={`text-[8px] font-black px-3 py-1 rounded-full ${mod.status === 'ACTIF' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10'}`}>
                                {mod.status}
                            </span>
                        </div>
                        <h4 className="text-lg font-black dark:text-white tracking-tight leading-none">{mod.title}</h4>
                        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed font-medium italic">{mod.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;