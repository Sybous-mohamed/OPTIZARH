import React, { useState, useEffect, useMemo } from 'react';
import { 
    Plus, History, X, FileText, Landmark, 
    Loader2, Trash2, ChevronDown, Save, Sliders
} from 'lucide-react';

import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';

const ParametrageRCAR = () => {
    const { showNotification } = useNotification();
    const [configData, setConfigData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newYearInput, setNewYearInput] = useState('');
    const [historyFilter, setHistoryFilter] = useState('all');
    
    const [currentConfig, setCurrentConfig] = useState({
        id: null, annee: '',
        salariale_active: true, patronale_active: true,
        salariale_rg_taux: 0, salariale_rc_taux: 0,
        salariale_rg_plafond: 0, salariale_rc_plafond: 0,
        patronale_rg_taux: 0, patronale_rc_taux: 0,
        patronale_rg_plafond: 0, patronale_rc_plafond: 0
    });

    const loadData = async (targetYear = null) => {
        try {
            setLoading(true);
            const response = await api.get('/api/rcar');
            const data = response.data;
            setConfigData(data);
            
            if (data && data.length > 0) {
                const yearToSelect = targetYear || selectedYear || data[0].annee;
                const selected = data.find(c => String(c.annee) === String(yearToSelect)) || data[0];
                
                setSelectedYear(selected.annee);
                setCurrentConfig(selected);
            }
        } catch (err) {
            showNotification("Erreur de chargement", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const filteredHistory = useMemo(() => {
        if (historyFilter === 'all') return configData;
        return configData.filter(item => String(item.annee) === String(historyFilter));
    }, [configData, historyFilter]);

    const handleUpdate = async () => {
        if (!currentConfig.id) return;
        try {
            await api.put(`/api/rcar/${currentConfig.id}`, currentConfig);
            showNotification(`L'année ${currentConfig.annee} enregistrée !`, "success");
            loadData();
        } catch (err) {
            showNotification("Erreur de mise à jour", "error");
        }
    };

    const handleDelete = async (id, year) => {
        if (window.confirm(`Voulez-vous vraiment supprimer l'année ${year} ?`)) {
            try {
                await api.delete(`/api/rcar/${id}`);
                showNotification(`L'année ${year} supprimée`, "success"); 
                const newData = configData.filter(c => c.id !== id);
                setConfigData(newData);
                if (newData.length > 0) {
                    setSelectedYear(newData[0].annee);
                    setCurrentConfig(newData[0]);
                } else {
                    setSelectedYear('');
                }
            } catch (err) {
                showNotification("Erreur lors de la suppression", "error");
            }
        }
    };

    const handleAddYear = async (e) => {
        e.preventDefault();
        const yearValue = parseInt(newYearInput);
        if (!yearValue || yearValue < 1990 || yearValue > 2200) {
            showNotification("Veuillez saisir une année valide", "error");
            return; 
        }
        try {
            const payload = { annee: newYearInput, salariale_active: true, patronale_active: true };
            await api.post('/api/rcar', payload);
            showNotification(`L'année ${newYearInput} ajoutée !`, "success");
            setIsModalOpen(false);
            const addedYear = newYearInput;
            setNewYearInput('');
            await loadData(addedYear); 
        } catch (err) {
            showNotification("Erreur : l'année existe déjà", "error");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <Loader2 className="animate-spin text-indigo-600" size={48}/>
            <p className="text-gray-400 dark:text-gray-500 font-black uppercase text-xs tracking-widest">Chargement...</p>
        </div>
    );

    if (configData.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 bg-white dark:bg-[#0a0a0a] rounded-[2.5rem]">
                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-8 rounded-[3rem] text-indigo-600 dark:text-indigo-400">
                    <Sliders size={64} strokeWidth={1.5} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Aucune donnée trouvée</h2>
                    <p className="text-gray-400 dark:text-gray-500 text-sm max-w-xs mx-auto italic uppercase">Paramétrez votre première année fiscale RCAR.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 dark:bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-none hover:scale-105 transition-all flex items-center gap-3 cursor-pointer">
                    <Plus size={20}/> Ajouter une année
                </button>
                {isModalOpen && <AddYearModal newYearInput={newYearInput} setNewYearInput={setNewYearInput} handleAddYear={handleAddYear} setIsModalOpen={setIsModalOpen} />}
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10 px-4 md:px-8 bg-[#F8FAFC] dark:bg-[#0a0a0a] min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center ">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Paramétrage RCAR</h1>
                    <p className="text-gray-400 dark:text-gray-500 text-sm font-medium italic uppercase tracking-tighter">Configuration pour l'Année {selectedYear}</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative min-w-[140px]">
                        <select value={selectedYear} 
                            onChange={(e) => {
                                const selected = configData.find(c => String(c.annee) === String(e.target.value));
                                setSelectedYear(e.target.value);
                                setCurrentConfig(selected);
                            }}
                            className="w-full appearance-none bg-white dark:bg-[#121212] dark:text-white border border-gray-200 dark:border-[#262626] rounded-xl px-4 py-2.5 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm">
                            {configData.map(c => <option key={c.id} value={c.annee}>{c.annee}</option>)}
                        </select>
                        <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={14}/>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="bg-white dark:bg-[#121212] text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-[#262626] px-5 py-2.5 rounded-xl text-sm font-black uppercase flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-[#1c1c1c] transition-all">
                        <Plus size={18}/> Nouveau
                    </button>
                </div>
            </div>

            {/* Forms Section */}
            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden lg:block">
                    <button 
                        onClick={() => handleDelete(currentConfig.id, currentConfig.annee)}
                        className="bg-white dark:bg-[#121212] p-4 rounded-full shadow-2xl border border-red-50 dark:border-red-900/20 hover:bg-red-50 dark:hover:bg-red-900/10 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-all active:scale-90 cursor-pointer">
                        <Trash2 size={24}/>
                    </button>
                </div>

                <CardSection 
                    title="Part Salariale" icon={<Landmark size={20}/>}
                    isActive={currentConfig.salariale_active}
                    setIsActive={(v) => setCurrentConfig({...currentConfig, salariale_active: v})}
                    data={{ rg: currentConfig.salariale_rg_taux, rc: currentConfig.salariale_rc_taux, prg: currentConfig.salariale_rg_plafond, prc: currentConfig.salariale_rc_plafond }}
                    setData={(d) => setCurrentConfig({...currentConfig, salariale_rg_taux: d.rg, salariale_rc_taux: d.rc, salariale_rg_plafond: d.prg, salariale_rc_plafond: d.prc })}
                    onSave={handleUpdate}
                />
                <CardSection 
                    title="Part Patronale" icon={<FileText size={20}/>}
                    isActive={currentConfig.patronale_active}
                    setIsActive={(v) => setCurrentConfig({...currentConfig, patronale_active: v})}
                    data={{ rg: currentConfig.patronale_rg_taux, rc: currentConfig.patronale_rc_taux, prg: currentConfig.patronale_rg_plafond, prc: currentConfig.patronale_rc_plafond }}
                    setData={(d) => setCurrentConfig({...currentConfig, patronale_rg_taux: d.rg, patronale_rc_taux: d.rc, patronale_rg_plafond: d.prg, patronale_rc_plafond: d.prc })}
                    onSave={handleUpdate}
                    isPatronale={true}
                />
            </div>

            {/* Historique */}
            <div className="bg-white dark:bg-[#121212] rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 dark:border-[#262626]">
                <div className="p-6 border-b border-gray-50 dark:border-[#262626] flex justify-between items-center bg-gray-50/30 dark:bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <History size={18} className="text-gray-400"/>
                        <h3 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">Historique</h3>
                    </div>
                    <select value={historyFilter} onChange={(e) => setHistoryFilter(e.target.value)}
                        className="bg-white dark:bg-[#1c1c1c] dark:text-white border border-gray-100 dark:border-[#262626] rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-tight outline-none focus:ring-1 focus:ring-indigo-400 shadow-sm">
                        <option value="all">Toutes les années</option>
                        {[...new Set(configData.map(c => c.annee))].sort((a, b) => b - a).map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#F8FAFC] dark:bg-[#1c1c1c]/40 text-[10px] font-black text-gray-400 uppercase">
                            <tr>
                                <th className="px-8 py-4">Année</th>
                                <th className="px-8 py-4">Type</th>
                                <th className="px-8 py-4 text-center">RG (%)</th>
                                <th className="px-8 py-4 text-center">RC (%)</th>
                                <th className="px-8 py-4">Plafonds (RG / RC)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[#262626]">
                            {filteredHistory.map(c => {
                                const formatPlafond = (val) => (val === null || val === 0) ? "Sans Plafond" : val.toLocaleString() + " DH";
                                return (
                                    <React.Fragment key={c.id}>
                                        <TableRow year={c.annee} type="Salariale" isActive={c.salariale_active} rg={c.salariale_rg_taux} rc={c.salariale_rc_taux} plafond={`${formatPlafond(c.salariale_rg_plafond)} / ${formatPlafond(c.salariale_rc_plafond)}`} />
                                        <TableRow year="" type="Patronale" isActive={c.patronale_active} rg={c.patronale_rg_taux} rc={c.patronale_rc_taux} plafond={`${formatPlafond(c.patronale_rg_plafond)} / ${formatPlafond(c.patronale_rc_plafond)}`} />
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && <AddYearModal newYearInput={newYearInput} setNewYearInput={setNewYearInput} handleAddYear={handleAddYear} setIsModalOpen={setIsModalOpen} />}
        </div>
    );
};

/* --- Sub-Components --- */

const AddYearModal = ({ newYearInput, setNewYearInput, handleAddYear, setIsModalOpen }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
        <form className="bg-white dark:bg-[#121212] border dark:border-[#262626] w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl" onSubmit={handleAddYear}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Nouvelle Année</h3>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-300 dark:text-gray-600 hover:text-red-500"><X size={24}/></button>
            </div>
            <div className="space-y-4">
                <input type="number" value={newYearInput} onChange={(e) => setNewYearInput(e.target.value)} placeholder="2026" 
                    className="w-full bg-gray-50 dark:bg-[#1c1c1c] dark:text-white border border-gray-100 dark:border-[#262626] rounded-2xl px-5 py-4 font-bold outline-none focus:ring-2 focus:ring-indigo-500" required />
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-pointer shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all">Confirmer</button>
            </div>
        </form>
    </div>
);

const CardSection = ({ title, icon, isActive, setIsActive, data, setData, onSave }) => (
    <div className={`bg-white dark:bg-[#121212] rounded-[2.5rem] p-8 border border-gray-100 dark:border-[#262626] transition-all duration-300 ${!isActive ? 'opacity-40 grayscale-[0.5]' : 'shadow-sm'}`}>
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl">{icon}</div>
                <h3 className="font-black text-lg text-slate-800 dark:text-white uppercase tracking-tight">{title}</h3>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                <div className="w-10 h-5 bg-gray-200 dark:bg-[#262626] rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5 shadow-inner"></div>
            </label>
        </div>
        <div className="grid grid-cols-2 gap-5 mb-8">
            <InputField label="Taux RG (%)" value={data.rg} onChange={(v) => setData({...data, rg: v})} disabled={!isActive} />
            <InputField label="Taux RC (%)" value={data.rc} onChange={(v) => setData({...data, rc: v})} disabled={!isActive} />
            <InputField label="Plafond RG" value={data.prg} onChange={(v) => setData({...data, prg: v})} disabled={!isActive} showHint={true}/>
            <InputField label="Plafond RC" value={data.prc} onChange={(v) => setData({...data, prc: v})} disabled={!isActive} showHint={true}/>
        </div>
        <button onClick={onSave} disabled={!isActive} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-[#1c1c1c] dark:disabled:text-gray-600 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer">
            <Save size={16}/> Enregistrer
        </button>
    </div>
);

const InputField = ({ label, value, onChange, disabled, showHint }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const isPlafondField = showHint === true;
    const isNoPlafond = isPlafondField && (value === null || value === 0 || value === '');
    
    return (
        <div className="space-y-1.5 group">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-500">
                {label}
            </label>
            <div className="relative">
                <input 
                    type={(isNoPlafond && !isEditing) ? "text" : "number"} 
                    value={isEditing ? (value === 0 || value === null ? '' : value) : (isNoPlafond ? 'Sans plafond' : (value ?? 0))}
                    onFocus={() => setIsEditing(true)}
                    onBlur={() => setIsEditing(false)}
                    onChange={(e) => {
                        const v = e.target.value;
                        if (v === "") {
                            onChange(isPlafondField ? null : 0);
                        } else {
                            let p = parseFloat(v);
                            if (!isPlafondField) {
                                if (p > 100) p = 100; if (p < 0) p = 0;
                            } else { if (p < 0) p = 0; }
                            onChange(isNaN(p) ? (isPlafondField ? null : 0) : p);
                        }
                    }}
                    disabled={disabled}
                    className={`w-full bg-[#F1F5F9] dark:bg-[#1c1c1c] border-none rounded-xl px-4 py-3.5 text-sm font-black outline-none focus:ring-1 focus:ring-indigo-400 transition-all dark:text-white
                        ${isNoPlafond && !isEditing ? 'text-indigo-400/60 dark:text-indigo-400/40 italic font-medium' : 'text-slate-600'}`} 
                />
                {!isNoPlafond && !isEditing && value !== null && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 dark:text-gray-600">
                        {isPlafondField ? 'DH' : '%'}
                    </span>
                )}
            </div>
            {isEditing && isPlafondField && (
                <p className="text-[9px] text-indigo-500 font-bold italic ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    💡 Effacez tout pour "Sans plafond"
                </p>
            )}
        </div>
    );
};

const TableRow = ({ year, type, rg, rc, plafond, isActive }) => (
    <tr className={`transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] ${!isActive ? 'bg-gray-50/30 dark:bg-black/20' : ''}`}>
        <td className="px-8 py-5 font-black text-slate-700 dark:text-gray-300 text-sm">{year}</td>
        <td className="px-8 py-5">
            <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-widest ${!isActive ? 'text-gray-400 dark:text-gray-600' : 'text-slate-600 dark:text-gray-400'}`}>{type}</span>
                {!isActive && (
                    <span className="bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter border border-red-100 dark:border-red-900/20">Inactif</span>
                )}
            </div>
        </td>
        <td className={`px-8 py-5 text-center font-bold text-xs ${!isActive ? 'text-gray-300 dark:text-gray-700' : 'text-indigo-600 dark:text-indigo-400'}`}>{rg}%</td>
        <td className={`px-8 py-5 text-center font-bold text-xs ${!isActive ? 'text-gray-300 dark:text-gray-700' : 'text-indigo-600 dark:text-indigo-400'}`}>{rc}%</td>
        <td className={`px-8 py-5 text-[10px] font-medium ${!isActive ? 'text-gray-300 dark:text-gray-700 italic' : 'text-slate-500 dark:text-gray-500'}`}>{plafond}</td>
    </tr>
);

export default ParametrageRCAR;