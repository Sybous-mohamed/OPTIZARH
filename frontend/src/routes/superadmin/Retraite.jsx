import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { Settings, Calendar, Info,Loader2 } from 'lucide-react';
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
                    setNotification(d.notification_retraite ||'6 mois avant');
                    setDureeProlongation(d.duree_prolongation_max || 2);
                    setNombreProlongations(d.nb_prolongations_max || '2 fois');
                    setDesactiverRCAR(!!d.desactiver_rcar);
                    setMaintenirAutres(!!d.maintenir_autres_cotisations);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error("Erreur Fetch:", err);
                setLoading(false);
            });
    }, []);

    const handleSave = async () => {
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
            showNotification(`enregistrée avec succès !`, "success");

        } catch (error) {
            console.error("Erreur Save:", error);
            showNotification("Erreur lors de l'enregistrement !", "error");
        } finally {
            setSaving(false);
        }
    };

   if (loading)
         return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={48}/>
            <p className="text-gray-400 font-black uppercase text-xs">Chargement...</p>
        </div>
    );

    return (
        <div className="space-y-5 max-w-6xl mx-auto ">
            <div>
                <h1 className="text-xl font-bold text-slate-900">Configuration Retraite & Tamdid</h1>
                <p className="text-slate-500 text-sm">Gérez les paramètres légaux et les règles de prolongation de service.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <Calendar size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">Paramètres de Retraite</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Âge légal de retraite</label>
                            <div className="relative">
                                <input type="number" value={ageLegal} onChange={(e) => setAgeLegal(e.target.value)}
                                    className="w-full p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-semibold text-slate-700 transition-all text-sm" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-xs">ans</span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Notification avant retraite</label>
                            <select value={notification} onChange={(e) => setNotification(e.target.value)}
                                className="w-full p-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl outline-none font-semibold text-slate-700 text-sm cursor-pointer appearance-none">
                                <option value="6 mois avant">6 mois avant</option>
                                <option value="1 an avant">1 an avant</option>
                                <option value="2 ans avant">2 ans avant</option>
                            </select>
                        </div>
                    </div>


                    <div className="flex justify-end">
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
                        </button>
                    </div>
                </div>


                <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden flex flex-col">
                    <h3 className="flex items-center gap-2 font-bold text-sm mb-4">
                        <Info size={16} className="opacity-80" />
                        Résumé des règles actives
                    </h3>
                    
                    <div className="space-y-3 relative z-10">
                        <SummaryItem label="Âge Fixé" value={`${ageLegal} ans`} />
                        <SummaryItem label="Statut Tamdid" value={`Autorisé (${dureeProlongation} ans)`} />
                        <SummaryItem label="Cotisation RCAR" value={desactiverRCAR ? "Désactivée" : "Activée"} />
                    </div>
                    
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                </div>

            </div>




            {/* --- Section 2: Prolongation & Cotisations --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Prolongation (Tamdid) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Settings size={20} /></div>
                            <h2 className="text-lg font-bold text-slate-800">Prolongation (Tamdid)</h2>
                        </div>
                        {/* Hna derna toggle logic simple */}
                        <ToggleSwitch checked={dureeProlongation > 0} onChange={() => setDureeProlongation(dureeProlongation > 0 ? 0 : 2)} />
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100/50">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">Durée maximale (ans)</span>
                            <input 
                                type="number" 
                                value={dureeProlongation} 
                                onChange={(e) => setDureeProlongation(e.target.value)}
                                className="w-16 bg-transparent text-right text-indigo-700 font-bold text-xs outline-none"
                            />
                        </div>

                        <div className="space-y-3">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre maximum</label>
                            <div className="grid grid-cols-4 gap-2">
                                {choices.map((opt) => (
                                    <button 
                                        key={opt} 
                                        onClick={() => setNombreProlongations(opt)}
                                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${nombreProlongations === opt ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-400'}`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button onClick={handleSave} className="w-full py-2.5 bg-indigo-50 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-100 hover:bg-indigo-100 transition-colors">
                            Appliquer la politique
                        </button>
                    </div>
                </div>

                {/* Cotisations Logic */}
                <div className="flex flex-col gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-3 text-xs uppercase tracking-tight">Cotisations</h3>
                        <div className="space-y-1">
                            <CheckboxItem 
                                label="Désactiver RCAR automatiquement" 
                                checked={desactiverRCAR} 
                                onChange={() => setDesactiverRCAR(!desactiverRCAR)} 
                            />
                            <CheckboxItem 
                                label="Maintenir les autres (CNSS)" 
                                checked={maintenirAutres} 
                                onChange={() => setMaintenirAutres(!maintenirAutres)} 
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-indigo-600 border-y-slate-100 border-r-slate-100 border-y border-r flex-1">
                        <h3 className="font-bold text-slate-800 mb-4 text-xs uppercase tracking-wider">Règles Spécifiques</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-600">Désactiver RCAR</span>
                                <ToggleSwitch checked={desactiverRCAR} onChange={() => setDesactiverRCAR(!desactiverRCAR)} small />
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-600">Maintenir cotisations</span>
                                <ToggleSwitch checked={maintenirAutres} onChange={() => setMaintenirAutres(!maintenirAutres)} small />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="text-center pt-10 text-[10px] font-black text-slate-300 tracking-[0.3em] uppercase">
                OptizaRH • Guelmim • 2026
            </div>
        </div>
    );
};

// --- Helpers components (Zid lihom "checked" o "onChange" props) ---
const SummaryItem = ({ label, value }) => (
    <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
        <p className="text-[9px] font-bold text-indigo-100 uppercase mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-white">{value}</p>
    </div>
);

const CheckboxItem = ({ label, checked, onChange }) => (
    <label className="flex justify-between items-center py-2 px-1 cursor-pointer group">
        <span className="text-xs font-medium text-slate-600 group-hover:text-indigo-600 transition-colors">{label}</span>
        <input 
            type="checkbox" 
            checked={checked} 
            onChange={onChange}
            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-0 cursor-pointer" 
        />
    </label>
);

const ToggleSwitch = ({ checked, onChange, small }) => (
    <label className={`relative inline-flex items-center cursor-pointer ${small ? 'scale-75' : 'scale-90'}`}>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-10 h-5.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-indigo-600"></div>
    </label>
);

export default Retraite;