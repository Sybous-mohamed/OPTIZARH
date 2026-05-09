import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit2, X, Loader2, 
    Tag, Search, CheckCircle, ChevronDown,
    CreditCard, Save, ArrowLeft, MoreVertical
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

const GestionCredit = () => {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
    // États
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Édition
    const [editingType, setEditingType] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });
    
    // Nouveau Type
    const [showNewTypeForm, setShowNewTypeForm] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');
    
    // Classes CSS modernisées
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = `w-full px-3 py-2.5 rounded-xl border ${borderClass} ${darkMode ? 'bg-[#252525] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-800 placeholder-gray-400'} focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`;
    
    const btnPrimary = "px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-all flex items-center gap-2 cursor-pointer font-medium shadow-md shadow-indigo-500/20";
    const btnSuccess = "px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center gap-2 cursor-pointer font-medium shadow-md shadow-emerald-500/20";
    const btnOutline = `px-4 py-2.5 rounded-xl border ${borderClass} ${textClass} hover:bg-gray-100 dark:hover:bg-[#252525] transition-all flex items-center gap-2 cursor-pointer font-medium`;
    const btnIcon = `p-2 rounded-lg transition-all cursor-pointer ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-100'}`;
    
    // Récupération des données
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/credit-types');
            setTypes(res.data || []);
        } catch (error) {
            showNotification("❌ Erreur chargement", "error");
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => { 
        fetchData(); 
    }, []);
    
    // Types CRUD
    const addType = async () => {
        if (!newTypeName.trim()) return showNotification("❌ Nom requis", "error");
        const code = newTypeName.toUpperCase().replace(/\s/g, '_');
        try {
            await api.post('/api/credit-types', { name: newTypeName, code });
            fetchData();
            setNewTypeName('');
            setShowNewTypeForm(false);
            showNotification("✅ Type ajouté", "success");
        } catch (error) { 
            showNotification("❌ Erreur", "error"); 
        }
    };
    
    const updateType = async (id, name) => {
        if (!name.trim()) return;
        try {
            await api.put(`/api/credit-types/${id}`, { name });
            fetchData();
            setEditingType(null);
            showNotification("✅ Type modifié", "success");
        } catch (error) { 
            showNotification("❌ Erreur", "error"); 
        }
    };
    
    const deleteType = (id, name) => {
        setDeleteModal({ isOpen: true, type: 'type', id, name });
    };
    
    const confirmDelete = async () => {
        try {
            await api.delete(`/api/credit-types/${deleteModal.id}`);
            fetchData();
            showNotification("✅ Type supprimé", "success");
        } catch (error) { 
            showNotification("❌ Erreur", "error"); 
        }
        setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
    };
    
    // Filtrage
    const filteredTypes = types.filter(t => 
        t.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
                <Loader2 className="animate-spin text-indigo-500" size={40} />
            </div>
        );
    }
    
    return (
        <div className={`min-h-screen ${bgClass}`}>
            <div className="max-w-7xl mx-auto ">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => window.history.back()}
                            className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#1A1A1A] hover:bg-[#252525] border border-[#2A2A2A]' : 'bg-white hover:bg-gray-50 border border-gray-200'} shadow-sm`}
                            title="Retour"
                        >
                            <ArrowLeft size={20} className={textClass} />
                        </button>
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-bold ${textClass}`}>Types de Crédit</h1>
                            <p className={`text-sm ${textMuted} mt-0.5`}>
                                Gérez les types de crédit pour les employés
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setShowNewTypeForm(true)} className={btnPrimary}>
                        <Plus size={16} /> Nouveau type
                    </button>
                </div>

                {/* Search Bar */}
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Rechercher un type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${inputClass}`}
                        />
                    </div>
                </div>

                {/* Formulaire d'ajout */}
                {showNewTypeForm && (
                    <div className={`${cardClass} rounded-xl border ${borderClass} shadow-sm overflow-hidden mb-6 animate-fadeIn`}>
                        <div className={`px-5 py-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                            <div className="flex items-center gap-2">
                                <Plus size={16} className="text-emerald-500" />
                                <h2 className={`font-semibold ${textClass}`}>Ajouter un type de crédit</h2>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="mb-4">
                                <label className={`text-sm font-medium ${textMuted} mb-1.5 block`}>
                                    Nom du type <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: Crédit Standard, Crédit Premium..." 
                                    value={newTypeName} 
                                    onChange={e => setNewTypeName(e.target.value)} 
                                    className={inputClass}
                                    onKeyPress={(e) => e.key === 'Enter' && addType()}
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={addType} className={btnSuccess}>
                                    <CheckCircle size={16} /> Enregistrer
                                </button>
                                <button onClick={() => { 
                                    setShowNewTypeForm(false); 
                                    setNewTypeName(''); 
                                }} className={btnOutline}>
                                    <X size={16} /> Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Liste des types */}
                <div className={`${cardClass} rounded-xl border ${borderClass} shadow-sm overflow-hidden`}>
                    <div className={`px-5 py-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tag size={16} className="text-indigo-500" />
                                <h2 className={`font-semibold ${textClass}`}>Liste des types</h2>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-200 text-gray-600'}`}>
                                {filteredTypes.length} type(s)
                            </span>
                        </div>
                    </div>
                    
                    <div className="divide-y dark:divide-[#2A2A2A]">
                        {filteredTypes.length === 0 ? (
                            <div className="py-12 text-center">
                                <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'} flex items-center justify-center`}>
                                    <Tag size={32} className={`opacity-40 ${textMuted}`} />
                                </div>
                                <p className={textMuted}>Aucun type de crédit trouvé</p>
                                <button onClick={() => setShowNewTypeForm(true)} className={`mt-3 text-sm text-indigo-500 hover:text-indigo-600 font-medium ${textClass}`}>
                                    + Ajouter un type
                                </button>
                            </div>
                        ) : (
                            filteredTypes.map((type) => (
                                <div key={type.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-[#252525]/50 transition-colors group">
                                    <div className="flex items-center justify-between">
                                        {editingType === type.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    defaultValue={type.name}
                                                    className="flex-1 px-3 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    onBlur={(e) => updateType(type.id, e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && updateType(type.id, e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => setEditingType(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-medium ${textClass}`}>{type.name}</p>
                                                        {type.code && (
                                                            <code className={`text-[10px] px-1.5 py-0.5 rounded ${darkMode ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                                                                {type.code}
                                                            </code>
                                                        )}
                                                    </div>
                                                    <p className={`text-xs ${textMuted} mt-0.5`}>
                                                        ID: {type.id}
                                                    </p>
                                                </div>
                                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setEditingType(type.id)} 
                                                        className={`${btnIcon} text-gray-400 hover:text-indigo-500`} 
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteType(type.id, type.name)} 
                                                        className={`${btnIcon} text-gray-400 hover:text-rose-500`} 
                                                        title="Supprimer"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
            
            {/* Modale de confirmation */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
                onConfirm={confirmDelete}
                title="Confirmation de suppression"
                message={`Êtes-vous sûr de vouloir supprimer le type "${deleteModal.name}" ?`}
                darkMode={darkMode}
            />
        </div>
    );
};

export default GestionCredit;