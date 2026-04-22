import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { 
    Plus, Trash2, Save, Loader2, Calendar, 
    PlusCircle, LayoutGrid, Download, ChevronRight, AlertCircle, Trash
} from 'lucide-react';

const GestionIR = () => {
    const { showNotification } = useNotification();
    const [annee, setAnnee] = useState(null); 
    const [anneesList, setAnneesList] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newYearInput, setNewYearInput] = useState('');

    const fetchAnnees = async () => {
        try {
            const res = await api.get('/api/ir/annees');
            const data = res.data || [];
            setAnneesList(data);
            if (data.length > 0 && !annee) {
                setAnnee(data[data.length - 1]);
            }
        } catch (e) { 
            console.error("Erreur fetchAnnees:", e); 
        }
    };

    const fetchData = async (year) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/ir/settings/${year}`);
            if (res.data.data_rows && res.data.data_rows.length > 0) {
                setRows(res.data.data_rows);
            } else {
                setRows([{ min: '', max: '', taux: '', marie: '', enfant1: '', enfant2: '' }]);
            }
        } catch (e) {
            setRows([{ min: '', max: '', taux: '', marie: '', enfant1: '', enfant2: '' }]);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchAnnees();
    }, []);

    useEffect(() => {
        if (annee) fetchData(annee);
    }, [annee]);

   const handleAddYearDirect = async () => {
        if (newYearInput && newYearInput.length === 4) {
            const yearToAdd = newYearInput;

            if (anneesList.includes(yearToAdd)) {
                showNotification(`Cet annee ${yearToAdd} existe déjà !`, "error");
                setAnnee(yearToAdd);
                setNewYearInput('');
                return;
            }

            setLoading(true);
            try {
                const initialRows = [{ min: 0, max: 0, taux: 0, marie: 0, enfant1: 0, enfant2: 0 }];
                await api.post(`/api/ir/settings/${yearToAdd}`, { data_rows: initialRows });

                setAnneesList(prevList => [...prevList, yearToAdd].sort((a, b) => a - b));
                setAnnee(yearToAdd);
                setRows(initialRows);
                setNewYearInput('');
                
                showNotification(`L'annee ${yearToAdd} a été créé avec succès`, "success");
            } catch (e) {
                showNotification("Erreur lors de l'ajoute d'un annee ","error");
            } finally {
                setLoading(false);
            }
        } else {
            showNotification("Veuillez entrer une année valide (ex: 2026)", "info");
        }
    };

    const handleDeleteYear = async () => {
        if (!annee) return;
        if (window.confirm(`⚠️ Voulez-vous vraiment supprimer l'annee ${annee} ?`)) {
            try {
                setLoading(true);
                await api.delete(`/api/ir/settings/${annee}`);
                showNotification(`L'annee ${annee} a été supprimé`, "success");
                setAnnee(null);
                setRows([]);
                fetchAnnees();
            } catch (e) { 
                showNotification("Erreur lors de la suppression", "error");
            } finally { 
                setLoading(false); 
            }
        }
    };

    const handleSave = async () => {
        if (!annee) return;
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const min = parseFloat(row.min || 0);
            const max = parseFloat(row.max || 0);
            if (max !== 0 && max <= min) {
                showNotification(`Erreur Tranche ${i + 1}: Le Max doit être supérieur au Min.`, "error");
                return; 
            }
        }

        setLoading(true);
        try {
            const cleanedRows = rows.map(row => ({
                min: row.min === "" ? 0 : parseFloat(row.min),
                max: row.max === "" ? 0 : parseFloat(row.max),
                taux: row.taux === "" ? 0 : parseFloat(row.taux),
                marie: row.marie === "" ? 0 : parseFloat(row.marie),
                enfant1: row.enfant1 === "" ? 0 : parseFloat(row.enfant1),
                enfant2: row.enfant2 === "" ? 0 : parseFloat(row.enfant2),
            }));

            await api.post(`/api/ir/settings/${annee}`, { data_rows: cleanedRows });
            
            showNotification(`L'année ${annee} enregistrée avec succès !`, "success");
            fetchAnnees();
        } catch (e) { 
            if (e.response && e.response.status === 422) {
                console.log("Validation Errors:", e.response.data.errors);
                showNotification("Erreur: Vérifiez les valeurs (Min < Max, Taux <= 100)", "error");
            } else {
                showNotification("Erreur lors de l'enregistrement", "error");
            }
        } finally { 
            setLoading(false); 
        }
    };


    const handleExportPDF = async () => {
        if (!annee) {
            showNotification("Veuillez sélectionner une année d'abord", "info");
            return;
        }
        setLoading(true); 
        try {
            const response = await api.get(`/api/ir/export/${annee}`, {
                responseType: 'blob', 
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const newTab = window.open(url, '_blank');

            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Configuration_IR_${annee}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setTimeout(() => window.URL.revokeObjectURL(url), 10000); 
            
            showNotification("Le PDF a été généré avec succès", "success");
        } catch (e) {
            console.error("Erreur PDF:", e);
            showNotification("Erreur lors de la génération du PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    const updateRow = (index, field, value) => {
        const newRows = [...rows];
        const numValue = parseFloat(value);
        if (numValue < 0) return; 
        if (field === 'taux' && numValue > 100) return;

        newRows[index][field] = value;
        setRows(newRows);
    };

    const addRow = () => {
        setRows([...rows, { min: '', max: '', taux: '', marie: '', enfant1: '', enfant2: '' }]);
    };

    const removeRow = (index) => {
        if (rows.length > 1) {
            setRows(rows.filter((_, i) => i !== index));
        } else {
            setRows([{ min: '', max: '', taux: '', marie: '', enfant1: '', enfant2: '' }]);
        }
    };

return (
        <div className="bg-[#FBFCFE] dark:bg-[#0a0a0a] min-h-screen font-sans text-slate-700 dark:text-gray-300 p-2 transition-colors duration-300">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 px-4">
                <div>
                    <h1 className="text-xl font-black text-[#1E293B] dark:text-white tracking-tight flex items-center gap-3">
                        Paramétrage de l'Impôt sur le Revenu (IR)
                        {annee && (
                            <>
                                <ChevronRight className="text-slate-300 dark:text-gray-700" size={24}/> 
                                <span className="text-indigo-600 dark:text-indigo-400">{annee}</span>
                            </>
                        )}
                    </h1>
                    <p className="text-slate-400 dark:text-gray-500 text-xs font-bold uppercase tracking-widest italic">
                        Configuration des tranches d'Impôt sur le Revenu
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-[#121212] p-2 rounded-[20px] shadow-sm border border-slate-100 dark:border-[#262626] focus-within:border-indigo-200 transition-all">
                    <div className="flex items-center gap-2 px-3 border-r border-slate-100 dark:border-[#262626]">
                        <Calendar size={18} className="text-indigo-500" />
                        <select value={annee || ""} onChange={(e) => setAnnee(e.target.value)}
                            className="bg-transparent font-black text-indigo-600 dark:text-indigo-400 outline-none cursor-pointer text-sm">
                            <option value="" disabled>Sélectionner</option>
                            {anneesList.map(y => (
                                <option key={y} value={y} className="dark:bg-[#121212]">{y}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="flex items-center gap-2 pl-2">
                        <input type="number" placeholder="Nouvel an..." value={newYearInput}
                            onChange={(e) => setNewYearInput(e.target.value)}
                            className="w-28 bg-slate-50 dark:bg-[#1c1c1c] dark:text-white border-none p-2 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"/>
                        <button onClick={handleAddYearDirect}
                            className="bg-indigo-600 text-white p-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 dark:shadow-none cursor-pointer">
                            <Plus size={18} strokeWidth={3}/>
                        </button>
                    </div>
                </div>
            </div>

            {!annee ? (
                <div className="bg-white dark:bg-[#121212] rounded-[32px] border-2 border-dashed border-slate-100 dark:border-[#262626] p-20 flex flex-col items-center justify-center text-center">
                    <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-full mb-6">
                        <AlertCircle size={48} className="text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Aucun exercice sélectionné</h2>
                    <p className="text-slate-400 dark:text-gray-500 text-sm max-w-xs uppercase font-bold tracking-tighter">Veuillez choisir une année ou en créer une nouvelle pour modifier le barème.</p>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-[#121212] rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 dark:border-[#262626] overflow-hidden relative mb-6">

                        {loading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 z-20 flex items-center justify-center backdrop-blur-[1px]">
                                <Loader2 className="animate-spin text-indigo-600" />
                            </div>
                        )}
                        
                        <div className="p-6 border-b border-slate-50 dark:border-[#262626] flex justify-between items-center bg-slate-50/30 dark:bg-[#1c1c1c]/30">
                            <div className="flex items-center gap-3 font-bold text-slate-800 dark:text-white text-xs uppercase tracking-widest">
                                <div className="bg-white dark:bg-[#121212] p-2 rounded-lg shadow-sm border border-slate-100 dark:border-[#262626] text-indigo-600 dark:text-indigo-400">
                                    <LayoutGrid size={16}/>
                                </div>
                                Barème des tranches IR
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleDeleteYear}
                                    className="bg-red-50 dark:bg-red-500/10 text-red-500 px-4 py-2 rounded-xl text-[11px] font-black hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 uppercase cursor-pointer">
                                    <Trash size={14}/> Supprimer 
                                </button>
                                <button onClick={addRow}
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-[11px] font-black hover:bg-indigo-700 transition-all flex items-center gap-2 uppercase shadow-lg shadow-indigo-100 dark:shadow-none cursor-pointer">
                                    <PlusCircle size={14}/> Ajouter une tranche
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto p-4">
                            <table className="w-full border-separate border-spacing-y-2">
                                <thead>
                                    <tr className="text-[10px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">
                                        <th className="px-6 py-2 text-left"> Min</th>
                                        <th className="px-6 py-2 text-left"> Max</th>
                                        <th className="px-6 py-2">Taux %</th>
                                        <th className="px-6 py-2 text-emerald-600 dark:text-emerald-400">Marié </th>
                                        <th className="px-6 py-2 text-emerald-600 dark:text-emerald-400">Enfant 1</th>
                                        <th className="px-6 py-2 text-emerald-600 dark:text-emerald-400">Enfant 2</th>
                                        <th className="px-6 py-2 text-right">Actions</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {rows.map((row, i) => (
                                        <tr key={i} className="bg-slate-50/40 dark:bg-[#1c1c1c]/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition-all rounded-2xl group">
                                            <td className="px-6 py-3 first:rounded-l-2xl">
                                                <input type="number" min="0" value={row.min} onChange={(e) => updateRow(i, 'min', e.target.value)} 
                                                    className="w-full bg-transparent font-black text-slate-700 dark:text-white outline-none" 
                                                    placeholder="0" />
                                            </td>
                                            <td className="px-6 py-3">
                                                <input type="number" value={row.max} onChange={(e) => updateRow(i, 'max', e.target.value)} 
                                                    className="w-full bg-transparent font-black text-slate-700 dark:text-white outline-none" 
                                                    placeholder="0" />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input type="number" value={row.taux} onChange={(e) => updateRow(i, 'taux', e.target.value)} 
                                                        className="w-full bg-transparent font-black text-indigo-600 dark:text-indigo-400 text-center outline-none" 
                                                        placeholder="0"/>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input 
                                                    type="number" 
                                                    value={row.marie} 
                                                    onChange={(e) => updateRow(i, 'marie', e.target.value)} 
                                                    className="w-full bg-transparent text-center font-black text-emerald-600 dark:text-emerald-400 outline-none" 
                                                    placeholder="0" />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input 
                                                    type="number" 
                                                    value={row.enfant1} 
                                                    onChange={(e) => updateRow(i, 'enfant1', e.target.value)} 
                                                    className="w-full bg-transparent text-center font-black text-emerald-600 dark:text-emerald-400 outline-none" 
                                                    placeholder="0" 
                                                />
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <input type="number" 
                                                    value={row.enfant2} 
                                                    onChange={(e) => updateRow(i, 'enfant2', e.target.value)} 
                                                    className="w-full bg-transparent text-center font-black text-emerald-600 dark:text-emerald-400 outline-none" 
                                                    placeholder="0" 
                                                />
                                            </td>

                                            <td className="px-6 py-3 text-right last:rounded-r-2xl pr-8">
                                                <button onClick={() => removeRow(i)} 
                                                    className="p-2 text-slate-300 dark:text-gray-700 hover:text-red-500 transition-colors cursor-pointer">
                                                    <Trash2 size={16}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex items-center justify-start mb-4 gap-4 px-4">
                        <button onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#262626] text-slate-600 dark:text-gray-400 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-[#1c1c1c] transition-all shadow-sm cursor-pointer uppercase tracking-tighter">
                            <Download size={18}/> Exporter PDF
                        </button>
                        <button onClick={handleSave} disabled={loading}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-sm shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 cursor-pointer uppercase tracking-widest">
                            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                            Enregistrer les modifications
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default GestionIR;