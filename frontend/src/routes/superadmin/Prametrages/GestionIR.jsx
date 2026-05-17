import React, { useState, useEffect, useRef } from 'react';
import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';
import { 
    Trash2, Save, Loader2, Calendar, 
    PlusCircle, Download, AlertCircle, ArrowLeft, ChevronDown, Edit2, Check, X
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
    
    // États pour gérer le mode édition de chaque ligne
    const [editingRows, setEditingRows] = useState({});
    const [editedData, setEditedData] = useState({});

    // Dark mode classes
    const bgClass = darkMode ? 'bg-black' : 'bg-[#F8FAFC]';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-200';
    
    // Styles pour les boutons d'action
    const actionButtonClass = "p-1.5 rounded-md transition-all duration-200 cursor-pointer";
    const editButtonClass = `${actionButtonClass} text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/30`;
    const deleteActionButtonClass = `${actionButtonClass} text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30`;
    const saveEditButtonClass = `${actionButtonClass} text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30`;
    const cancelEditButtonClass = `${actionButtonClass} text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800`;

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
            setEditingRows({});
            setEditedData({});
        } catch (e) {
            console.error("Erreur fetchData:", e);
            setRows([{ id: Date.now(), min: 0, max: 0, taux: 0, marie: 0, enfant1: 0, enfant2: 0 }]);
            setEditingRows({});
            setEditedData({});
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
            setEditingRows({});
            setEditedData({});
        } catch (e) { 
            showNotification(" Erreur lors de la suppression", "error");
        } finally { 
            setLoading(false);
            closeDeleteModal();
        }
    };

    // ============================================================
    //                   GESTION DU MODE ÉDITION
    // ============================================================
    
    // Activer le mode édition pour une ligne
    const enableEdit = (index) => {
        const row = rows[index];
        if (row) {
            setEditedData(prev => ({
                ...prev,
                [index]: {
                    min: row.min,
                    max: row.max,
                    taux: row.taux,
                    marie: row.marie,
                    enfant1: row.enfant1,
                    enfant2: row.enfant2
                }
            }));
            setEditingRows(prev => ({ ...prev, [index]: true }));
        }
    };

    // Annuler l'édition
    const cancelEdit = (index) => {
        setEditingRows(prev => ({ ...prev, [index]: false }));
        setEditedData(prev => {
            const newData = { ...prev };
            delete newData[index];
            return newData;
        });
    };

    // Sauvegarder les modifications d'une ligne
    const saveEdit = (index) => {
        const editedRow = editedData[index];
        
        if (editedRow) {
            // Validation
            const min = parseFloat(editedRow.min || 0);
            const max = parseFloat(editedRow.max || 0);
            const taux = parseFloat(editedRow.taux || 0);
            
            if (min < 0) {
                showNotification(" Le minimum ne peut pas être négatif", "warning");
                return;
            }
            if (max < 0) {
                showNotification(" Le maximum ne peut pas être négatif", "warning");
                return;
            }
            if (taux < 0 || taux > 100) {
                showNotification(" Le taux doit être entre 0 et 100%", "warning");
                return;
            }
            
            // Vérification de la cohérence avec la ligne suivante
            if (index < rows.length - 1) {
                const nextRow = rows[index + 1];
                if (max >= nextRow.min && nextRow.min !== 0) {
                    showNotification(" Le maximum doit être inférieur au minimum de la tranche suivante", "warning");
                    return;
                }
            }
            
            // Vérification avec la ligne précédente
            if (index > 0) {
                const prevRow = rows[index - 1];
                if (min <= prevRow.max && prevRow.max !== 0) {
                    showNotification(" Le minimum doit être supérieur au maximum de la tranche précédente", "warning");
                    return;
                }
            }
            
            // Mise à jour des données
            const newRows = [...rows];
            newRows[index] = {
                ...newRows[index],
                min: editedRow.min,
                max: editedRow.max,
                taux: editedRow.taux,
                marie: editedRow.marie || 0,
                enfant1: editedRow.enfant1 || 0,
                enfant2: editedRow.enfant2 || 0
            };
            
            setRows(newRows);
            
            // Désactiver le mode édition
            setEditingRows(prev => ({ ...prev, [index]: false }));
            setEditedData(prev => {
                const newData = { ...prev };
                delete newData[index];
                return newData;
            });
            
            showNotification("✏️ Modification enregistrée localement", "success");
        }
    };

    // Mettre à jour les valeurs temporaires pendant l'édition
    const handleEditChange = (index, field, value) => {
        let numValue = value === '' ? 0 : parseFloat(value);
        if (isNaN(numValue)) numValue = 0;
        
        if (field === 'taux' && numValue > 100) {
            showNotification("⚠️ Le taux ne peut pas dépasser 100%", "warning");
            numValue = 100;
        }
        
        setEditedData(prev => ({
            ...prev,
            [index]: {
                ...prev[index],
                [field]: numValue
            }
        }));
    };

    // ============================================================
    //                        SAVE DATA
    // ============================================================
    const handleSave = async () => {
        // Vérifier s'il y a des éditions en cours
        if (Object.keys(editingRows).some(key => editingRows[key] === true)) {
            showNotification(" Veuillez sauvegarder ou annuler les modifications en cours", "warning");
            return;
        }
        
        if (!annee) return;
        
        // Validation des tranches
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const min = parseFloat(row.min || 0);
            const max = parseFloat(row.max || 0);
            
            if (min < 0) {
                showNotification(` Erreur tranche ${i + 1}: Le minimum ne peut pas être négatif`, "error");
                return;
            }
            if (max < 0) {
                showNotification(` Erreur tranche ${i + 1}: Le maximum ne peut pas être négatif`, "error");
                return;
            }
            if (i < rows.length - 1 && max <= min && max !== 0) {
                showNotification(` Erreur tranche ${i + 1}: Le maximum (${max}) doit être supérieur au minimum (${min})`, "error");
                return;
            }
        }

        setLoading(true);
        try {
            const rowsToSave = [...rows];
            const lastIndex = rowsToSave.length - 1;
            if (rowsToSave[lastIndex].max !== 0) {
                rowsToSave[lastIndex].max = 0;
            }
            
            const cleanedRows = rowsToSave.map(row => ({
                min: row.min === "" || row.min === null ? 0 : parseFloat(row.min),
                max: row.max === "" || row.max === null ? 0 : parseFloat(row.max),
                taux: row.taux === "" || row.taux === null ? 0 : parseFloat(row.taux),
                marie: row.marie === "" || row.marie === null ? 0 : parseFloat(row.marie),
                enfant1: row.enfant1 === "" || row.enfant1 === null ? 0 : parseFloat(row.enfant1),
                enfant2: row.enfant2 === "" || row.enfant2 === null ? 0 : parseFloat(row.enfant2),
            }));

            await api.post(`/api/ir/settings/${annee}`, { data_rows: cleanedRows });
            
            const updatedRows = [...rows];
            updatedRows[updatedRows.length - 1].max = 0;
            setRows(updatedRows);
            
            showNotification(` Configuration ${annee} enregistrée avec succès`, "success");
        } catch (e) { 
            const msg = e.response?.data?.message || "Erreur lors de l'enregistrement";
            showNotification(` ${msg}`, "error");
        } finally { 
            setLoading(false); 
        }
    };

    // ============================================================
    //                        EXPORT PDF
    // ============================================================
    const handleExportPDF = async () => {
        if (!annee) {
            showNotification(" Veuillez sélectionner une année", "warning");
            return;
        }
        
        if (isDataEmpty()) {
            showNotification(" Aucune donnée à exporter pour l'année " + annee + ". Veuillez d'abord configurer le barème IR.", "warning");
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
            showNotification(" PDF exporté avec succès", "success");
        } catch (e) {
            showNotification("Erreur lors de l'export PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    //                    ROWS MANAGEMENT
    // ============================================================
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
            showNotification(" Vous devez avoir au moins une tranche", "warning");
            return;
        }
        
        const newRows = rows.filter((_, i) => i !== index);
        
        if (newRows[newRows.length - 1].max !== 0) {
            newRows[newRows.length - 1].max = 0;
        }
        
        setRows(newRows);
        showNotification(" Tranche supprimée", "success");
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
    //                    RENDU D'UNE LIGNE
    // ============================================================
    const renderRow = (row, index) => {
        const isEditing = editingRows[index] || false;
        const editedRow = editedData[index];
        const isLast = isLastTrancheUnlimited(index);
        
        if (isEditing && editedRow) {
            // Mode édition
            return (
                <tr key={index} className={`border-t ${borderClass} bg-indigo-50/30 dark:bg-indigo-900/10`}>
                    <td className="p-3">
                        <input 
                            type="number" 
                            min="0"
                            value={editedRow.min === 0 ? '' : editedRow.min}
                            onChange={(e) => handleEditChange(index, 'min', e.target.value)}
                            className={`w-full p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-3">
                        <input 
                            type="number" 
                            min="0"
                            value={editedRow.max === 0 ? '' : editedRow.max}
                            onChange={(e) => handleEditChange(index, 'max', e.target.value)}
                            disabled={isLast}
                            className={`w-full p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass} ${isLast ? 'opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800' : ''}`}
                            placeholder={isLast ? "Illimité" : "0"}
                        />
                        {isLast && <span className="text-xs text-emerald-500 mt-1 block">Illimité</span>}
                    </td>
                    <td className="p-3">
                        <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={editedRow.taux === 0 ? '' : editedRow.taux}
                            onChange={(e) => handleEditChange(index, 'taux', e.target.value)}
                            className={`w-20 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-3">
                        <input 
                            type="number" 
                            min="0"
                            value={editedRow.marie === 0 ? '' : editedRow.marie}
                            onChange={(e) => handleEditChange(index, 'marie', e.target.value)}
                            className={`w-24 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-3">
                        <input 
                            type="number" 
                            min="0"
                            value={editedRow.enfant1 === 0 ? '' : editedRow.enfant1}
                            onChange={(e) => handleEditChange(index, 'enfant1', e.target.value)}
                            className={`w-24 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-3">
                        <input 
                            type="number" 
                            min="0"
                            value={editedRow.enfant2 === 0 ? '' : editedRow.enfant2}
                            onChange={(e) => handleEditChange(index, 'enfant2', e.target.value)}
                            className={`w-24 mx-auto p-2 rounded-lg text-center outline-none focus:ring-1 focus:ring-indigo-500 ${inputClass} border ${borderClass}`}
                            placeholder="0"
                        />
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                            <button 
                                onClick={() => saveEdit(index)} 
                                className={saveEditButtonClass}
                                title="Sauvegarder"
                            >
                                <Check size={16} />
                            </button>
                            <button 
                                onClick={() => cancelEdit(index)} 
                                className={cancelEditButtonClass}
                                title="Annuler"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </td>
                </tr>
            );
        }
        
        // Mode affichage normal
        return (
            <tr key={index} className={`border-t ${borderClass} hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                <td className="p-3">
                    <span className={`text-sm ${textClass}`}>{formatDisplayValue(row.min) || '0'}</span>
                </td>
                <td className="p-3">
                    <span className={`text-sm ${textClass}`}>
                        {isLast ? 'Illimité' : (formatDisplayValue(row.max) || '0')}
                    </span>
                </td>
                <td className="p-3 text-center">
                    <span className={`text-sm ${textClass}`}>{formatDisplayValue(row.taux) || '0'}%</span>
                </td>
                <td className="p-3 text-center">
                    <span className={`text-sm ${textClass}`}>{formatDisplayValue(row.marie) || '0'}</span>
                </td>
                <td className="p-3 text-center">
                    <span className={`text-sm ${textClass}`}>{formatDisplayValue(row.enfant1) || '0'}</span>
                </td>
                <td className="p-3 text-center">
                    <span className={`text-sm ${textClass}`}>{formatDisplayValue(row.enfant2) || '0'}</span>
                </td>
                <td className="p-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                        <button 
                            onClick={() => enableEdit(index)} 
                            className={editButtonClass}
                            title="Modifier"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button 
                            onClick={() => removeRow(index)}
                            disabled={rows.length === 1}
                            className={`${deleteActionButtonClass} ${rows.length === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Supprimer cette tranche"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    // ============================================================
    //                          RENDER
    // ============================================================
    return (
        <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-7xl mx-auto ">
                
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
                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annee ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                            >
                                <Trash2 size={14} /> Supprimer config
                            </button>
                            <button 
                                onClick={handleExportPDF}
                                disabled={!annee}
                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annee ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
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
                            <div className={`${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} px-6 py-4 border-b ${borderClass} flex justify-between items-center flex-wrap gap-3`}>
                                <h3 className={`font-bold ${textClass}`}>Barème IR - {annee}</h3>
                                <button 
                                    onClick={addRow}
                                    className="cursor-pointer flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all"
                                >
                                    <PlusCircle size={14} /> Ajouter tranche
                                </button>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
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
                                            rows.map((row, i) => renderRow(row, i))
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