import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, Loader2, 
  Tag, Layers, CreditCard, Search, 
  CheckCircle, ChevronDown, Banknote, Percent, Clock,
  Save, ArrowLeft
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
  const [categories, setCategories] = useState([]);
  const [credits, setCredits] = useState([]);
  const [salaryYears, setSalaryYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Édition
  const [editingType, setEditingType] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingCredit, setEditingCredit] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });
  
  // Formulaire d'édition crédit
  const [editCreditForm, setEditCreditForm] = useState({
    id: null,
    name: '', type_id: '', type_name: '', category_id: '', category_name: '',
    max_amount: '', interest_rate: '', max_duration: '', description: '', year: ''
  });
  const [editAvailableCategories, setEditAvailableCategories] = useState([]);
  const [isEditYearOpen, setIsEditYearOpen] = useState(false);
  const [isEditTypeOpen, setIsEditTypeOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const editYearRef = useRef(null);
  const editTypeRef = useRef(null);
  const editCategoryRef = useRef(null);
  
  // Nouveau Type
  const [showNewTypeForm, setShowNewTypeForm] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeCode, setNewTypeCode] = useState('');
  const [selectedCategoriesForType, setSelectedCategoriesForType] = useState([]);
  
  // Nouvelle Catégorie
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryCode, setNewCategoryCode] = useState('');
  
  // Nouveau Crédit
  const [showNewCreditForm, setShowNewCreditForm] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const yearRef = useRef(null);
  const typeRef = useRef(null);
  const categoryRef = useRef(null);
  
  const [creditForm, setCreditForm] = useState({
    name: '', type_id: '', type_name: '', category_id: '', category_name: '',
    max_amount: '', interest_rate: '', max_duration: '', description: '', year: ''
  });

  // Fermeture dropdowns
  useEffect(() => {
    const handler = (e) => {
      if (yearRef.current && !yearRef.current.contains(e.target)) setIsYearOpen(false);
      if (typeRef.current && !typeRef.current.contains(e.target)) setIsTypeOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(e.target)) setIsCategoryOpen(false);
      if (editYearRef.current && !editYearRef.current.contains(e.target)) setIsEditYearOpen(false);
      if (editTypeRef.current && !editTypeRef.current.contains(e.target)) setIsEditTypeOpen(false);
      if (editCategoryRef.current && !editCategoryRef.current.contains(e.target)) setIsEditCategoryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Classes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMuted = darkMode ? 'text-gray-500' : 'text-gray-400';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = `w-full px-3 py-2 rounded-lg border ${borderClass} ${darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;

  const btnPrimary = "px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2 cursor-pointer";
  const btnSuccess = "px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 cursor-pointer";
  const btnOutline = `px-4 py-2 rounded-lg border ${borderClass} ${textClass} hover:bg-gray-100 dark:hover:bg-[#252525] transition-all flex items-center gap-2 cursor-pointer`;

  // Récupération données
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
    } catch (error) {
      showNotification("❌ Erreur chargement", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Mise à jour catégories disponibles pour nouveau crédit
  useEffect(() => {
    if (creditForm.type_id) {
      const selected = types.find(t => t.id === parseInt(creditForm.type_id));
      setAvailableCategories(selected?.categories || []);
      if (creditForm.category_id && !selected?.categories?.some(c => c.id === parseInt(creditForm.category_id))) {
        setCreditForm(prev => ({ ...prev, category_id: '', category_name: '' }));
      }
    } else {
      setAvailableCategories([]);
    }
  }, [creditForm.type_id, types]);

  // Mise à jour catégories disponibles pour édition crédit
  useEffect(() => {
    if (editCreditForm.type_id) {
      const selected = types.find(t => t.id === parseInt(editCreditForm.type_id));
      setEditAvailableCategories(selected?.categories || []);
      if (editCreditForm.category_id && !selected?.categories?.some(c => c.id === parseInt(editCreditForm.category_id))) {
        setEditCreditForm(prev => ({ ...prev, category_id: '', category_name: '' }));
      }
    } else {
      setEditAvailableCategories([]);
    }
  }, [editCreditForm.type_id, types]);

  // Types CRUD
  const addType = async () => {
    if (!newTypeName.trim()) return showNotification("❌ Nom requis", "error");
    try {
      const res = await api.post('/api/credit-types', {
        name: newTypeName,
        code: newTypeCode.toUpperCase() || newTypeName.toUpperCase().replace(/\s/g, '_'),
        category_ids: selectedCategoriesForType
      });
      setTypes([...types, res.data]);
      setNewTypeName(''); setNewTypeCode(''); setSelectedCategoriesForType([]);
      setShowNewTypeForm(false);
      showNotification("✅ Type ajouté", "success");
    } catch (error) { showNotification("❌ Erreur", "error"); }
  };

  const updateType = async (id, name) => {
    try {
      const res = await api.put(`/api/credit-types/${id}`, { name });
      setTypes(types.map(t => t.id === id ? res.data : t));
      setEditingType(null);
      showNotification("✅ Type modifié", "success");
    } catch (error) { showNotification("❌ Erreur", "error"); }
  };

  const deleteType = (id, name) => setDeleteModal({ isOpen: true, type: 'type', id, name });

  // Categories CRUD
  const addCategory = async () => {
    if (!newCategoryName.trim()) return showNotification("❌ Nom requis", "error");
    try {
      const res = await api.post('/api/credit-categories', {
        name: newCategoryName,
        code: newCategoryCode.toUpperCase() || newCategoryName.toUpperCase().replace(/\s/g, '_')
      });
      setCategories([...categories, res.data]);
      setNewCategoryName(''); setNewCategoryCode('');
      setShowNewCategoryForm(false);
      showNotification("✅ Catégorie ajoutée", "success");
    } catch (error) { showNotification("❌ Erreur", "error"); }
  };

  const updateCategory = async (id, name) => {
    try {
      const res = await api.put(`/api/credit-categories/${id}`, { name });
      setCategories(categories.map(c => c.id === id ? res.data : c));
      setEditingCategory(null);
      showNotification("✅ Catégorie modifiée", "success");
    } catch (error) { showNotification("❌ Erreur", "error"); }
  };

  const deleteCategory = (id, name) => setDeleteModal({ isOpen: true, type: 'category', id, name });

  // Credits CRUD
  const addCredit = async () => {
    if (!creditForm.name || !creditForm.type_id || !creditForm.category_id || !creditForm.max_amount || !creditForm.interest_rate || !creditForm.max_duration || !creditForm.year) {
      return showNotification("❌ Tous les champs sont requis", "error");
    }
    try {
      const res = await api.post('/api/credits', {
        name: creditForm.name, type_id: creditForm.type_id, category_id: creditForm.category_id,
        max_amount: creditForm.max_amount, interest_rate: creditForm.interest_rate,
        max_duration: creditForm.max_duration, description: creditForm.description, year: creditForm.year
      });
      setCredits([...credits, res.data]);
      setCreditForm({ name: '', type_id: '', type_name: '', category_id: '', category_name: '', max_amount: '', interest_rate: '', max_duration: '', description: '', year: '' });
      setShowNewCreditForm(false);
      showNotification("✅ Crédit ajouté", "success");
      fetchData();
    } catch (error) { showNotification("❌ Erreur", "error"); }
  };

  // Fonction pour ouvrir le formulaire d'édition crédit
  const openEditCredit = (credit) => {
    setEditCreditForm({
      id: credit.id,
      name: credit.name || '',
      type_id: credit.type_id || '',
      type_name: credit.type?.name || '',
      category_id: credit.category_id || '',
      category_name: credit.category?.name || '',
      max_amount: credit.max_amount || '',
      interest_rate: credit.interest_rate || '',
      max_duration: credit.max_duration || '',
      description: credit.description || '',
      year: credit.year || ''
    });
    setEditingCredit(credit.id);
  };

  // Fonction pour mettre à jour un crédit
  const updateCredit = async () => {
    if (!editCreditForm.name || !editCreditForm.type_id || !editCreditForm.category_id || !editCreditForm.max_amount || !editCreditForm.interest_rate || !editCreditForm.max_duration || !editCreditForm.year) {
      return showNotification("❌ Tous les champs sont requis", "error");
    }
    try {
      const res = await api.put(`/api/credits/${editCreditForm.id}`, {
        name: editCreditForm.name,
        type_id: editCreditForm.type_id,
        category_id: editCreditForm.category_id,
        max_amount: editCreditForm.max_amount,
        interest_rate: editCreditForm.interest_rate,
        max_duration: editCreditForm.max_duration,
        description: editCreditForm.description,
        year: editCreditForm.year
      });
      setCredits(credits.map(c => c.id === editCreditForm.id ? res.data : c));
      setEditingCredit(null);
      setEditCreditForm({
        id: null, name: '', type_id: '', type_name: '', category_id: '', category_name: '',
        max_amount: '', interest_rate: '', max_duration: '', description: '', year: ''
      });
      showNotification("✅ Crédit modifié", "success");
      fetchData();
    } catch (error) { showNotification("❌ Erreur", "error"); }
  };

  // Annuler l'édition
  const cancelEditCredit = () => {
    setEditingCredit(null);
    setEditCreditForm({
      id: null, name: '', type_id: '', type_name: '', category_id: '', category_name: '',
      max_amount: '', interest_rate: '', max_duration: '', description: '', year: ''
    });
  };

  const deleteCredit = (id, name) => setDeleteModal({ isOpen: true, type: 'credit', id, name });

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'type') {
        await api.delete(`/api/credit-types/${deleteModal.id}`);
        setTypes(types.filter(t => t.id !== deleteModal.id));
      } else if (deleteModal.type === 'category') {
        await api.delete(`/api/credit-categories/${deleteModal.id}`);
        setCategories(categories.filter(c => c.id !== deleteModal.id));
      } else {
        await api.delete(`/api/credits/${deleteModal.id}`);
        setCredits(credits.filter(c => c.id !== deleteModal.id));
      }
      showNotification("✅ Supprimé", "success");
    } catch (error) { showNotification("❌ Erreur", "error"); }
    setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
  };

  const formatMoney = (n) => {
    if (!n) return '0 DH';
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M DH';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k DH';
    return n.toLocaleString('fr-FR') + ' DH';
  };

  const filteredCredits = credits.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className={`min-h-screen flex items-center justify-center ${bgClass}`}><Loader2 className="animate-spin text-indigo-500" size={40} /></div>;

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => window.history.back()}
            className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'} hover:scale-105`}
            title="Retour"
          >
            <ArrowLeft size={20} className={textClass} />
          </button>
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <CreditCard size={22} className="text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className={`text-xl font-bold ${textClass}`}>Gestion des Crédits</h1>
            <p className={`text-sm ${textMuted}`}>Types • Catégories • Produits de crédit</p>
          </div>
        </div>

        {/* ==================== SECTION TYPES ==================== */}
        <div className={`${cardClass} rounded-xl border overflow-hidden mb-6`}>
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-indigo-500" />
              <h2 className={`font-semibold ${textClass}`}>Types de crédit</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'} ${textMuted}`}>{types.length}</span>
            </div>
            <button onClick={() => setShowNewTypeForm(!showNewTypeForm)} className={btnPrimary}>
              {showNewTypeForm ? <X size={16} /> : <Plus size={16} />}
              {showNewTypeForm ? 'Fermer' : 'Nouveau type'}
            </button>
          </div>

          {/* Formulaire ajout type */}
          {showNewTypeForm && (
            <div className="p-4 border-b bg-gray-50 dark:bg-[#252525]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Nom (ex: Crédit Standard)" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} className={inputClass} />
                <input placeholder="Code (ex: STD)" value={newTypeCode} onChange={e => setNewTypeCode(e.target.value.toUpperCase())} className={inputClass} />
                <div className="md:col-span-2">
                  <p className={`text-xs ${textMuted} mb-2`}>Catégories associées</p>
                  <div className="flex flex-wrap gap-2 p-2 border rounded-lg">
                    {categories.map(cat => (
                      <button key={cat.id} onClick={() => {
                        setSelectedCategoriesForType(prev =>
                          prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                        );
                      }} className={`text-xs px-2 py-1 rounded-full transition-all cursor-pointer ${selectedCategoriesForType.includes(cat.id) ? 'bg-indigo-600 text-white' : darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <button onClick={addType} className={btnSuccess}><CheckCircle size={16} /> Enregistrer</button>
                  <button onClick={() => { setShowNewTypeForm(false); setNewTypeName(''); setNewTypeCode(''); setSelectedCategoriesForType([]); }} className={btnOutline}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Liste types */}
          <div className="divide-y">
            {types.length === 0 ? (
              <div className="p-6 text-center text-gray-400">Aucun type</div>
            ) : (
              types.map(type => (
                <div key={type.id} className="p-3 hover:bg-gray-50 dark:hover:bg-[#252525]/30 transition">
                  <div className="flex justify-between items-center">
                    {editingType === type.id ? (
                      <div className="flex-1 flex gap-2">
                        <input defaultValue={type.name} className="flex-1 px-3 py-1 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500" autoFocus onBlur={e => updateType(type.id, e.target.value)} />
                        <button onClick={() => setEditingType(null)} className="p-1 text-gray-400 cursor-pointer"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div>
                          <p className={`font-medium ${textClass}`}>{type.name}</p>
                          <code className={`text-xs ${textMuted}`}>{type.code}</code>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {type.categories?.map(cat => <span key={cat.id} className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{cat.name}</span>)}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingType(type.id)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg cursor-pointer"><Edit2 size={14} /></button>
                          <button onClick={() => deleteType(type.id, type.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ==================== SECTION CATEGORIES ==================== */}
        <div className={`${cardClass} rounded-xl border overflow-hidden mb-6`}>
          <div className="p-4 border-b flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-purple-500" />
              <h2 className={`font-semibold ${textClass}`}>Catégories de crédit</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'} ${textMuted}`}>{categories.length}</span>
            </div>
            <button onClick={() => setShowNewCategoryForm(!showNewCategoryForm)} className={btnPrimary}>
              {showNewCategoryForm ? <X size={16} /> : <Plus size={16} />}
              {showNewCategoryForm ? 'Fermer' : 'Nouvelle catégorie'}
            </button>
          </div>

          {/* Formulaire ajout catégorie */}
          {showNewCategoryForm && (
            <div className="p-4 border-b bg-gray-50 dark:bg-[#252525]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Nom (ex: Immobilier)" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className={inputClass} />
                <input placeholder="Code (ex: IMMO)" value={newCategoryCode} onChange={e => setNewCategoryCode(e.target.value.toUpperCase())} className={inputClass} />
                <div className="md:col-span-2 flex gap-2">
                  <button onClick={addCategory} className={btnSuccess}><CheckCircle size={16} /> Enregistrer</button>
                  <button onClick={() => { setShowNewCategoryForm(false); setNewCategoryName(''); setNewCategoryCode(''); }} className={btnOutline}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Liste catégories */}
          <div className="divide-y">
            {categories.length === 0 ? (
              <div className="p-6 text-center text-gray-400">Aucune catégorie</div>
            ) : (
              categories.map(cat => (
                <div key={cat.id} className="p-3 hover:bg-gray-50 dark:hover:bg-[#252525]/30 transition">
                  <div className="flex justify-between items-center">
                    {editingCategory === cat.id ? (
                      <div className="flex-1 flex gap-2">
                        <input defaultValue={cat.name} className="flex-1 px-2 py-1 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500" autoFocus onBlur={e => updateCategory(cat.id, e.target.value)} />
                        <button onClick={() => setEditingCategory(null)} className="p-1 text-gray-400 cursor-pointer"><X size={14} /></button>
                      </div>
                    ) : (
                      <>
                        <div><p className={`font-medium ${textClass}`}>{cat.name}</p><code className={`text-xs ${textMuted}`}>{cat.code}</code></div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingCategory(cat.id)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg cursor-pointer"><Edit2 size={14} /></button>
                          <button onClick={() => deleteCategory(cat.id, cat.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer"><Trash2 size={14} /></button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ==================== SECTION CREDITS ==================== */}
        <div className={`${cardClass} rounded-xl border overflow-hidden`}>
          <div className="p-4 border-b flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-500" />
              <h2 className={`font-semibold ${textClass}`}>Produits de crédit</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'} ${textMuted}`}>{credits.length}</span>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                <input placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`pl-9 pr-3 py-2 rounded-lg border ${inputClass} text-sm w-48 md:w-64`} />
              </div>
              <button onClick={() => setShowNewCreditForm(!showNewCreditForm)} className={btnSuccess}>
                {showNewCreditForm ? <X size={16} /> : <Plus size={16} />}
                {showNewCreditForm ? 'Fermer' : 'Nouveau crédit'}
              </button>
            </div>
          </div>

          {/* Formulaire ajout crédit */}
          {showNewCreditForm && (
            <div className="p-4 border-b bg-gray-50 dark:bg-[#252525]/50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input placeholder="Nom du crédit" value={creditForm.name} onChange={e => setCreditForm({...creditForm, name: e.target.value})} className={inputClass} />
                
                {/* Type selector */}
                <div className="relative" ref={typeRef}>
                  <button onClick={() => setIsTypeOpen(!isTypeOpen)} className={`w-full px-3 py-2 rounded-lg border ${borderClass} text-sm flex justify-between items-center cursor-pointer ${darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'}`}>
                    {creditForm.type_name || (types.find(t => t.id === parseInt(creditForm.type_id))?.name) || 'Sélectionner un type'}
                    <ChevronDown size={14} />
                  </button>
                  {isTypeOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-auto`}>
                      {types.map(t => (
                        <div key={t.id} onClick={() => { setCreditForm({...creditForm, type_id: t.id, type_name: t.name, category_id: '', category_name: ''}); setIsTypeOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm ${creditForm.type_id === t.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : textClass}`}>
                          {t.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Category selector */}
                <div className="relative" ref={categoryRef}>
                  <button onClick={() => setIsCategoryOpen(!isCategoryOpen)} disabled={!creditForm.type_id} className={`w-full px-3 py-2 rounded-lg border ${borderClass} text-sm flex justify-between items-center cursor-pointer ${!creditForm.type_id ? 'opacity-50 cursor-not-allowed' : darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'}`}>
                    {creditForm.category_name || (availableCategories.find(c => c.id === parseInt(creditForm.category_id))?.name) || 'Sélectionner une catégorie'}
                    <ChevronDown size={14} />
                  </button>
                  {isCategoryOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-auto`}>
                      {availableCategories.map(c => (
                        <div key={c.id} onClick={() => { setCreditForm({...creditForm, category_id: c.id, category_name: c.name}); setIsCategoryOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm ${creditForm.category_id === c.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : textClass}`}>
                          {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <input type="number" placeholder="Montant max (DH)" value={creditForm.max_amount} onChange={e => setCreditForm({...creditForm, max_amount: e.target.value})} className={inputClass} />
                <input type="number" step="0.1" placeholder="Taux d'intérêt (%)" value={creditForm.interest_rate} onChange={e => setCreditForm({...creditForm, interest_rate: e.target.value})} className={inputClass} />
                <input type="number" placeholder="Durée max (mois)" value={creditForm.max_duration} onChange={e => setCreditForm({...creditForm, max_duration: e.target.value})} className={inputClass} />
                
                {/* Year selector */}
                <div className="relative" ref={yearRef}>
                  <button onClick={() => setIsYearOpen(!isYearOpen)} className={`w-full px-3 py-2 rounded-lg border ${borderClass} text-sm flex justify-between items-center cursor-pointer ${darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'}`}>
                    {creditForm.year ? ` ${creditForm.year}` : 'Sélectionner une année'}
                    <ChevronDown size={14} />
                  </button>
                  {isYearOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-auto`}>
                      {salaryYears.map(y => (
                        <div key={y.id} onClick={() => { setCreditForm({...creditForm, year: y.year}); setIsYearOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm ${creditForm.year === y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : textClass}`}>
                           {y.year}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <textarea placeholder="Description (optionnelle)" value={creditForm.description} onChange={e => setCreditForm({...creditForm, description: e.target.value})} className={`${inputClass} md:col-span-2`} rows="2" />
                <div className="md:col-span-2 flex gap-2">
                  <button onClick={addCredit} className={btnSuccess}><Save size={16} /> Ajouter le crédit</button>
                  <button onClick={() => { setShowNewCreditForm(false); setCreditForm({name: '', type_id: '', type_name: '', category_id: '', category_name: '', max_amount: '', interest_rate: '', max_duration: '', description: '', year: ''}); }} className={btnOutline}>Annuler</button>
                </div>
              </div>
            </div>
          )}

          {/* Liste crédits avec bouton modifier */}
          <div className="divide-y">
            {filteredCredits.length === 0 ? (
              <div className="p-8 text-center text-gray-400">Aucun crédit</div>
            ) : (
              filteredCredits.map(credit => (
                <div key={credit.id} className="p-3 hover:bg-gray-50 dark:hover:bg-[#252525]/30 transition">
                  {editingCredit === credit.id ? (
                    // Formulaire d'édition crédit
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input placeholder="Nom" value={editCreditForm.name} onChange={e => setEditCreditForm({...editCreditForm, name: e.target.value})} className={inputClass} />
                        
                        {/* Type selector édition */}
                        <div className="relative" ref={editTypeRef}>
                          <button onClick={() => setIsEditTypeOpen(!isEditTypeOpen)} className={`w-full px-3 py-2 rounded-lg border ${borderClass} text-sm flex justify-between items-center cursor-pointer ${darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'}`}>
                            {editCreditForm.type_name || (types.find(t => t.id === parseInt(editCreditForm.type_id))?.name) || 'Type'}
                            <ChevronDown size={14} />
                          </button>
                          {isEditTypeOpen && (
                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-auto`}>
                              {types.map(t => (
                                <div key={t.id} onClick={() => { setEditCreditForm({...editCreditForm, type_id: t.id, type_name: t.name, category_id: '', category_name: ''}); setIsEditTypeOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm`}>
                                  {t.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Category selector édition */}
                        <div className="relative" ref={editCategoryRef}>
                          <button onClick={() => setIsEditCategoryOpen(!isEditCategoryOpen)} disabled={!editCreditForm.type_id} className={`w-full px-3 py-2 rounded-lg border ${borderClass} text-sm flex justify-between items-center cursor-pointer ${!editCreditForm.type_id ? 'opacity-50 cursor-not-allowed' : darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'}`}>
                            {editCreditForm.category_name || (editAvailableCategories.find(c => c.id === parseInt(editCreditForm.category_id))?.name) || 'Catégorie'}
                            <ChevronDown size={14} />
                          </button>
                          {isEditCategoryOpen && (
                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-auto`}>
                              {editAvailableCategories.map(c => (
                                <div key={c.id} onClick={() => { setEditCreditForm({...editCreditForm, category_id: c.id, category_name: c.name}); setIsEditCategoryOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm`}>
                                  {c.name}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <input type="number" placeholder="Montant max" value={editCreditForm.max_amount} onChange={e => setEditCreditForm({...editCreditForm, max_amount: e.target.value})} className={inputClass} />
                        <input type="number" step="0.1" placeholder="Taux" value={editCreditForm.interest_rate} onChange={e => setEditCreditForm({...editCreditForm, interest_rate: e.target.value})} className={inputClass} />
                        <input type="number" placeholder="Durée (mois)" value={editCreditForm.max_duration} onChange={e => setEditCreditForm({...editCreditForm, max_duration: e.target.value})} className={inputClass} />
                        
                        {/* Year selector édition */}
                        <div className="relative" ref={editYearRef}>
                          <button onClick={() => setIsEditYearOpen(!isEditYearOpen)} className={`w-full px-3 py-2 rounded-lg border ${borderClass} text-sm flex justify-between items-center cursor-pointer ${darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800'}`}>
                            {editCreditForm.year ? ` ${editCreditForm.year}` : 'Année'}
                            <ChevronDown size={14} />
                          </button>
                          {isEditYearOpen && (
                            <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-auto`}>
                              {salaryYears.map(y => (
                                <div key={y.id} onClick={() => { setEditCreditForm({...editCreditForm, year: y.year}); setIsEditYearOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm`}>
                                   {y.year}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <textarea placeholder="Description" value={editCreditForm.description} onChange={e => setEditCreditForm({...editCreditForm, description: e.target.value})} className={`${inputClass} md:col-span-2`} rows="2" />
                        <div className="md:col-span-2 flex gap-2">
                          <button onClick={updateCredit} className={btnSuccess}><Save size={16} /> Enregistrer</button>
                          <button onClick={cancelEditCredit} className={btnOutline}>Annuler</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Affichage normal du crédit
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className={`font-semibold ${textClass}`}>{credit.name}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">{credit.type?.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">{credit.category?.name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">{credit.year}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${credit.status === 'Actif' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700'}`}>{credit.status}</span>
                        </div>
                        <div className="flex gap-3 mt-2 text-sm">
                          <span className={textMuted}><Banknote size={12} className="inline mr-1" />{formatMoney(credit.max_amount)}</span>
                          <span className={textMuted}><Percent size={12} className="inline mr-1" />{credit.interest_rate}%</span>
                          <span className={textMuted}><Clock size={12} className="inline mr-1" />{credit.max_duration} mois</span>
                        </div>
                        {credit.description && <p className={`text-xs ${textMuted} mt-1`}>{credit.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEditCredit(credit)} className="p-1.5 text-gray-400 hover:text-indigo-500 rounded-lg cursor-pointer" title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteCredit(credit.id, credit.name)} className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg cursor-pointer" title="Supprimer">
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
      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
        onConfirm={confirmDelete}
        title="Confirmation"
        message={`Supprimer "${deleteModal.name}" ?`}
        darkMode={darkMode}
      />
    </div>
  );
};

export default GestionCredit;