import React, { useState, useEffect } from 'react';
import { 
    Save, Trash2, Plus, X, Loader, AlertCircle, 
    Calendar, Building, Percent, TrendingUp, Shield,
    ChevronDown, ChevronUp, Edit2, Copy, Check
} from 'lucide-react';
import axiosClient from "../../lib/apis/axiosConfig";
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export default function AssuranceManagement() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
    const [loading, setLoading] = useState(false);
    const [annees, setAnnees] = useState([]);
    const [selectedAnnee, setSelectedAnnee] = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [assurancesList, setAssurancesList] = useState([]);
    const [expandedAssurance, setExpandedAssurance] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    
    // Types d'assurance disponibles
    const assuranceTypes = [
        { value: 'sociale', label: '🛡️ Sécurité Sociale', bg: 'bg-blue-100 dark:bg-blue-900/30', icon: 'Shield' },
        { value: 'sante', label: '🏥 Assurance Santé', bg: 'bg-green-100 dark:bg-green-900/30', icon: 'Plus' },
        { value: 'retraite', label: '👴 Retraite', bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'TrendingUp' }
    ];

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

    // Ajouter une assurance
    const addAssurance = () => {
        const newAssurance = {
            id: Date.now(),
            name: '',
            code: '',
            type: 'sociale',
            is_active: true,
            is_obligatoire: true,
            taux_salarie: 0,
            taux_employeur: 0,
            plafond_mensuel: null,
            plafond_annuel: null,
            description: '',
            tranches: [],
            _isNew: true
        };
        setAssurancesList([...assurancesList, newAssurance]);
        setExpandedAssurance(newAssurance.id);
        setHasUnsavedChanges(true);
        showNotification("✨ Nouvelle assurance ajoutée", "success");
    };

    // Supprimer une assurance
    const deleteAssurance = async (id, isNew) => {
        if (!isNew && window.confirm(" Supprimer cette assurance ?")) {
            setLoading(true);
            try {
                await axiosClient.delete(`/api/assurances/assurance/${id}`);
                setAssurancesList(assurancesList.filter(a => a.id !== id));
                showNotification("Assurance supprimée avec succès", "success");
            } catch (err) {
                showNotification(" Erreur lors de la suppression", "error");
            } finally {
                setLoading(false);
            }
        } else {
            setAssurancesList(assurancesList.filter(a => a.id !== id));
        }
        setHasUnsavedChanges(true);
    };

    // Ajouter une tranche
    const addTranche = (assuranceId) => {
        const newTranche = {
            id: Date.now(),
            tranche_name: '',
            min_salaire: 0,
            max_salaire: null,
            taux_salarie: 0,
            taux_employeur: 0,
            plafond: null,
            _isNew: true
        };
        
        setAssurancesList(assurancesList.map(a => {
            if (a.id === assuranceId) {
                return {
                    ...a,
                    tranches: [...(a.tranches || []), newTranche]
                };
            }
            return a;
        }));
        setHasUnsavedChanges(true);
        showNotification("📊 Nouvelle tranche ajoutée", "success");
    };

    // Supprimer une tranche
    const deleteTranche = async (assuranceId, trancheId, isNew) => {
        if (!isNew && window.confirm(" Supprimer cette tranche ?")) {
            setLoading(true);
            try {
                await axiosClient.delete(`/api/assurances/tranche/${trancheId}`);
                setAssurancesList(assurancesList.map(a => {
                    if (a.id === assuranceId) {
                        return {
                            ...a,
                            tranches: a.tranches.filter(t => t.id !== trancheId)
                        };
                    }
                    return a;
                }));
                showNotification("Tranche supprimée", "success");
            } catch (err) {
                showNotification(" Erreur lors de la suppression", "error");
            } finally {
                setLoading(false);
            }
        } else {
            setAssurancesList(assurancesList.map(a => {
                if (a.id === assuranceId) {
                    return {
                        ...a,
                        tranches: a.tranches.filter(t => t.id !== trancheId)
                    };
                }
                return a;
            }));
        }
        setHasUnsavedChanges(true);
    };

    // Mettre à jour une assurance
    const updateAssurance = (id, field, value) => {
        setAssurancesList(assurancesList.map(a => {
            if (a.id === id) {
                return { ...a, [field]: value };
            }
            return a;
        }));
        setHasUnsavedChanges(true);
    };

    // Mettre à jour une tranche
    const updateTranche = (assuranceId, trancheId, field, value) => {
        setAssurancesList(assurancesList.map(a => {
            if (a.id === assuranceId) {
                return {
                    ...a,
                    tranches: a.tranches.map(t => {
                        if (t.id === trancheId) {
                            return { ...t, [field]: value };
                        }
                        return t;
                    })
                };
            }
            return a;
        }));
        setHasUnsavedChanges(true);
    };

    // Sauvegarder
    // Sauvegarder
const handleSave = async () => {
    // Validation
    for (const assurance of assurancesList) {
        if (!assurance.name) {
            showNotification(" Toutes les assurances doivent avoir un nom", "error");
            return;
        }
        if (!assurance.code) {
            showNotification(` Code requis pour ${assurance.name}`, "error");
            return;
        }
    }

    setLoading(true);
    try {
        const submitData = {
            annee: parseInt(selectedAnnee),
            assurances: assurancesList.map(a => ({
                name: a.name,
                code: a.code,
                type: a.type,
                is_active: a.is_active,
                is_obligatoire: a.is_obligatoire,
                taux_salarie: a.taux_salarie || 0,
                taux_employeur: a.taux_employeur || 0,
                plafond_mensuel: a.plafond_mensuel || null,
                plafond_annuel: a.plafond_annuel || null,
                description: a.description || null,
                // Ajouter les tranches même si vides
                tranches: (a.tranches || []).filter(t => t.tranche_name).map(t => ({
                    tranche_name: t.tranche_name,
                    min_salaire: t.min_salaire || 0,
                    max_salaire: t.max_salaire || null,
                    taux_salarie: t.taux_salarie || 0,
                    taux_employeur: t.taux_employeur || 0,
                    plafond: t.plafond || null
                }))
            }))
        };

        console.log("Submitting data:", submitData);

        const response = await axiosClient.post('/api/assurances/store', submitData);
        console.log("Response:", response.data);
        
        showNotification(`Configuration ${selectedAnnee} enregistrée avec succès`, "success");
        setHasUnsavedChanges(false);
        fetchConfig(selectedAnnee);
    } catch (err) {
        console.error("Error details:", err.response?.data);
        showNotification(err.response?.data?.error || " Erreur lors de la sauvegarde", "error");
    } finally {
        setLoading(false);
    }
};

    const getTypeStyles = (type) => {
        const styles = {
            sociale: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: '🛡️ Sociale' },
            sante: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: '🏥 Santé' },
            retraite: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: '👴 Retraite' }
        };
        return styles[type] || styles.sociale;
    };

    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-white' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const inputClass = `p-2 rounded-lg border ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm w-full`;

    return (
        <div className={`min-h-screen p-4 transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
                            <Shield size={24} className="text-indigo-500" />
                            Paramétrage des Assurances Sociales
                        </h1>
                        <p className={`text-sm ${textMutedClass} mt-1`}>
                            Gérez les taux et barèmes par année
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cardClass}`}>
                            <Calendar size={16} className={textMutedClass} />
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
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-500/25 text-sm"
                        >
                            <Plus size={16} /> Nouvelle Assurance
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className={`${cardClass} rounded-xl p-4 border`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Total Assurances</span>
                            <Shield size={20} className="text-indigo-500" />
                        </div>
                        <p className={`text-2xl font-bold ${textClass} mt-2`}>{assurancesList.length}</p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-4 border`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Obligatoires</span>
                            <Shield size={20} className="text-red-500" />
                        </div>
                        <p className={`text-2xl font-bold ${textClass} mt-2`}>
                            {assurancesList.filter(a => a.is_obligatoire).length}
                        </p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-4 border`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Actives</span>
                            <Shield size={20} className="text-green-500" />
                        </div>
                        <p className={`text-2xl font-bold ${textClass} mt-2`}>
                            {assurancesList.filter(a => a.is_active).length}
                        </p>
                    </div>
                    <div className={`${cardClass} rounded-xl p-4 border`}>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Taux moyen Employeur</span>
                            <Percent size={20} className="text-purple-500" />
                        </div>
                        <p className={`text-2xl font-bold ${textClass} mt-2`}>
                            {assurancesList.length > 0 
                                ? (assurancesList.reduce((acc, a) => acc + (a.taux_employeur || 0), 0) / assurancesList.length).toFixed(1)
                                : 0}%
                        </p>
                    </div>
                </div>

                {/* Liste des Assurances */}
                <div className="space-y-4">
                    {loading && assurancesList.length === 0 ? (
                        <div className="text-center py-12">
                            <Loader size={32} className="animate-spin mx-auto text-indigo-500" />
                        </div>
                    ) : assurancesList.length === 0 ? (
                        <div className={`text-center py-12 border-2 border-dashed rounded-xl ${cardClass}`}>
                            <Shield size={48} className="mx-auto mb-3 opacity-30" />
                            <p className={textMutedClass}>Aucune assurance configurée pour {selectedAnnee}</p>
                            <button onClick={addAssurance} className="mt-3 text-indigo-500 text-sm">+ Ajouter</button>
                        </div>
                    ) : (
                        assurancesList.map((assurance) => {
                            const typeStyle = getTypeStyles(assurance.type);
                            const isExpanded = expandedAssurance === assurance.id;
                            
                            return (
                                <div key={assurance.id} className={`${cardClass} rounded-xl border shadow-sm overflow-hidden transition-all`}>
                                    {/* Header */}
                                    <div className={`p-4 border-b cursor-pointer ${darkMode ? 'border-[#2A2A2A]' : 'border-gray-100'} hover:bg-opacity-50 ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}
                                        onClick={() => setExpandedAssurance(isExpanded ? null : assurance.id)}>
                                        <div className="flex justify-between items-center flex-wrap gap-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className={`w-10 h-10 rounded-lg ${typeStyle.bg} flex items-center justify-center`}>
                                                    <Shield size={18} className={typeStyle.text} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="text"
                                                            value={assurance.name}
                                                            onChange={(e) => updateAssurance(assurance.id, 'name', e.target.value)}
                                                            className="font-bold bg-transparent outline-none border-b-2 border-transparent focus:border-indigo-500 text-lg"
                                                            placeholder="Nom assurance"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${typeStyle.bg} ${typeStyle.text}`}>
                                                            {typeStyle.label}
                                                        </span>
                                                        {assurance.is_obligatoire && (
                                                            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                                                                Obligatoire
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <input
                                                            type="text"
                                                            value={assurance.code}
                                                            onChange={(e) => updateAssurance(assurance.id, 'code', e.target.value)}
                                                            className="text-xs bg-transparent outline-none font-mono"
                                                            placeholder="Code"
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">Taux Employeur</div>
                                                    <div className="font-bold text-emerald-600">
                                                        {assurance.taux_employeur}%
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">Taux Salarié</div>
                                                    <div className="font-bold text-blue-600">
                                                        {assurance.taux_salarie}%
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); deleteAssurance(assurance.id, assurance._isNew); }}
                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Détails expansés */}
                                    {isExpanded && (
                                        <div className="p-4 space-y-4">
                                            {/* Taux et plafonds */}
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                <div>
                                                    <label className={`text-xs ${textMutedClass} block mb-1`}>Taux Employeur (%)</label>
                                                    <input type="number" step="0.01" value={assurance.taux_employeur || 0}
                                                        onChange={(e) => updateAssurance(assurance.id, 'taux_employeur', parseFloat(e.target.value))}
                                                        className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={`text-xs ${textMutedClass} block mb-1`}>Taux Salarié (%)</label>
                                                    <input type="number" step="0.01" value={assurance.taux_salarie || 0}
                                                        onChange={(e) => updateAssurance(assurance.id, 'taux_salarie', parseFloat(e.target.value))}
                                                        className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={`text-xs ${textMutedClass} block mb-1`}>Plafond Mensuel (MAD)</label>
                                                    <input type="number" step="1000" value={assurance.plafond_mensuel || ''}
                                                        onChange={(e) => updateAssurance(assurance.id, 'plafond_mensuel', e.target.value || null)}
                                                        className={inputClass} />
                                                </div>
                                                <div>
                                                    <label className={`text-xs ${textMutedClass} block mb-1`}>Plafond Annuel (MAD)</label>
                                                    <input type="number" step="10000" value={assurance.plafond_annuel || ''}
                                                        onChange={(e) => updateAssurance(assurance.id, 'plafond_annuel', e.target.value || null)}
                                                        className={inputClass} />
                                                </div>
                                            </div>

                                            {/* Type et options */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className={`text-xs ${textMutedClass} block mb-1`}>Type d'assurance</label>
                                                    <select value={assurance.type} onChange={(e) => updateAssurance(assurance.id, 'type', e.target.value)}
                                                        className={inputClass}>
                                                        {assuranceTypes.map(t => (
                                                            <option key={t.value} value={t.value}>{t.label}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <label className="flex items-center gap-2">
                                                        <input type="checkbox" checked={assurance.is_active}
                                                            onChange={(e) => updateAssurance(assurance.id, 'is_active', e.target.checked)}
                                                            className="rounded" />
                                                        <span className="text-sm">Active</span>
                                                    </label>
                                                    <label className="flex items-center gap-2">
                                                        <input type="checkbox" checked={assurance.is_obligatoire}
                                                            onChange={(e) => updateAssurance(assurance.id, 'is_obligatoire', e.target.checked)}
                                                            className="rounded" />
                                                        <span className="text-sm">Obligatoire</span>
                                                    </label>
                                                </div>
                                                <div>
                                                    <label className={`text-xs ${textMutedClass} block mb-1`}>Description</label>
                                                    <input type="text" value={assurance.description || ''}
                                                        onChange={(e) => updateAssurance(assurance.id, 'description', e.target.value)}
                                                        className={inputClass} placeholder="..." />
                                                </div>
                                            </div>

                                            {/* Tranches (Barème) */}
                                            <div className="border-t pt-4 dark:border-[#2A2A2A]">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className={`text-sm font-semibold ${textClass}`}>📊 Tranches / Barème</h4>
                                                    <button onClick={() => addTranche(assurance.id)}
                                                        className="text-xs text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                                                        <Plus size={12} /> Ajouter une tranche
                                                    </button>
                                                </div>
                                                
                                                {(assurance.tranches || []).length === 0 ? (
                                                    <div className={`text-center py-4 text-sm ${textMutedClass}`}>
                                                        Aucune tranche configurée
                                                    </div>
                                                ) : (
                                                    <div className="overflow-x-auto">
                                                        <table className="w-full text-sm">
                                                            <thead className={darkMode ? 'bg-[#252525]' : 'bg-gray-50'}>
                                                                <tr className={`text-left text-xs ${textMutedClass}`}>
                                                                    <th className="p-2">Tranche</th>
                                                                    <th className="p-2">Min (MAD)</th>
                                                                    <th className="p-2">Max (MAD)</th>
                                                                    <th className="p-2">Taux Employeur</th>
                                                                    <th className="p-2">Taux Salarié</th>
                                                                    <th className="p-2">Plafond</th>
                                                                    <th className="p-2 text-center">Action</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {assurance.tranches.map((tranche, idx) => (
                                                                    <tr key={tranche.id} className="border-t dark:border-[#2A2A2A]">
                                                                        <td className="p-2">
                                                                            <input type="text" value={tranche.tranche_name || `Tranche ${idx + 1}`}
                                                                                onChange={(e) => updateTranche(assurance.id, tranche.id, 'tranche_name', e.target.value)}
                                                                                className="bg-transparent outline-none border-b" />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" value={tranche.min_salaire}
                                                                                onChange={(e) => updateTranche(assurance.id, tranche.id, 'min_salaire', parseFloat(e.target.value))}
                                                                                className="w-28 bg-transparent outline-none" />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" value={tranche.max_salaire || ''}
                                                                                onChange={(e) => updateTranche(assurance.id, tranche.id, 'max_salaire', e.target.value || null)}
                                                                                className="w-28 bg-transparent outline-none" />
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" step="0.1" value={tranche.taux_employeur}
                                                                                onChange={(e) => updateTranche(assurance.id, tranche.id, 'taux_employeur', parseFloat(e.target.value))}
                                                                                className="w-20 bg-transparent outline-none" />%
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" step="0.1" value={tranche.taux_salarie}
                                                                                onChange={(e) => updateTranche(assurance.id, tranche.id, 'taux_salarie', parseFloat(e.target.value))}
                                                                                className="w-20 bg-transparent outline-none" />%
                                                                        </td>
                                                                        <td className="p-2">
                                                                            <input type="number" value={tranche.plafond || ''}
                                                                                onChange={(e) => updateTranche(assurance.id, tranche.id, 'plafond', e.target.value || null)}
                                                                                className="w-28 bg-transparent outline-none" />
                                                                        </td>
                                                                        <td className="p-2 text-center">
                                                                            <button onClick={() => deleteTranche(assurance.id, tranche.id, tranche._isNew)}
                                                                                className="text-red-500 hover:text-red-700">
                                                                                <Trash2 size={14} />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Sauvegarder */}
                {hasUnsavedChanges && (
                    <div className="fixed bottom-6 right-6 z-50">
                        <button onClick={handleSave} disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50">
                            {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                            {loading ? "Enregistrement..." : "Sauvegarder les modifications"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}