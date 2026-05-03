import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';
import { 
    Trash2, Save, Loader2, Calendar, 
    PlusCircle, Download, AlertCircle, ArrowLeft, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';

const GestionIR = () => {
    const { showNotification } = useNotification();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    
    // States
    const [annee, setAnnee] = useState(null); 
    const [anneesList, setAnneesList] = useState([]);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, annee: null });
    const yearRef = useRef(null);

    // Dark mode classes
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-200';

    // ============================================================
    //                     CLICK OUTSIDE
    // ============================================================
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearRef.current && !yearRef.current.contains(event.target)) {
                setIsYearOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================================
    //                     FETCH DATA
    // ============================================================
    const fetchAnnees = async () => {
        try {
            const res = await api.get('/api/ir/annees-for-settings');
            const data = res.data || [];
            setAnneesList(data);
            const savedYear = localStorage.getItem('ir_selected_year');
            if (savedYear && data.includes(parseInt(savedYear))) {
                setAnnee(parseInt(savedYear));
            } else if (data.length > 0) {
                setAnnee(data[data.length - 1]);
            }
        } catch (e) { 
            console.error("Erreur fetchAnnees:", e); 
        }
    };

    const fetchData = async (year) => {
        if (!year) return;
        setLoading(true);
        try {
            const res = await api.get(`/api/ir/settings-for-edit/${year}`);
            if (res.data.data_rows && res.data.data_rows.length > 0) {
                const rowsWithIds = res.data.data_rows.map((row, idx) => ({
                    ...row,
                    id: row.id || `temp_${idx}_${Date.now()}`
                }));
                setRows(rowsWithIds);
            } else {
                setRows([{ id: Date.now(), min: 0, max: 0, taux: 0, marie: 0, enfant1: 0, enfant2: 0 }]);
            }
        } catch (e) {
            console.error("Erreur fetchData:", e);
            setRows([{ id: Date.now(), min: 0, max: 0, taux: 0, marie: 0, enfant1: 0, enfant2: 0 }]);
        } finally { 
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchAnnees();
    }, []);

    useEffect(() => {
        if (annee) {
            fetchData(annee);
            localStorage.setItem('ir_selected_year', annee);
        }
    }, [annee]);

    // ============================================================
    //                   CHECK IF DATA IS EMPTY
    // ============================================================
    const isDataEmpty = () => {
        if (!rows.length) return true;
        return rows.every(row => 
            (row.min === 0 || row.min === '' || row.min === null) &&
            (row.max === 0 || row.max === '' || row.max === null) &&
            (row.taux === 0 || row.taux === '' || row.taux === null) &&
            (row.marie === 0 || row.marie === '' || row.marie === null) &&
            (row.enfant1 === 0 || row.enfant1 === '' || row.enfant1 === null) &&
            (row.enfant2 === 0 || row.enfant2 === '' || row.enfant2 === null)
        );
    };

    // ============================================================
    //                   DELETE CONFIGURATION (MODAL)
    // ============================================================
    const openDeleteModal = () => {
        if (!annee) return;
        setDeleteModal({ isOpen: true, annee: annee });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, annee: null });
    };

    const confirmDelete = async () => {
        const yearToDelete = deleteModal.annee;
        setLoading(true);
        try {
            await api.delete(`/api/ir/settings/${yearToDelete}`);
            showNotification(`Configuration IR de l'année ${yearToDelete} supprimée`, "success");
            setRows([{ id: Date.now(), min: 0, max: 0, taux: 0, marie: 0, enfant1: 0, enfant2: 0 }]);
            const res = await api.get('/api/ir/annees-for-settings');
            setAnneesList(res.data || []);
        } catch (e) { 
            showNotification("❌ Erreur lors de la suppression", "error");
        } finally { 
            setLoading(false);
            closeDeleteModal();
        }
    };

    // ============================================================
    //                        SAVE DATA (CORRIGÉ)
    // ============================================================
    const handleSave = async () => {
        if (!annee) return;
        
        // Validation des tranches
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const min = parseFloat(row.min || 0);
            const max = parseFloat(row.max || 0);
            
            if (min < 0) {
                showNotification(`❌ Erreur tranche ${i + 1}: Le minimum ne peut pas être négatif`, "error");
                return;
            }
            if (max < 0) {
                showNotification(`❌ Erreur tranche ${i + 1}: Le maximum ne peut pas être négatif`, "error");
                return;
            }
            // Pour toutes les tranches sauf la dernière, max doit être > min
            if (i < rows.length - 1 && max <= min) {
                showNotification(`❌ Erreur tranche ${i + 1}: Le maximum (${max}) doit être supérieur au minimum (${min})`, "error");
                return;
            }
        }
        
        // Cohérence entre tranches
        for (let i = 0; i < rows.length - 1; i++) {
            const currentMax = parseFloat(rows[i].max || 0);
            const nextMin = parseFloat(rows[i + 1].min || 0);
            if (currentMax !== nextMin) {
                showNotification(`❌ Erreur: La tranche ${i + 1} max (${currentMax}) doit être égale à la tranche ${i + 2} min (${nextMin})`, "error");
                return;
            }
        }

        setLoading(true);
        try {
            // ✅ CRUCIAL: Transformer la dernière tranche en illimitée (max = 0)
            const rowsToSave = [...rows];
            const lastIndex = rowsToSave.length - 1;
            rowsToSave[lastIndex].max = 0;
            
            const cleanedRows = rowsToSave.map(row => ({
                min: row.min === "" || row.min === null ? 0 : parseFloat(row.min),
                max: row.max === "" || row.max === null ? 0 : parseFloat(row.max),
                taux: row.taux === "" || row.taux === null ? 0 : parseFloat(row.taux),
                marie: row.marie === "" || row.marie === null ? 0 : parseFloat(row.marie),
                enfant1: row.enfant1 === "" || row.enfant1 === null ? 0 : parseFloat(row.enfant1),
                enfant2: row.enfant2 === "" || row.enfant2 === null ? 0 : parseFloat(row.enfant2),
            }));

            await api.post(`/api/ir/settings/${annee}`, { data_rows: cleanedRows });
            
            // ✅ Mettre à jour l'affichage local
            const updatedRows = [...rows];
            updatedRows[updatedRows.length - 1].max = 0;
            setRows(updatedRows);
            
            showNotification(`✅ Configuration ${annee} enregistrée avec succès`, "success");
        } catch (e) { 
            const msg = e.response?.data?.message || "Erreur lors de l'enregistrement";
            showNotification(`❌ ${msg}`, "error");
        } finally { 
            setLoading(false); 
        }
    };

    // ============================================================
    //                        EXPORT PDF
    // ============================================================
    const handleExportPDF = async () => {
        if (!annee) {
            showNotification("⚠️ Veuillez sélectionner une année", "warning");
            return;
        }
        
        if (isDataEmpty()) {
            showNotification("⚠️ Aucune donnée à exporter pour l'année " + annee + ". Veuillez d'abord configurer le barème IR.", "warning");
            return;
        }
        
        setLoading(true); 
        try {
            const response = await api.get(`/api/ir/export/${annee}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bareme_IR_${annee}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showNotification("📄 PDF exporté avec succès", "success");
        } catch (e) {
            showNotification("❌ Erreur lors de l'export PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    //                    ROWS MANAGEMENT (CORRIGÉ)
    // ============================================================
    const updateRow = (index, field, value) => {
        const newRows = [...rows];
        let numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        if (numValue < 0) {
            showNotification(" Les valeurs négatives ne sont pas autorisées", "error");
            return;
        }
        if (field === 'taux' && numValue > 100) {
            showNotification(" Le taux ne peut pas dépasser 100%", "error");
            numValue = 100;
        }
        
        newRows[index][field] = numValue;
    
        if (field === 'max' && index < newRows.length - 1) {
            if (newRows[index + 1]) {
                newRows[index + 1].min = numValue + 1;
            }
        }

        if (field === 'min' && index > 0) {
            if (newRows[index - 1]) {
                newRows[index - 1].max = numValue - 1; 
            }
        }
        
        setRows(newRows);
    };

    const addRow = () => {
        const lastRow = rows[rows.length - 1];
        const newMin = lastRow.max === 0 ? (lastRow.min + 10000) : lastRow.max;
        setRows([...rows, { 
            id: Date.now(), 
            min: newMin, 
            max: 0, 
            taux: 0, 
            marie: 0, 
            enfant1: 0, 
            enfant2: 0 
        }]);
        showNotification("➕ Nouvelle tranche ajoutée", "success");
    };

    const removeRow = async (index) => {
        if (rows.length === 1) {
            showNotification("⚠️ Vous devez avoir au moins une tranche", "warning");
            return;
        }
        
        // Si on supprime la dernière tranche
        if (index === rows.length - 1) {
            const newRows = rows.filter((_, i) => i !== index);
            // Mettre max = 0 sur la nouvelle dernière tranche
            newRows[newRows.length - 1].max = 0;
            setRows(newRows);
            showNotification("🗑️ Tranche supprimée avec succès", "success");
            return;
        }
        
        const rowToDelete = rows[index];
        const rowId = rowToDelete.id;
        const isRealId = rowId && typeof rowId === 'number' && !rowId.toString().startsWith('temp_');
        
        if (isRealId) {
            setLoading(true);
            try {
                let newRows = rows.filter((_, i) => i !== index);
                
                // Ajuster les min/max après suppression
                if (index > 0 && index < newRows.length) {
                    newRows[index].min = newRows[index - 1].max;
                }
                
                const cleanedRows = newRows.map(row => ({
                    min: row.min === "" || row.min === null ? 0 : parseFloat(row.min),
                    max: row.max === "" || row.max === null ? 0 : parseFloat(row.max),
                    taux: row.taux === "" || row.taux === null ? 0 : parseFloat(row.taux),
                    marie: row.marie === "" || row.marie === null ? 0 : parseFloat(row.marie),
                    enfant1: row.enfant1 === "" || row.enfant1 === null ? 0 : parseFloat(row.enfant1),
                    enfant2: row.enfant2 === "" || row.enfant2 === null ? 0 : parseFloat(row.enfant2),
                }));
                
                await api.post(`/api/ir/settings/${annee}`, { data_rows: cleanedRows });
                setRows(newRows);
                showNotification("🗑️ Tranche supprimée avec succès", "success");
            } catch (e) {
                showNotification("❌ Erreur lors de la suppression", "error");
            } finally {
                setLoading(false);
            }
        } else {
            let newRows = rows.filter((_, i) => i !== index);
            if (index > 0 && index < newRows.length) {
                newRows[index].min = newRows[index - 1].max;
            }
            if (newRows[newRows.length - 1].max !== 0) {
                newRows[newRows.length - 1].max = 0;
            }
            setRows(newRows);
            showNotification("🗑️ Tranche supprimée localement", "success");
        }
    };

    const formatDisplayValue = (value) => {
        if (value === 0 || value === '' || value === null) {
            return '';
        }
        return value;
    };
    
    const isLastTrancheUnlimited = (index) => {
        return index === rows.length - 1 && rows[index]?.max === 0;
    };

    // ============================================================
    //                          RENDER
    // ============================================================
    return (
        <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
            <div className=" max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                        <button 
                            onClick={() => navigate(-1)}
                            className={`cursor-pointer p-2 rounded-xl transition-all ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-50'} border shadow-sm`}
                        >
                            <ArrowLeft size={18} className={textClass} />
                        </button>
                        <div>
                            <h1 className={`text-2xl font-bold ${textClass}`}>Impôt sur le Revenu (IR)</h1>
                            <p className={`text-sm ${textMutedClass}`}>Configuration des tranches et barèmes</p>
                        </div>
                    </div>
                </div>

                {/* Année Selector */}
                <div className={`${cardClass} rounded-xl border ${borderClass} p-4 mb-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative" ref={yearRef}>
                                <button 
                                    onClick={() => setIsYearOpen(!isYearOpen)}
                                    className={`cursor-pointer h-9 px-4 rounded-lg font-medium outline-none min-w-[120px] transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-2 hover:border-indigo-400`}
                                >
                                    <span className="truncate">{annee || 'Sélectionner année'}</span>
                                    <ChevronDown size={14} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isYearOpen && (
                                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-y-auto shadow-lg`}>
                                        {anneesList.map(y => (
                                            <div 
                                                key={y}
                                                onClick={() => {
                                                    setAnnee(y);
                                                    setIsYearOpen(false);
                                                }}
                                                className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${annee === y ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : textClass}`}
                                            >
                                                {y}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={openDeleteModal}
                                disabled={!annee}
                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annee ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-red-500 hover:bg-red-600 text-white'}`}
                            >
                                <Trash2 size={14} /> Supprimer config
                            </button>
                            <button 
                                onClick={handleExportPDF}
                                disabled={!annee}
                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annee ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-500 hover:bg-emerald-600 text-white'}`}
                            >
                                <Download size={14} /> Export PDF
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tableau des tranches */}
                {!annee ? (
                    <div className={`${cardClass} rounded-xl border ${borderClass} p-12 text-center`}>
                        <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className={`text-lg font-medium ${textClass}`}>Aucune année sélectionnée</p>
                        <p className={`text-sm ${textMutedClass} mt-1`}>Sélectionnez une année pour configurer le barème IR</p>
                    </div>
                ) : (
                    <>
                        <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
                            <div className={`${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} px-6 py-4 border-b ${borderClass} flex justify-between items-center`}>
                                <h3 className={`font-bold ${textClass}`}>Barème IR - {annee}</h3>
                                <button 
                                    onClick={addRow}
                                    className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                                >
                                    <PlusCircle size={14} /> Ajouter tranche
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead className={`${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                                        <tr className={`text-xs font-bold uppercase tracking-wider ${textMutedClass}`}>
                                            <th className="p-3 text-left">Min (MAD)</th>
                                            <th className="p-3 text-left">Max (MAD)</th>
                                            <th className="p-3 text-center">Taux (%)</th>
                                            <th className="p-3 text-center">Marié (MAD)</th>
                                            <th className="p-3 text-center">Enfant 1 (MAD)</th>
                                            <th className="p-3 text-center">Enfant 2 (MAD)</th>
                                            <th className="p-3 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="p-8 text-center">
                                                    <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                                                    <p className={`mt-2 ${textMutedClass}`}>Chargement...</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            rows.map((row, i) => (
                                                <tr key={i} className={`border-t ${borderClass} hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={formatDisplayValue(row.min)}
                                                            onChange={(e) => updateRow(i, 'min', e.target.value)}
                                                            className={`w-full p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={formatDisplayValue(row.max)}
                                                            onChange={(e) => updateRow(i, 'max', e.target.value)}
                                                            disabled={isLastTrancheUnlimited(i)}
                                                            className={`w-full p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass} ${isLastTrancheUnlimited(i) ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                                                            placeholder={isLastTrancheUnlimited(i) ? "Illimité" : "0"}
                                                        />
                                                        {isLastTrancheUnlimited(i) && (
                                                            <span className="text-xs text-emerald-500 mt-1 block">Illimité</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            max="100"
                                                            value={formatDisplayValue(row.taux)}
                                                            onChange={(e) => updateRow(i, 'taux', e.target.value)}
                                                            className={`w-20 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={formatDisplayValue(row.marie)}
                                                            onChange={(e) => updateRow(i, 'marie', e.target.value)}
                                                            className={`w-24 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={formatDisplayValue(row.enfant1)}
                                                            onChange={(e) => updateRow(i, 'enfant1', e.target.value)}
                                                            className={`w-24 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            value={formatDisplayValue(row.enfant2)}
                                                            onChange={(e) => updateRow(i, 'enfant2', e.target.value)}
                                                            className={`w-24 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button 
                                                            onClick={() => removeRow(i)}
                                                            disabled={rows.length === 1}
                                                            className={`cursor-pointer p-2 rounded-lg transition-all ${rows.length === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'}`}
                                                            title="Supprimer cette tranche"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Bouton Sauvegarde */}
                        <div className="mt-6 flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={loading}
                                className="cursor-pointer flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 shadow-lg"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin"/> : <Save size={18} />}
                                {loading ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* DeleteConfirmModal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Supprimer la configuration"
                message={`Êtes-vous sûr de vouloir supprimer toute la configuration IR pour l'année ${deleteModal.annee} ? Cette action est irréversible.`}
                darkMode={darkMode}
            />
        </div>
    );
};

export default GestionIR;