import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, Save, X, Loader2, 
  Tag, Layers, Settings2, AlertCircle, CheckCircle, ChevronDown,
  CreditCard, DollarSign, Percent, Calendar, Eye 
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

const GestionCredit = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [credits, setCredits] = useState([]);
  const [salaryYears, setSalaryYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('types');
  
  const [editingType, setEditingType] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCredit, setEditingCredit] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [selectedCategoriesForType, setSelectedCategoriesForType] = useState([]);
  const [showAddType, setShowAddType] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  
  const [showAddCredit, setShowAddCredit] = useState(false);
  const [creditForm, setCreditForm] = useState({
    name: '',
    type_id: '',
    category_id: '',
    max_amount: '',
    interest_rate: '',
    max_duration: '',
    description: '',
    year: ''
  });
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = darkMode 
    ? 'w-full px-3 py-2 rounded-lg bg-[#252525] border border-[#333] text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
    : 'w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  
  const selectClass = darkMode 
    ? 'bg-[#252525] border-[#333] text-white' 
    : 'bg-gray-50 border-gray-200 text-gray-800';
  
  const buttonClass = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer";
  const primaryButtonClass = `${buttonClass} bg-blue-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md`;
  const successButtonClass = `${buttonClass} bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md`;
  const outlineButtonClass = `${buttonClass} border ${borderClass} ${textClass} hover:bg-gray-100 dark:hover:bg-[#252525]`;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [typesRes, categoriesRes, creditsRes, yearsRes] = await Promise.all([
        api.get('/api/credit-types'),
        api.get('/api/credit-categories'),
        api.get('/api/credits'),
        api.get('/api/salary-years')
      ]);
      setTypes(typesRes.data || []);
      setCategories(categoriesRes.data || []);
      setCredits(creditsRes.data || []);
      setSalaryYears(yearsRes.data || []);
      
      if (yearsRes.data && yearsRes.data.length > 0 && !creditForm.year) {
        const lastYear = yearsRes.data[yearsRes.data.length - 1]?.year;
        if (lastYear) {
          setCreditForm(prev => ({ ...prev, year: lastYear }));
        }
      }
    } catch (error) {
      console.error(error);
      showNotification("❌ Erreur chargement des données", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (creditForm.type_id) {
      const selectedType = types.find(t => t.id === parseInt(creditForm.type_id));
      setAvailableCategories(selectedType?.categories || []);
      if (creditForm.category_id && !selectedType?.categories?.some(c => c.id === parseInt(creditForm.category_id))) {
        setCreditForm({...creditForm, category_id: ''});
      }
    } else {
      setAvailableCategories([]);
    }
  }, [creditForm.type_id, types]);

  const addType = async () => {
    if (!newTypeName.trim()) {
      showNotification("❌ Le nom du type est requis", "error");
      return;
    }
    
    try {
      const response = await api.post('/api/credit-types', {
        name: newTypeName,
        code: newTypeCode.toUpperCase() || newTypeName.toUpperCase().replace(/\s/g, '_'),
        category_ids: selectedCategoriesForType
      });
      setTypes([...types, response.data]);
      setNewTypeName('');
      setNewTypeCode('');
      setSelectedCategoriesForType([]);
      setShowAddType(false);
      showNotification(`✅ Type "${newTypeName}" ajouté`, "success");
    } catch (error) {
      showNotification(error.response?.data?.error || "❌ Erreur", "error");
    }
  };

  const updateType = async (id, name) => {
    try {
      const response = await api.put(`/api/credit-types/${id}`, { name });
      setTypes(types.map(t => t.id === id ? response.data : t));
      setEditingType(null);
      showNotification(`✅ Type modifié`, "success");
    } catch (error) {
      showNotification("❌ Erreur", "error");
    }
  };

  const updateTypeCategories = async (id, categoryIds) => {
    try {
      const response = await api.put(`/api/credit-types/${id}`, { category_ids: categoryIds });
      setTypes(types.map(t => t.id === id ? response.data : t));
      showNotification(`✅ Catégories mises à jour`, "success");
    } catch (error) {
      showNotification("❌ Erreur", "error");
    }
  };

  const deleteType = (id, name) => {
    setDeleteModal({ isOpen: true, type: 'type', id, name });
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) {
      showNotification("❌ Le nom de la catégorie est requis", "error");
      return;
    }
    
    try {
      const response = await api.post('/api/credit-categories', {
        name: newCategoryName,
        code: newCategoryCode.toUpperCase() || newCategoryName.toUpperCase().replace(/\s/g, '_')
      });
      setCategories([...categories, response.data]);
      setNewCategoryName('');
      setNewCategoryCode('');
      setShowAddCategory(false);
      showNotification(`✅ Catégorie "${newCategoryName}" ajoutée`, "success");
    } catch (error) {
      showNotification(error.response?.data?.error || "❌ Erreur", "error");
    }
  };

  const updateCategory = async (id, name) => {
    try {
      const response = await api.put(`/api/credit-categories/${id}`, { name });
      setCategories(categories.map(c => c.id === id ? response.data : c));
      setEditingCategory(null);
      showNotification(`✅ Catégorie modifiée`, "success");
    } catch (error) {
      showNotification("❌ Erreur", "error");
    }
  };

  const deleteCategory = (id, name) => {
    setDeleteModal({ isOpen: true, type: 'category', id, name });
  };

  const addCredit = async () => {
    if (!creditForm.name || !creditForm.type_id || !creditForm.category_id || !creditForm.max_amount || !creditForm.interest_rate || !creditForm.max_duration || !creditForm.year) {
      showNotification("❌ Tous les champs sont requis", "error");
      return;
    }
    
    try {
      const response = await api.post('/api/credits', creditForm);
      setCredits([...credits, response.data]);
      setCreditForm({
        name: '',
        type_id: '',
        category_id: '',
        max_amount: '',
        interest_rate: '',
        max_duration: '',
        description: '',
        year: salaryYears.length > 0 ? salaryYears[salaryYears.length - 1]?.year : ''
      });
      setShowAddCredit(false);
      showNotification(`✅ Crédit "${creditForm.name}" ajouté`, "success");
      fetchData();
    } catch (error) {
      showNotification(error.response?.data?.error || "❌ Erreur", "error");
    }
  };

  const updateCredit = async (id, data) => {
    try {
      const response = await api.put(`/api/credits/${id}`, data);
      setCredits(credits.map(c => c.id === id ? response.data : c));
      setEditingCredit(null);
      showNotification(`✅ Crédit modifié`, "success");
    } catch (error) {
      showNotification("❌ Erreur", "error");
    }
  };

  const deleteCredit = (id, name) => {
    setDeleteModal({ isOpen: true, type: 'credit', id, name });
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'type') {
        await api.delete(`/api/credit-types/${deleteModal.id}`);
        setTypes(types.filter(t => t.id !== deleteModal.id));
      } else if (deleteModal.type === 'category') {
        await api.delete(`/api/credit-categories/${deleteModal.id}`);
        setCategories(categories.filter(c => c.id !== deleteModal.id));
      } else if (deleteModal.type === 'credit') {
        await api.delete(`/api/credits/${deleteModal.id}`);
        setCredits(credits.filter(c => c.id !== deleteModal.id));
      }
      showNotification(`✅ Supprimé`, "success");
    } catch (error) {
      showNotification(error.response?.data?.error || "❌ Erreur", "error");
    }
    setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <Loader2 className="animate-spin text-indigo-500" size={40} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 p-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header simplifié */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Settings2 size={24} className="text-indigo-500" />
            <h1 className={`text-xl font-bold ${textClass}`}>Paramétrage des Crédits</h1>
          </div>
          <p className={`text-sm ${textMutedClass} mt-1`}>
            Gérez les types, catégories et produits de crédit par année
          </p>
        </div>

        {/* Tabs compacts */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-[#2A2A2A] pb-2">
          <button
            onClick={() => setActiveTab('types')}
            className={`px-4 py-2 font-medium transition-all rounded-lg flex items-center gap-2 ${
              activeTab === 'types' 
                ? 'bg-indigo-600 text-white' 
                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525]`
            }`}
          >
            <Tag size={16} />
            Types ({types.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 font-medium transition-all rounded-lg flex items-center gap-2 ${
              activeTab === 'categories' 
                ? 'bg-indigo-600 text-white' 
                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525]`
            }`}
          >
            <Layers size={16} />
            Catégories ({categories.length})
          </button>
          <button
            onClick={() => setActiveTab('credits')}
            className={`px-4 py-2 font-medium transition-all rounded-lg flex items-center gap-2 ${
              activeTab === 'credits' 
                ? 'bg-indigo-600 text-white' 
                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525]`
            }`}
          >
            <CreditCard size={16} />
            Crédits ({credits.length})
          </button>
        </div>

        {/* ==================== TYPES TAB ==================== */}
        {activeTab === 'types' && (
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center flex-wrap gap-2`}>
              <h2 className={`font-bold ${textClass}`}>Types de crédit</h2>
              <button onClick={() => setShowAddType(true)} className={primaryButtonClass}>
                <Plus size={16} /> Nouveau type
              </button>
            </div>

            {showAddType && (
              <div className={`p-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]/50' : 'bg-gray-50'}`}>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom du type (ex: Crédit Principal)"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Code (ex: PRINCIPAL)"
                    value={newTypeCode}
                    onChange={(e) => setNewTypeCode(e.target.value.toUpperCase())}
                    className={inputClass}
                  />
                  
                  <div>
                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Catégories associées</label>
                    <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                      {categories.map(cat => {
                        const isSelected = selectedCategoriesForType.includes(cat.id);
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCategoriesForType(selectedCategoriesForType.filter(id => id !== cat.id));
                              } else {
                                setSelectedCategoriesForType([...selectedCategoriesForType, cat.id]);
                              }
                            }}
                            className={`text-xs px-2 py-1 rounded-full transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 text-white' 
                                : darkMode 
                                  ? 'bg-[#252525] text-gray-400 hover:bg-[#333]' 
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button onClick={addType} className={primaryButtonClass}>
                      <CheckCircle size={16} /> Ajouter
                    </button>
                    <button onClick={() => { setShowAddType(false); setNewTypeName(''); setNewTypeCode(''); setSelectedCategoriesForType([]); }} className={outlineButtonClass}>
                      <X size={16} /> Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y dark:divide-[#2A2A2A]">
              {types.length === 0 ? (
                <div className={`p-8 text-center ${textMutedClass}`}>Aucun type configuré</div>
              ) : (
                types.map((type) => (
                  <div key={type.id} className="p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      {editingType === type.id ? (
                        <div className="flex-1 flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={type.name}
                            className="flex-1 px-3 py-1.5 rounded-lg border dark:bg-[#252525] dark:border-[#333] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            onKeyDown={(e) => { if (e.key === 'Enter') updateType(type.id, e.target.value); }}
                            onBlur={(e) => updateType(type.id, e.target.value)}
                            autoFocus
                          />
                          <button onClick={() => setEditingType(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className={`font-medium ${textClass}`}>{type.name}</p>
                            <p className={`text-xs font-mono ${textMutedClass}`}>{type.code}</p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {type.categories?.map(cat => (
                                <span key={cat.id} className={`text-[9px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                                  {cat.name}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditingType(type.id)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg" title="Modifier">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => deleteType(type.id, type.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg" title="Supprimer">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="mt-3 pt-2 border-t">
                      <label className={`text-xs ${textMutedClass} mb-2 block`}>Catégories associées :</label>
                      <div className="flex flex-wrap gap-2">
                        {categories.map(cat => {
                          const isSelected = type.categories?.some(c => c.id === cat.id);
                          return (
                            <button
                              key={cat.id}
                              onClick={() => {
                                const currentIds = type.categories?.map(c => c.id) || [];
                                const newIds = isSelected 
                                  ? currentIds.filter(id => id !== cat.id)
                                  : [...currentIds, cat.id];
                                updateTypeCategories(type.id, newIds);
                              }}
                              className={`text-xs px-2 py-1 rounded-full transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 text-white' 
                                  : darkMode 
                                    ? 'bg-[#252525] text-gray-400 hover:bg-[#333]' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== CATEGORIES TAB ==================== */}
        {activeTab === 'categories' && (
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center flex-wrap gap-2`}>
              <h2 className={`font-bold ${textClass}`}>Catégories de crédit</h2>
              <button onClick={() => setShowAddCategory(true)} className={primaryButtonClass}>
                <Plus size={16} /> Nouvelle catégorie
              </button>
            </div>

            {showAddCategory && (
              <div className={`p-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]/50' : 'bg-gray-50'}`}>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Nom de la catégorie (ex: Immobilier)"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="text"
                    placeholder="Code (ex: IMMO)"
                    value={newCategoryCode}
                    onChange={(e) => setNewCategoryCode(e.target.value.toUpperCase())}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button onClick={addCategory} className={primaryButtonClass}>
                      <CheckCircle size={16} /> Ajouter
                    </button>
                    <button onClick={() => { setShowAddCategory(false); setNewCategoryName(''); setNewCategoryCode(''); }} className={outlineButtonClass}>
                      <X size={16} /> Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y dark:divide-[#2A2A2A]">
              {categories.length === 0 ? (
                <div className={`p-8 text-center ${textMutedClass}`}>Aucune catégorie configurée</div>
              ) : (
                categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between flex-wrap gap-2">
                    {editingCategory === cat.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          defaultValue={cat.name}
                          className="flex-1 px-3 py-1.5 rounded-lg border dark:bg-[#252525] dark:border-[#333] text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                          onKeyDown={(e) => { if (e.key === 'Enter') updateCategory(cat.id, e.target.value); }}
                          onBlur={(e) => updateCategory(cat.id, e.target.value)}
                          autoFocus
                        />
                        <button onClick={() => setEditingCategory(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className={`font-medium ${textClass}`}>{cat.name}</p>
                          <p className={`text-xs font-mono ${textMutedClass}`}>{cat.code}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {cat.types?.map(type => (
                              <span key={type.id} className={`text-[9px] px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                                {type.name}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingCategory(cat.id)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg" title="Modifier">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteCategory(cat.id, cat.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ==================== CREDITS TAB ==================== */}
        {activeTab === 'credits' && (
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`p-4 border-b ${borderClass} flex justify-between items-center flex-wrap gap-2`}>
              <h2 className={`font-bold ${textClass}`}>Produits de crédit</h2>
              <button onClick={() => setShowAddCredit(true)} className={successButtonClass}>
                <Plus size={16} /> Nouveau crédit
              </button>
            </div>

            {showAddCredit && (
              <div className={`p-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]/50' : 'bg-gray-50'}`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom du crédit"
                    value={creditForm.name}
                    onChange={(e) => setCreditForm({...creditForm, name: e.target.value})}
                    className={inputClass}
                  />
                  <select
                    value={creditForm.type_id}
                    onChange={(e) => setCreditForm({...creditForm, type_id: e.target.value, category_id: ''})}
                    className={inputClass}
                  >
                    <option value="">Sélectionner un type</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                  <select
                    value={creditForm.category_id}
                    onChange={(e) => setCreditForm({...creditForm, category_id: e.target.value})}
                    className={inputClass}
                    disabled={!creditForm.type_id}
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {availableCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Montant max (DH)"
                    value={creditForm.max_amount}
                    onChange={(e) => setCreditForm({...creditForm, max_amount: e.target.value})}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Taux d'intérêt (%)"
                    value={creditForm.interest_rate}
                    onChange={(e) => setCreditForm({...creditForm, interest_rate: e.target.value})}
                    className={inputClass}
                  />
                  <input
                    type="number"
                    placeholder="Durée max (mois)"
                    value={creditForm.max_duration}
                    onChange={(e) => setCreditForm({...creditForm, max_duration: e.target.value})}
                    className={inputClass}
                  />
                  
                  {/* Sélecteur d'année personnalisé */}
                  <div className="relative" ref={yearRef}>
                    <button 
                      onClick={() => setIsYearOpen(!isYearOpen)}
                      className={`w-full px-3 py-2 rounded-lg font-medium outline-none cursor-pointer transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
                    >
                      <span className="truncate">
                        {creditForm.year ? `📅 ${creditForm.year}` : 'Sélectionner une année'}
                      </span>
                      <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isYearOpen && (
                      <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${cardClass} z-50 max-h-60 overflow-y-auto shadow-xl`}>
                        {salaryYears.map((yearObj) => (
                          <div 
                            key={yearObj.id || yearObj.year}
                            onClick={() => {
                              setCreditForm({...creditForm, year: yearObj.year});
                              setIsYearOpen(false);
                            }}
                            className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${
                              creditForm.year === yearObj.year 
                                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' 
                                : textClass
                            }`}
                          >
                            📅 {yearObj.year}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <textarea
                    placeholder="Description (optionnelle)"
                    value={creditForm.description}
                    onChange={(e) => setCreditForm({...creditForm, description: e.target.value})}
                    className={`${inputClass} col-span-1 md:col-span-2`}
                    rows="2"
                  />
                  <div className="flex gap-2 col-span-1 md:col-span-2">
                    <button onClick={addCredit} className={successButtonClass}>
                      <CheckCircle size={16} /> Ajouter le crédit
                    </button>
                    <button onClick={() => { 
                      setShowAddCredit(false); 
                      setCreditForm({ 
                        name: '', type_id: '', category_id: '', 
                        max_amount: '', interest_rate: '', max_duration: '', 
                        description: '', 
                        year: salaryYears.length > 0 ? salaryYears[salaryYears.length - 1]?.year : '' 
                      }); 
                    }} className={outlineButtonClass}>
                      <X size={16} /> Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="divide-y dark:divide-[#2A2A2A]">
              {credits.length === 0 ? (
                <div className={`p-8 text-center ${textMutedClass}`}>Aucun crédit configuré</div>
              ) : (
                credits.map((credit) => (
                  <div key={credit.id} className="p-4">
                    {editingCredit === credit.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          defaultValue={credit.name}
                          className={inputClass}
                          onBlur={(e) => updateCredit(credit.id, { name: e.target.value })}
                          autoFocus
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold ${textClass}`}>{credit.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
                              {credit.type?.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                              {credit.category?.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                              📅 {credit.year}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              credit.status === 'Actif' 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              {credit.status}
                            </span>
                          </div>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className={textMutedClass}>
                              <DollarSign size={14} className="inline" /> {new Intl.NumberFormat('fr-MA').format(credit.max_amount)} DH
                            </span>
                            <span className={textMutedClass}>
                              <Percent size={14} className="inline" /> {credit.interest_rate}%
                            </span>
                            <span className={textMutedClass}>
                              <Calendar size={14} className="inline" /> {credit.max_duration} mois
                            </span>
                          </div>
                          {credit.description && (
                            <p className={`text-xs ${textMutedClass} mt-1`}>{credit.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingCredit(credit.id)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg" title="Modifier">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => deleteCredit(credit.id, credit.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg" title="Supprimer">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={confirmDelete}
        title={`Supprimer ${deleteModal.type === 'type' ? 'le type' : deleteModal.type === 'category' ? 'la catégorie' : 'le crédit'}`}
        message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.name}" ?`}
        darkMode={darkMode}
      />
    </div>
  );
};

export default GestionCredit;