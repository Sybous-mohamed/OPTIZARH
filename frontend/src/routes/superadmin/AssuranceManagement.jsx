import React, { useState, useEffect } from 'react';
import { 
    Save, Trash2, Plus, Loader, 
    Calendar, Percent, Shield, ChevronDown, ChevronUp, AlertCircle
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

    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-white' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const inputClass = `p-2 rounded-lg border ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-full`;
    const inputErrorClass = `p-2 rounded-lg border-2 border-red-500 ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-red-500 text-sm w-full`;

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

    const updateAssurance = (id, field, value) => {
        let validatedValue = value;
        
        // Validation selon le champ
        if (field === 'taux_employeur' || field === 'taux_salarie') {
            validatedValue = validateTaux(value, field === 'taux_employeur' ? "Taux employeur" : "Taux salarié");
        }
        
        if (field === 'plafond_mensuel') {
            validatedValue = validatePlafond(value);
        }
        
        setAssurancesList(assurancesList.map(a => {
            if (a.id === id) {
                // Clear error for this field if exists
                if (errors[`${id}_${field}`]) {
                    setErrors(prev => ({ ...prev, [`${id}_${field}`]: null }));
                }
                return { ...a, [field]: validatedValue };
            }
            return a;
        }));
        setHasUnsavedChanges(true);
    };

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

    // Helper pour afficher les erreurs
    const getError = (assuranceId, field) => {
        return errors[`${assuranceId}_${field}`];
    };

    return (
        <div className={`min-h-screen p-4 transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className={`text-xl font-bold ${textClass} flex items-center gap-2`}>
                            <Shield size={22} className="text-indigo-500" />
                            Assurances Sociales
                        </h1>
                        <p className={`text-xs ${textMutedClass} mt-0.5`}>Gestion des taux et plafonds</p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cardClass}`}>
                            <Calendar size={14} className={textMutedClass} />
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
                        <button onClick={addAssurance} className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm">
                            <Plus size={14} /> Nouvelle
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <div className={`${cardClass} rounded-lg p-3 border`}>
                        <p className={`text-xs ${textMutedClass}`}>Total</p>
                        <p className={`text-xl font-bold ${textClass}`}>{assurancesList.length}</p>
                    </div>
                    <div className={`${cardClass} rounded-lg p-3 border`}>
                        <p className={`text-xs ${textMutedClass}`}>Actives</p>
                        <p className={`text-xl font-bold text-emerald-600`}>{assurancesList.filter(a => a.is_active).length}</p>
                    </div>
                    <div className={`${cardClass} rounded-lg p-3 border`}>
                        <p className={`text-xs ${textMutedClass}`}>Taux employeur</p>
                        <p className={`text-xl font-bold text-purple-600`}>
                            {assurancesList.length > 0 ? (assurancesList.reduce((acc, a) => acc + (a.taux_employeur || 0), 0) / assurancesList.length).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className={`${cardClass} rounded-lg p-3 border`}>
                        <p className={`text-xs ${textMutedClass}`}>Avec plafond</p>
                        <p className={`text-xl font-bold text-blue-600`}>{assurancesList.filter(a => a.plafond_mensuel).length}</p>
                    </div>
                </div>

                {/* Liste des Assurances */}
                <div className="space-y-3">
                    {loading && assurancesList.length === 0 ? (
                        <div className="text-center py-12"><Loader size={32} className="animate-spin mx-auto text-indigo-500" /></div>
                    ) : assurancesList.length === 0 ? (
                        <div className={`text-center py-12 border-2 border-dashed rounded-xl ${cardClass}`}>
                            <Shield size={40} className="mx-auto mb-3 opacity-30" />
                            <p className={textMutedClass}>Aucune assurance configurée pour {selectedAnnee}</p>
                            <button onClick={addAssurance} className="mt-2 text-indigo-500 text-sm">+ Ajouter</button>
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
                                <div key={assurance.id} className={`${cardClass} rounded-lg border ${cardClass} overflow-hidden`}>
                                    {/* Header */}
                                    <div 
                                        className={`p-3 border-b ${darkMode ? 'border-[#2A2A2A]' : 'border-gray-100'} cursor-pointer hover:bg-opacity-50 ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}
                                        onClick={() => setExpandedId(isExpanded ? null : assurance.id)}
                                    >
                                        <div className="flex flex-wrap justify-between items-center gap-3">
                                            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                    <Shield size={14} className="text-indigo-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <div className="flex-1">
                                                            <input 
                                                                type="text" 
                                                                value={assurance.name} 
                                                                onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'name', e.target.value); }}
                                                                className={`font-semibold bg-transparent outline-none border-b focus:border-indigo-500 text-sm w-full ${nameError ? 'border-red-500' : 'border-transparent'}`}
                                                                placeholder="Nom assurance"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                            {nameError && <p className="text-red-500 text-[9px] mt-0.5 flex items-center gap-1"><AlertCircle size={8} /> {nameError}</p>}
                                                        </div>
                                                        {!assurance.is_active && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500">Inactif</span>
                                                        )}
                                                    </div>
                                                    <div className="mt-1">
                                                        <input 
                                                            type="text" 
                                                            value={assurance.code} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'code', e.target.value.toUpperCase()); }}
                                                            className={`text-[10px] bg-transparent outline-none font-mono w-24 ${codeError ? 'border-red-500 border' : 'border-transparent border'}`}
                                                            placeholder="CODE"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        {codeError && <p className="text-red-500 text-[9px] flex items-center gap-1"><AlertCircle size={8} /> {codeError}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500">Taux emp.</p>
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            min="0" 
                                                            max="100"
                                                            value={assurance.taux_employeur || 0} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'taux_employeur', parseFloat(e.target.value)); }}
                                                            className={`w-16 text-right font-semibold bg-transparent outline-none border-b ${tauxEmpError ? 'border-red-500' : 'border-gray-300'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="text-xs">%</span>
                                                    </div>
                                                    {tauxEmpError && <p className="text-red-500 text-[9px]">{tauxEmpError}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-500">Taux sal.</p>
                                                    <div className="flex items-center gap-1">
                                                        <input 
                                                            type="number" 
                                                            step="0.01" 
                                                            min="0" 
                                                            max="100"
                                                            value={assurance.taux_salarie || 0} 
                                                            onChange={(e) => { e.stopPropagation(); updateAssurance(assurance.id, 'taux_salarie', parseFloat(e.target.value)); }}
                                                            className={`w-16 text-right font-semibold bg-transparent outline-none border-b ${tauxSalError ? 'border-red-500' : 'border-gray-300'}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className="text-xs">%</span>
                                                    </div>
                                                    {tauxSalError && <p className="text-red-500 text-[9px]">{tauxSalError}</p>}
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); openDeleteModal(assurance.id, assurance.name, assurance._isNew); }}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details (expanded) */}
                                    {isExpanded && (
                                        <div className="p-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={`text-[10px] ${textMutedClass} block mb-0.5`}>Plafond mensuel (MAD)</label>
                                                    <input 
                                                        type="number" 
                                                        step="1000" 
                                                        min="0"
                                                        value={assurance.plafond_mensuel || ''} 
                                                        onChange={(e) => updateAssurance(assurance.id, 'plafond_mensuel', e.target.value)}
                                                        className={`${plafondError ? inputErrorClass : inputClass} text-sm py-1.5`} 
                                                        placeholder="Sans plafond" 
                                                    />
                                                    {plafondError && <p className="text-red-500 text-[9px] mt-1 flex items-center gap-1"><AlertCircle size={8} /> {plafondError}</p>}
                                                </div>
                                                <div className="flex items-center pt-5">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={assurance.is_active} 
                                                            onChange={(e) => updateAssurance(assurance.id, 'is_active', e.target.checked)}
                                                            className="rounded" 
                                                        />
                                                        <span className="text-xs">Assurance active</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Save Button */}
                {hasUnsavedChanges && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm">
                            {loading ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
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
                message={`Êtes-vous sûr de vouloir supprimer l'assurance "${deleteModal.name}" ?`}
                darkMode={darkMode}
            />
        </div>
    );
}