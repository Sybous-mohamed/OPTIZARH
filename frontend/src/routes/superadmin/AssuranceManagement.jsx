import React, { useState, useEffect } from 'react';
import { 
    Save, Trash2, Plus, Loader, X,
    Calendar, Percent, Shield, ChevronDown, ChevronUp, AlertCircle, CheckCircle, XCircle
} from 'lucide-react';
import axiosClient from "../../lib/apis/axiosConfig";
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';

export default function AssuranceManagement() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
    const [loading, setLoading] = useState(false);
    const [annees, setAnnees] = useState([]);
    const [selectedAnnee, setSelectedAnnee] = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [assurancesList, setAssurancesList] = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [errors, setErrors] = useState({});
    const [deleteModal, setDeleteModal] = useState({ 
        isOpen: false, 
        id: null, 
        name: '', 
        isNew: false 
    });

    // Classes CSS
    const bgClass = darkMode ? 'bg-gradient-to-br from-[#0D0D0D] to-[#1a1a1a]' : 'bg-gradient-to-br from-gray-50 to-gray-100';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] shadow-xl' : 'bg-white border-gray-200 shadow-lg';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = `p-2 rounded-lg border ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-full`;
    const inputErrorClass = `p-2 rounded-lg border-2 border-red-500 ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-red-500 text-sm w-full`;

    // Fetch années
    const fetchAnnees = async () => {
        try {
            const res = await axiosClient.get('/api/assurances/annees');
            setAnnees(res.data || []);
            if (res.data && res.data.length > 0) {
                const currentYear = new Date().getFullYear();
                const currentYearObj = res.data.find(a => a.year === currentYear);
                setSelectedAnnee(currentYearObj?.year || res.data[0].year);
                setSelectedAnneeId(currentYearObj?.id || res.data[0].id);
            }
        } catch (err) {
            console.error(err);
            showNotification("Erreur chargement des années", "error");
        }
    };

    // Fetch configuration
    const fetchConfig = async (year) => {
        if (!year) return;
        setLoading(true);
        try {
            const res = await axiosClient.get(`/api/assurances/get-by-year/${year}`);
            setAssurancesList(res.data.assurances || []);
            setSelectedAnneeId(res.data.annee_id);
            setHasUnsavedChanges(false);
            setErrors({});
        } catch (err) {
            console.error(err);
            setAssurancesList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnees();
    }, []);

    useEffect(() => {
        if (selectedAnnee) {
            fetchConfig(selectedAnnee);
        }
    }, [selectedAnnee]);

    // Validation functions
    const validateTaux = (value, fieldName) => {
        const num = parseFloat(value);
        if (isNaN(num)) return 0;
        if (num < 0) return 0;
        if (num > 100) {
            showNotification(`${fieldName} ne peut pas dépasser 100%`, "warning");
            return 100;
        }
        return num;
    };

    const validatePlafond = (value) => {
        if (value === '' || value === null) return null;
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        if (num < 0) return null;
        return num;
    };

    // Ajouter assurance
    const addAssurance = () => {
        const newAssurance = {
            id: Date.now(),
            name: '',
            code: '',
            is_active: true,
            taux_salarie: 0,
            taux_employeur: 0,
            plafond_mensuel: null,
            _isNew: true
        };
        setAssurancesList([...assurancesList, newAssurance]);
        setExpandedId(newAssurance.id);
        setHasUnsavedChanges(true);
        showNotification("✨ Nouvelle assurance ajoutée", "success");
    };

    // Delete modal handlers
    const openDeleteModal = (id, name, isNew) => {
        setDeleteModal({ isOpen: true, id, name, isNew });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, id: null, name: '', isNew: false });
    };

    const confirmDelete = async () => {
        const { id, isNew } = deleteModal;
        
        if (!isNew) {
            setLoading(true);
            try {
                await axiosClient.delete(`/api/assurances/assurance/${id}`);
                setAssurancesList(assurancesList.filter(a => a.id !== id));
                showNotification("Assurance supprimée avec succès", "success");
            } catch (err) {
                showNotification("Erreur lors de la suppression", "error");
            } finally {
                setLoading(false);
            }
        } else {
            setAssurancesList(assurancesList.filter(a => a.id !== id));
        }
        setHasUnsavedChanges(true);
        closeDeleteModal();
    };

    // Update assurance
    const updateAssurance = (id, field, value) => {
        let validatedValue = value;
        
        if (field === 'taux_employeur' || field === 'taux_salarie') {
            validatedValue = validateTaux(value, field === 'taux_employeur' ? "Taux employeur" : "Taux salarié");
        }
        
        if (field === 'plafond_mensuel') {
            validatedValue = validatePlafond(value);
        }
        
        setAssurancesList(assurancesList.map(a => {
            if (a.id === id) {
                if (errors[`${id}_${field}`]) {
                    setErrors(prev => ({ ...prev, [`${id}_${field}`]: null }));
                }
                return { ...a, [field]: validatedValue };
            }
            return a;
        }));
        setHasUnsavedChanges(true);
    };

    // Validate all before save
    const validateAllBeforeSave = () => {
        let hasError = false;
        const newErrors = {};
        
        for (const assurance of assurancesList) {
            if (!assurance.name || assurance.name.trim() === '') {
                newErrors[`${assurance.id}_name`] = "Nom requis";
                hasError = true;
            }
            if (!assurance.code || assurance.code.trim() === '') {
                newErrors[`${assurance.id}_code`] = "Code requis";
                hasError = true;
            }
            if (assurance.taux_employeur < 0 || assurance.taux_employeur > 100) {
                newErrors[`${assurance.id}_taux_employeur`] = "Taux employeur doit être entre 0% et 100%";
                hasError = true;
            }
            if (assurance.taux_salarie < 0 || assurance.taux_salarie > 100) {
                newErrors[`${assurance.id}_taux_salarie`] = "Taux salarié doit être entre 0% et 100%";
                hasError = true;
            }
            if (assurance.plafond_mensuel && assurance.plafond_mensuel < 0) {
                newErrors[`${assurance.id}_plafond_mensuel`] = "Plafond doit être positif";
                hasError = true;
            }
        }
        
        setErrors(newErrors);
        
        if (hasError) {
            showNotification("Veuillez corriger les erreurs avant de sauvegarder", "error");
            return false;
        }
        return true;
    };

    // Handle save
    const handleSave = async () => {
        if (!validateAllBeforeSave()) {
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                annee: parseInt(selectedAnnee),
                assurances: assurancesList.map(a => ({
                    name: a.name,
                    code: a.code.toUpperCase(),
                    is_active: a.is_active,
                    taux_salarie: a.taux_salarie || 0,
                    taux_employeur: a.taux_employeur || 0,
                    plafond_mensuel: a.plafond_mensuel || null
                }))
            };

            await axiosClient.post('/api/assurances/store', submitData);
            showNotification(`Configuration ${selectedAnnee} enregistrée`, "success");
            setHasUnsavedChanges(false);
            fetchConfig(selectedAnnee);
        } catch (err) {
            console.error(err);
            showNotification(err.response?.data?.error || "Erreur lors de la sauvegarde", "error");
        } finally {
            setLoading(false);
        }
    };

    // Cancel changes
    const cancelChanges = () => {
        setHasUnsavedChanges(false);
        fetchConfig(selectedAnnee);
        showNotification("Modifications annulées", "info");
    };

    const getError = (assuranceId, field) => {
        return errors[`${assuranceId}_${field}`];
    };

    return (
        <div className={`min-h-screen p-3 transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div>
                            <h1 className={`text-xl font-bold bg-gradient-to-r ${darkMode ? 'from-white to-gray-400' : 'from-gray-900 to-gray-600'} bg-clip-text text-transparent`}>
                                Assurances Sociales
                            </h1>
                            <p className={`text-xs ${textMutedClass} mt-0.5`}>Gestion des taux, plafonds et cotisations</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cardClass} shadow-sm`}>
                            <Calendar size={14} className="text-indigo-500" />
                            <select 
                                value={selectedAnnee}
                                onChange={(e) => setSelectedAnnee(e.target.value)}
                                className={`bg-transparent ${textClass} outline-none cursor-pointer font-medium text-sm`}
                            >
                                {annees.map(annee => (
                                    <option key={annee.id} value={annee.year}>{annee.year}</option>
                                ))}
                            </select>
                        </div>
                        <button 
                            onClick={addAssurance} 
                            className=" cursor-pointer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 hover:scale-105 shadow-lg"
                        >
                            <Plus size={14} /> Nouvelle assurance
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className={`${cardClass} rounded-xl p-3 border ${borderClass} hover:shadow-md transition-all duration-200`}>
                        <p className={`text-xs ${textMutedClass} flex items-center gap-1`}>
                            <Shield size={12} /> Total
                        </p>
                        <p className={`text-2xl font-bold ${textClass}`}>{assurancesList.length}</p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-3 border ${borderClass} hover:shadow-md transition-all duration-200`}>
                        <div className="flex items-center gap-1">
                            <CheckCircle size={12} className="text-emerald-500" />
                            <p className={`text-xs ${textMutedClass}`}>Actives</p>
                        </div>
                        <p className={`text-2xl font-bold text-emerald-600`}>{assurancesList.filter(a => a.is_active).length}</p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-3 border ${borderClass} hover:shadow-md transition-all duration-200`}>
                        <p className={`text-xs ${textMutedClass} flex items-center gap-1`}>
                            <Percent size={12} className="text-purple-500" /> Taux employeur
                        </p>
                        <p className={`text-2xl font-bold text-purple-600`}>
                            {assurancesList.length > 0 ? (assurancesList.reduce((acc, a) => acc + (a.taux_employeur || 0), 0) / assurancesList.length).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-3 border ${borderClass} hover:shadow-md transition-all duration-200`}>
                        <p className={`text-xs ${textMutedClass} flex items-center gap-1`}>
                            <Shield size={12} className="text-blue-500" /> Avec plafond
                        </p>
                        <p className={`text-2xl font-bold text-blue-600`}>{assurancesList.filter(a => a.plafond_mensuel).length}</p>
                    </div>
                </div>

                {/* Liste des Assurances */}
                <div className="space-y-3">
                    {loading && assurancesList.length === 0 ? (
                        <div className="flex justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <Loader size={32} className="animate-spin text-indigo-500" />
                                <p className={`text-sm ${textMutedClass}`}>Chargement...</p>
                            </div>
                        </div>
                    ) : assurancesList.length === 0 ? (
                        <div className={`text-center py-12 border-2 border-dashed rounded-xl ${cardClass}`}>
                            <Shield size={48} className="mx-auto mb-3 opacity-30" />
                            <p className={textMutedClass}>Aucune assurance configurée pour {selectedAnnee}</p>
                            <button onClick={addAssurance} className=" cursor-pointer mt-3 text-indigo-500 hover:text-indigo-600 text-sm font-medium transition-colors">
                                + Ajouter une assurance
                            </button>
                        </div>
                    ) : (
                        assurancesList.map((assurance) => {
                            const isExpanded = expandedId === assurance.id;
                            const nameError = getError(assurance.id, 'name');
                            const codeError = getError(assurance.id, 'code');
                            const tauxEmpError = getError(assurance.id, 'taux_employeur');
                            const tauxSalError = getError(assurance.id, 'taux_salarie');
                            const plafondError = getError(assurance.id, 'plafond_mensuel');
                            
                            return (
                                <div key={assurance.id} className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden transition-all duration-200 hover:shadow-lg`}>
                                    {/* Header */}
                                    <div 
                                        className={`p-4 border-b ${borderClass} cursor-pointer transition-all duration-200 ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}
                                        onClick={() => setExpandedId(isExpanded ? null : assurance.id)}
                                    >
                                        <div className="flex flex-wrap justify-between items-center gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                                <div className={`p-2 rounded-lg ${assurance.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                                    {assurance.is_active ? (
                                                        <CheckCircle size={16} className="text-emerald-600" />
                                                    ) : (
                                                        <XCircle size={16} className="text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <input 
                                                            type="text" 
                                                            value={assurance.name} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'name', e.target.value); }}
                                                            className={`font-semibold bg-transparent outline-none border-b-2 focus:border-indigo-500 text-sm w-64 ${nameError ? 'border-red-500' : 'border-transparent'} ${textClass}`}
                                                            placeholder="Nom de l'assurance"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {nameError && <span className="text-red-500 text-[10px] flex items-center gap-1"><AlertCircle size={10} /> {nameError}</span>}
                                                        {assurance._isNew && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 animate-pulse">
                                                                Nouvelle
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1">
                                                        <input 
                                                            type="text" 
                                                            value={assurance.code} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'code', e.target.value.toUpperCase()); }}
                                                            className={`text-[11px] font-mono bg-transparent outline-none border-b w-32 ${codeError ? 'border-red-500' : 'border-transparent'} ${textMutedClass}`}
                                                            placeholder="CODE"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {codeError && <span className="text-red-500 text-[9px] ml-2">{codeError}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4">
                                                {/* Taux Employeur */}
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-medium ${textMutedClass}`}>Taux employeur</p>
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number" 
                                                            step="0.1" 
                                                            min="0" 
                                                            max="100"
                                                            value={assurance.taux_employeur || 0} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'taux_employeur', parseFloat(e.target.value)); }}
                                                            className={`w-20 text-right font-semibold bg-transparent outline-none border-b-2 ${tauxEmpError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${textClass}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className={`text-xs ${textMutedClass}`}>%</span>
                                                    </div>
                                                    {tauxEmpError && <p className="text-red-500 text-[9px]">{tauxEmpError}</p>}
                                                </div>
                                                
                                                {/* Taux Salarié */}
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-medium ${textMutedClass}`}>Taux salarié</p>
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number" 
                                                            step="0.1" 
                                                            min="0" 
                                                            max="100"
                                                            value={assurance.taux_salarie || 0} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'taux_salarie', parseFloat(e.target.value)); }}
                                                            className={`w-20 text-right font-semibold bg-transparent outline-none border-b-2 ${tauxSalError ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} ${textClass}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className={`text-xs ${textMutedClass}`}>%</span>
                                                    </div>
                                                    {tauxSalError && <p className="text-red-500 text-[9px]">{tauxSalError}</p>}
                                                </div>
                                                
                                                {/* Status Switch */}
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <div className="relative">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={assurance.is_active} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'is_active', e.target.checked); }}
                                                            className="sr-only peer"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="w-10 h-5 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-indigo-600 transition-all duration-200"></div>
                                                        <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-all duration-200 peer-checked:translate-x-5"></div>
                                                    </div>
                                                    <span className={`text-[10px] ${assurance.is_active ? 'text-emerald-600' : textMutedClass}`}>
                                                        {assurance.is_active ? 'Actif' : 'Inactif'}
                                                    </span>
                                                </label>
                                                
                                                {/* Delete Button */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(assurance.id, assurance.name, assurance._isNew); }}
                                                    className=" cursor-pointer  p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                
                                                {/* Expand Icon */}
                                                <div className={`p-1 rounded-lg transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details (expanded) - Plafond */}
                                    {isExpanded && (
                                        <div className="p-4 border-t ${borderClass} bg-gradient-to-r from-indigo-50/5 to-transparent dark:from-indigo-900/5">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className={`text-[11px] font-medium ${textMutedClass} block mb-1.5 flex items-center gap-1`}>
                                                        <Shield size={12} /> Plafond mensuel (MAD)
                                                    </label>
                                                    <div >
                                                        <input 
                                                            type="number" 
                                                            step="1000" 
                                                            min="0"
                                                            value={assurance.plafond_mensuel || ''} 
                                                            onChange={(e) => updateAssurance(assurance.id, 'plafond_mensuel', e.target.value)}
                                                            className={`${plafondError ? inputErrorClass : inputClass} pl-12 text-sm py-2`} 
                                                            placeholder="Sans plafond" 
                                                        />
                                                    </div>
                                                    {plafondError && <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1"><AlertCircle size={10} /> {plafondError}</p>}
                                                    {!assurance.plafond_mensuel && (
                                                        <p className="text-[10px] text-gray-400 mt-1">Laisser vide pour aucun plafond</p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center justify-end">
                                                    <div className={`p-3 rounded-lg ${assurance.is_active ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-gray-50 dark:bg-gray-800'} border ${borderClass}`}>
                                                        <div className="text-center">
                                                            <p className={`text-xs font-medium ${textMutedClass}`}>Total cotisation</p>
                                                            <p className={`text-lg font-bold ${assurance.is_active ? 'text-emerald-600' : textMutedClass}`}>
                                                               {(Number(assurance.taux_employeur || 0) + Number(assurance.taux_salarie || 0)).toFixed(1)}%
                                                            </p>
                                                            <p className={`text-[9px] ${textMutedClass}`}>
                                                                Emp: {assurance.taux_employeur || 0}% | Sal: {assurance.taux_salarie || 0}%
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Save Button Float */}
                {hasUnsavedChanges && (
                    <div className="fixed bottom-6 right-6 z-50 flex gap-3 animate-bounce-in">
                        <button 
                            onClick={cancelChanges} 
                            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 text-sm font-medium"
                        >
                            <X size={16} />
                            Annuler
                        </button>
                        <button 
                            onClick={handleSave} 
                            disabled={loading} 
                            className=" cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 text-sm font-medium"
                        >
                            {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                            {loading ? "Enregistrement..." : "Sauvegarder"}
                        </button>
                    </div>
                )}
            </div>

            {/* DeleteConfirmModal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Supprimer l'assurance"
                message={`Êtes-vous sûr de vouloir supprimer l'assurance "${deleteModal.name}" ? Cette action est irréversible.`}
                darkMode={darkMode}
            />
        </div>
    );
}