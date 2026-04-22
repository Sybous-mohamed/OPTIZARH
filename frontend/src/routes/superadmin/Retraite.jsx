import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { Settings, Calendar, Info, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const Retraite = () => {
    const { showNotification } = useNotification();

    const [ageLegal, setAgeLegal] = useState(60);
    const [notification, setNotification] = useState('6 mois avant');
    const [dureeProlongation, setDureeProlongation] = useState(2);
    const [nombreProlongations, setNombreProlongations] = useState('2 fois');
    const [desactiverRCAR, setDesactiverRCAR] = useState(true);
    const [maintenirAutres, setMaintenirAutres] = useState(true);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const choices = ['1 fois', '2 fois', '3 fois', 'Illimité'];

    useEffect(() => {
        api.get('/api/retraite').then(res => {
            const d = res.data;
            if (d) {
                setAgeLegal(d.age_legal_retraite || 60);
                setNotification(d.notification_retraite || '6 mois avant');
                setDureeProlongation(d.duree_prolongation_max || 2);
                setNombreProlongations(d.nb_prolongations_max || '2 fois');
                setDesactiverRCAR(!!d.desactiver_rcar);
                setMaintenirAutres(!!d.maintenir_autres_cotisations);
            }
            setLoading(false);
        }).catch(err => {
            console.error("Erreur Fetch:", err);
            setLoading(false);
        });
    }, []);

    const handleSave = async () => {
        if (ageLegal < 45 || ageLegal > 75) {
            showNotification("L'âge doit être entre 45 et 75 ans", "error");
            return;
        }

        setSaving(true);
        try {
            const data = {
                age_legal_retraite: ageLegal,
                notification_retraite: notification,
                duree_prolongation_max: dureeProlongation,
                nb_prolongations_max: nombreProlongations,
                desactiver_rcar: desactiverRCAR,
                maintenir_autres_cotisations: maintenirAutres
            };
            await api.post('/api/retraite/update', data);
            showNotification("Paramètres enregistrés avec succès !", "success");
        } catch (error) {
            showNotification(error.response?.data?.message || "Erreur d'enregistrement", "error");
        } finally {
            setSaving(false);
        }
    };

   return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500  bg-[#F8FAFC] dark:bg-[#000000] min-h-screen pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Paramétrage Retraite</h1>
                    <p className="text-slate-500 dark:text-gray-500 text-sm font-medium italic uppercase tracking-tighter">Gérez le cadre légal et les conditions de fin de carrière.</p>
                </div>
                <button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50 cursor-pointer">
                    {saving && <Clock className="animate-spin" size={16} />}
                    {saving ? 'Enregistrement...' : 'Sauvegarder les modifications'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Main Settings Card */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-slate-100 dark:border-[#262626] shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100 dark:shadow-none">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Seuil de Retraite</h2>
                                <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">Définissez l'âge et les alertes préventives.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group space-y-2">
                                <label className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1 group-focus-within:text-indigo-600 transition-colors">
                                    Âge légal par défaut
                                </label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={ageLegal} 
                                        onChange={(e) => setAgeLegal(e.target.value)}
                                        className={`w-full text-2xl h-16 pl-6 pr-16 rounded-2xl border-2 outline-none font-black transition-all ${
                                            (ageLegal < 45 || ageLegal > 75) 
                                            ? 'border-red-100 bg-red-50 text-red-600 dark:bg-red-900/10 dark:border-red-900/20' 
                                            : 'bg-slate-50 dark:bg-[#1c1c1c] border-transparent dark:border-[#262626] focus:border-indigo-100 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1c1c1c] text-slate-700 dark:text-white'
                                        }`}
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500 font-bold">ans</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Déclenchement Alerte</label>
                                <div className="relative">
                                    <select 
                                        value={notification} 
                                        onChange={(e) => setNotification(e.target.value)}
                                        className="w-full h-16 px-6 rounded-2xl bg-slate-50 dark:bg-[#1c1c1c] border-2 border-transparent dark:border-[#262626] focus:border-indigo-100 dark:focus:border-indigo-500 focus:bg-white dark:focus:bg-[#1c1c1c] outline-none font-bold text-slate-700 dark:text-white appearance-none cursor-pointer">
                                        <option value="2 mois avant">2 mois avant</option>
                                        <option value="6 mois avant">6 mois avant</option>
                                        <option value="1 an avant">1 an avant</option>
                                        <option value="2 ans avant">2 ans avant</option>
                                    </select>
                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-gray-600 rotate-90" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Extension Policy Card */}
                    <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-slate-100 dark:border-[#262626] shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white uppercase tracking-tight">Politique de Prolongation</h2>
                                    <p className="text-xs text-slate-400 dark:text-gray-500 font-medium italic">Gestion du "Tamdid" après l'âge légal.</p>
                                </div>
                            </div>
                            <ToggleSwitch checked={dureeProlongation > 0} onChange={() => setDureeProlongation(dureeProlongation > 0 ? 0 : 2)} />
                        </div>

                        <div className={`space-y-8 transition-all duration-300 ${dureeProlongation > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                            <div className="flex items-center justify-between p-5 bg-slate-50 dark:bg-[#1c1c1c] rounded-2xl border border-slate-100 dark:border-[#262626]">
                                <div>
                                    <span className="block text-sm font-bold text-slate-700 dark:text-white uppercase">Durée maximale autorisée</span>
                                    <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-bold tracking-tighter">Cumul total des années de service supp.</span>
                                </div>
                                <div className="flex items-center gap-3 bg-white dark:bg-[#121212] p-2 rounded-xl border border-slate-200 dark:border-[#262626]">
                                    <input 
                                        type="number" 
                                        value={dureeProlongation} 
                                        onChange={(e) => setDureeProlongation(e.target.value)}
                                        className="w-12 text-center bg-transparent text-indigo-600 dark:text-indigo-400 font-black text-lg outline-none"
                                    />
                                    <span className="text-[10px] font-black text-slate-300 dark:text-gray-600 uppercase pr-2 border-l dark:border-[#262626] pl-2">Ans</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[11px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest ml-1">Fréquence de renouvellement</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {choices.map((opt) => (
                                        <button 
                                            key={opt} 
                                            onClick={() => setNombreProlongations(opt)}
                                            className={`py-3.5 text-xs font-black uppercase rounded-2xl border-2 transition-all ${
                                                nombreProlongations === opt 
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none scale-[1.02]' 
                                                : 'bg-white dark:bg-[#1c1c1c] border-slate-100 dark:border-[#262626] text-slate-400 dark:text-gray-500 hover:border-slate-200 dark:hover:border-[#333]'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info & Rules */}
                <div className="space-y-6">
                    {/* Summary Card */}
                    <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-6">
                                <Info size={18} className="text-indigo-200" />
                                <h3 className="font-bold text-sm uppercase tracking-widest">Vue d'ensemble</h3>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-xs text-indigo-100 font-medium">Départ prévu à</span>
                                    <span className="text-xl font-black">{ageLegal} ans</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-xs text-indigo-100 font-medium">Extension max</span>
                                    <span className="text-xl font-black">+{dureeProlongation} ans</span>
                                </div>
                                <div className="flex justify-between items-end border-b border-white/10 pb-3">
                                    <span className="text-xs text-indigo-100 font-medium">RCAR</span>
                                    <span className="text-sm font-black uppercase bg-white/20 px-2 py-0.5 rounded-md">
                                        {desactiverRCAR ? "OFF" : "ON"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Decorative circles */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-400/20 rounded-full blur-2xl"></div>
                    </div>

                    {/* Specific Rules Card */}
                    <div className="bg-white dark:bg-[#121212] rounded-3xl p-8 border border-slate-100 dark:border-[#262626] shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-indigo-600 dark:text-indigo-400" size={20} />
                            <h3 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-widest">Règles métier</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1c1c1c] rounded-2xl hover:bg-slate-100/50 dark:hover:bg-[#262626] transition-colors cursor-pointer group border border-transparent dark:border-[#262626]">
                                <span className="text-xs font-bold text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-tighter">Désactiver RCAR</span>
                                <ToggleSwitch checked={desactiverRCAR} onChange={() => setDesactiverRCAR(!desactiverRCAR)} small />
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#1c1c1c] rounded-2xl hover:bg-slate-100/50 dark:hover:bg-[#262626] transition-colors cursor-pointer group border border-transparent dark:border-[#262626]">
                                <span className="text-xs font-bold text-slate-600 dark:text-gray-400 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-tighter">Maintenir cotisations</span>
                                <ToggleSwitch checked={maintenirAutres} onChange={() => setMaintenirAutres(!maintenirAutres)} small />
                            </div>
                        </div>
                        
                        <p className="mt-6 text-[10px] text-slate-400 dark:text-gray-600 leading-relaxed font-bold uppercase tracking-tighter italic">
                            * Ces règles s'appliquent automatiquement lors du calcul de la liquidation de retraite pour chaque collaborateur.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- Refined Toggle Component --- */
const ToggleSwitch = ({ checked, onChange, small }) => (
    <label className={`relative inline-flex items-center cursor-pointer transition-transform active:scale-95 ${small ? 'scale-75' : 'scale-100'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-12 h-6.5 bg-slate-200 dark:bg-[#262626] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
    </label>
);

export default Retraite;