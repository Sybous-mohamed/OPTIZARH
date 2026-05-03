import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Plus, Loader2, Layout, 
  FileText, Trash2, Save, Truck, Users, Settings2, Search,
  Lock, Unlock, Eye, EyeOff, FileDown, ArrowLeft
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig'; 
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GestionSNTL = () => {
  const { darkMode } = useTheme();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { showNotification } = useNotification();
  const [availableYears, setAvailableYears] = useState([]);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);
  
  const [sntlData, setSntlData] = useState([]);
  const [roles, setRoles] = useState([]);

  // ============================================================
  // FONCTION DE VALIDATION SELON LE TYPE DE MONTANT
  // ============================================================
  const validateValeur = (value, typeMontant, label = '') => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    if (numValue < 0) return 0;
    
    // Si c'est un pourcentage, limiter à 100
    if (typeMontant === 'pourcentage') {
      if (numValue > 100) {
        showNotification(`⚠️ Le pourcentage "${label || 'cette ligne'}" ne peut pas dépasser 100%`, "warning");
        return 100;
      }
    }
    
    return numValue;
  };

  // Dark mode classes complètes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#f1f5f9]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const cardHeaderClass = darkMode ? 'bg-[#252525] border-b border-[#333]' : 'bg-slate-50 border-b border-slate-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-slate-900';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-slate-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-slate-200';
  const selectClass = darkMode 
    ? 'bg-[#252525] border-[#333] text-white' 
    : 'bg-gray-50 border-gray-200 text-gray-800';
  const inputBgClass = darkMode 
    ? 'bg-[#252525] border-[#333] text-white placeholder-gray-500'
    : 'bg-slate-50 border-slate-100 text-slate-700';

  // Fermer le select quand on clique outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Retour à la page précédente
  const handleGoBack = () => {
    window.history.back();
  };

  // 1. Charger les années disponibles au montage
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        const years = response.data || [];
        setAvailableYears(years);
        
        const savedYear = localStorage.getItem('sntl_selected_year');
        const savedYearId = localStorage.getItem('sntl_selected_year_id');
        
        if (savedYear && years.some(y => y.year == savedYear)) {
          setSelectedYear(savedYear);
          setSelectedYearId(savedYearId ? parseInt(savedYearId) : null);
        } else if (years.length > 0) {
          const lastYear = years[years.length - 1];
          setSelectedYear(lastYear.year);
          setSelectedYearId(lastYear.id);
          localStorage.setItem('sntl_selected_year', lastYear.year);
          localStorage.setItem('sntl_selected_year_id', lastYear.id);
        }
      } catch (error) {
        showNotification("Erreur lors du chargement des années", "error");
      }
    };
    fetchYears();
  }, []);

  const handleYearChange = (yearValue, yearId) => {
    setSelectedYear(yearValue);
    setSelectedYearId(yearId);
    setIsYearOpen(false);
    localStorage.setItem('sntl_selected_year', yearValue);
    localStorage.setItem('sntl_selected_year_id', yearId);
    showNotification(` Année ${yearValue} sélectionnée`, "success");
  };

  // 2. Charger les rôles quand l'année change
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedYearId || availableYears.length === 0) return;
      try {
        const res = await api.get(`/api/gestionEtat/roles/${selectedYearId}`);
        setRoles(res.data);
      } catch (err) { 
        console.error("Erreur roles", err); 
      }
    };
    fetchRoles();
  }, [selectedYearId, availableYears]);

  // 3. Fonction pour charger les données
  const fetchSntlData = async () => {
    if (!selectedYearId) return;

    setFetching(true);
    try {
      const response = await api.get(`/api/sntl/configs?year_id=${selectedYearId}`);
      
      const formattedData = await Promise.all(response.data.map(async (item) => {
        let grades = [];
        let echelles = [];
        let echelons = [];

        if (item.role_id) {
          const resG = await api.get(`/api/gestionEtat/grades/${item.role_id}`);
          grades = resG.data;
        }
        if (item.grade_id) {
          const resEch = await api.get(`/api/gestionEtat/echelles/${item.grade_id}`);
          echelles = resEch.data;
        }
        if (item.echelle_id) {
          const resEcl = await api.get(`/api/gestionEtat/echelons/${item.echelle_id}`);
          echelons = resEcl.data;
        }

        return {
          ...item,
          echelle: item.echelle_id, 
          echelon: item.echelon_id,
          is_active: item.is_active === 1 || item.is_active === true,
          isLocked: true,
          availableGrades: grades,
          availableEchelles: echelles,
          availableEchelons: echelons
        };
      }));

      setSntlData(formattedData);
    } catch (error) {
      showNotification("Erreur lors du chargement des données", "error");
    } finally {
      setFetching(false);
    }
  };

  // 4. Déclencheur automatique de chargement
  useEffect(() => {
    if (selectedYearId) {
      fetchSntlData();
    }
  }, [selectedYearId]);

  // --- Handlers ---
  const handleRoleChange = async (configId, roleId) => {
    try {
      const res = await api.get(`/api/gestionEtat/grades/${roleId}`);
      setSntlData(prev => prev.map(c => 
        c.id === configId ? { 
          ...c, 
          role_id: roleId, 
          grade_id: '', 
          echelle: '', 
          echelon: '',
          availableGrades: res.data,
          availableEchelles: [],
          availableEchelons: []
        } : c
      ));
    } catch (err) { console.error(err); }
  };

  const handleGradeChange = async (configId, gradeId) => {
    try {
      const res = await api.get(`/api/gestionEtat/echelles/${gradeId}`);
      setSntlData(prev => prev.map(c => 
        c.id === configId ? { 
          ...c, 
          grade_id: gradeId, 
          echelle: '', 
          echelon: '',
          availableEchelles: res.data,
          availableEchelons: []
        } : c
      ));
    } catch (err) { console.error(err); }
  };

  const handleEchelleChange = async (configId, echelleId) => {
    try {
      const res = await api.get(`/api/gestionEtat/echelons/${echelleId}`);
      setSntlData(prev => prev.map(c => 
        c.id === configId ? { 
          ...c, 
          echelle: echelleId, 
          echelon: '',
          availableEchelons: res.data 
        } : c
      ));
    } catch (err) { console.error(err); }
  };

  const addSntlConfig = () => {
    const newConfig = {
      id: Date.now(),
      label: "Nouvelle Cotisation SNTL",
      valeur: 0,
      type_montant: "fixe",
      categorie_cible: "tous",
      role_id: "",
      grade_id: "",
      echelle: "",
      echelon: "",
      is_active: true,
      isLocked: false,
      availableGrades: [],
      availableEchelles: [],
      availableEchelons: []
    };
    setSntlData([...sntlData, newConfig]);
  };

  const handleDelete = async (id) => {
    if (typeof id === 'number' && id > 1000000000) {
      setSntlData(sntlData.filter(item => item.id !== id));
      return;
    }
    
    if (window.confirm("Voulez-vous vraiment supprimer définitivement ce paramètre ?")) {
      try {
        await api.delete(`/api/sntl/configs/${id}`);
        setSntlData(sntlData.filter(item => item.id !== id));
        showNotification("Configuration supprimée", "success");
      } catch (error) {
        showNotification("Erreur lors de la suppression", "error");
      }
    }
  };

  const toggleLock = (id) => {
    setSntlData(sntlData.map(item => item.id === id ? { ...item, isLocked: !item.isLocked } : item));
  };

  const toggleActive = (id) => {
    setSntlData(sntlData.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));
  };

  const handleSave = async () => {
    if (sntlData.length === 0) {
      showNotification("Veuillez ajouter au moins une configuration", "warning");
      return;
    }

    // Validation des valeurs avant sauvegarde
    for (const config of sntlData) {
      if (config.valeur < 0) {
        showNotification(`⚠️ La valeur "${config.label}" ne peut pas être négative`, "warning");
        return;
      }
      if (config.type_montant === 'pourcentage' && config.valeur > 100) {
        showNotification(`⚠️ Le pourcentage "${config.label}" ne peut pas dépasser 100%`, "warning");
        return;
      }
    }

    if (!selectedYearId) {
      showNotification("Année non valide", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = sntlData.map(item => {
        const isSpecifique = item.categorie_cible === 'cadres';
        return {
          label: item.label,
          valeur: item.valeur,
          type_montant: item.type_montant,
          categorie_cible: item.categorie_cible,
          role_id: isSpecifique ? (item.role_id || null) : null,
          grade_id: isSpecifique ? (item.grade_id || null) : null,
          echelle_id: isSpecifique ? (item.echelle || null) : null, 
          echelon_id: isSpecifique ? (item.echelon || null) : null,
          is_active: item.is_active ? 1 : 0
        };
      });

      await api.post('/api/sntl/save', {
        salary_year_id: selectedYearId, 
        configs: payload 
      });
      
      showNotification("Enregistré avec succès !", "success");
      fetchSntlData(); 
    } catch (error) {
      showNotification("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };


  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const dateGen = new Date().toLocaleDateString();
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 102);
      doc.text("PARAMÉTRAGE ASSURANCE SNTL", 14, 22);
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Année de référence : ${selectedYear}`, 14, 30);
      doc.text(`Date de génération : ${dateGen}`, 14, 35);

      const tableColumn = ["Libellé", "Valeur", "Cible", "Détails Hiérarchiques", "Statut"];
      const tableRows = [];

      sntlData.forEach(item => {
        const cible = item.categorie_cible === 'tous' ? 'Tous les agents' : 'Spécifique';
        let details = "-";
        if (item.categorie_cible === 'cadres') {
          const roleName = roles.find(r => r.id == item.role_id)?.name || '';
          const gradeName = item.availableGrades?.find(g => g.id == item.grade_id)?.name || '';
          details = `${roleName}${gradeName ? ' > ' + gradeName : ''}`;
        }
        tableRows.push([
          item.label,
          `${item.valeur} ${item.type_montant === 'fixe' ? 'DH' : '%'}`,
          cible,
          details,
          item.is_active ? "Actif" : "Inactif"
        ]);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [0, 51, 102] },
      });

      doc.save(`SNTL_Parametrage_${selectedYear}.pdf`);
      showNotification("PDF généré", "success");
    } catch (error) { console.error(error); }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-3 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header avec bouton retour */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-white hover:bg-gray-100 border border-gray-200'} hover:scale-105 shadow-sm`}
              title="Retour"
            >
              <ArrowLeft size={20} className={darkMode ? 'text-gray-400' : 'text-slate-600'} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold tracking-tight uppercase ${textClass}`}>Paramétrage Assurance SNTL</h1>
              <p className={`text-sm italic ${textMutedClass}`}>Gestion des retenues spécifiques pour l'année {selectedYear}</p>
            </div>
          </div>
          <button 
            onClick={exportToPDF}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all shadow-sm uppercase cursor-pointer ${darkMode ? 'bg-[#252525] border border-[#333] text-gray-300 hover:bg-[#333]' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            <FileDown size={16} className="text-rose-600" /> Exporter PDF
          </button>
        </div>


        {/* Toolbar avec select personnalisé */}
        <div className={`${cardClass} rounded-2xl border ${borderClass} p-4 mb-6 shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              
              {/* YEAR PICKER PERSONNALISÉ */}
              <div className="relative" ref={yearRef}>
                <button 
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className={`h-10 px-4 rounded-lg font-medium outline-none cursor-pointer min-w-[140px] transition-all ${selectClass} border ${borderClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
                >
                  <span className="truncate">{selectedYear || 'Sélectionner année'}</span>
                  <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isYearOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-60 overflow-y-auto shadow-lg`}>
                    {availableYears.map((y) => (
                      <div 
                        key={y.id}
                        onClick={() => handleYearChange(y.year, y.id)}
                        className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${
                          selectedYear === y.year 
                            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' 
                            : textClass
                        }`}
                      >
                        {y.year}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <button 
                onClick={addSntlConfig}
                className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md uppercase cursor-pointer"
              >
                <Plus size={16} /> Nouveau Paramètre
              </button>
            </div>
            {fetching && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          </div>
        </div>

        {/* Main List */}
        <div className="space-y-6">
          {sntlData.length === 0 && !fetching ? (
            <div className={`${cardClass} rounded-3xl border-2 border-dashed ${borderClass} p-12 flex flex-col items-center justify-center text-center`}>
              <div className={`p-6 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-slate-50'} mb-6`}>
                <Layout size={48} className="text-slate-300" />
              </div>
              <h2 className={`text-xl font-bold ${textClass} mb-2`}>Aucun paramétrage trouvé</h2>
              <button onClick={addSntlConfig} className="bg-[#003366] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#002244] transition-all cursor-pointer">
                <Plus size={20} /> Ajouter une configuration
              </button>
            </div>
          ) : (
            sntlData.map((config) => (
              <div key={config.id} className={`${cardClass} rounded-2xl border ${borderClass} shadow-sm overflow-hidden transition-all ${!config.is_active ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                
                {/* Item Header */}
                <div className={`${cardHeaderClass} px-6 py-4 flex justify-between items-center`}>
                  <div className="flex items-center gap-3">
                    <div className={`${config.is_active ? 'bg-[#003366]' : 'bg-slate-400'} p-1.5 rounded text-white`}><FileText size={16}/></div>
                    <input 
                      disabled={config.isLocked}
                      className={`bg-transparent font-bold outline-none border-b ${config.isLocked ? 'border-transparent' : 'border-blue-500'} ${textClass}`}
                      value={config.label}
                      onChange={(e) => {
                        setSntlData(sntlData.map(c => c.id === config.id ? {...c, label: e.target.value} : c));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleActive(config.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${config.is_active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'}`}
                    >
                      {config.is_active ? <Eye size={14}/> : <EyeOff size={14}/>}
                      {config.is_active ? 'ACTIF' : 'INACTIF'}
                    </button>

                    <button 
                      onClick={() => toggleLock(config.id)}
                      className={`p-2 rounded-lg transition-all cursor-pointer ${config.isLocked ? 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}
                    >
                      {config.isLocked ? <Lock size={18}/> : <Unlock size={18}/>}
                    </button>

                    <button onClick={() => handleDelete(config.id)} className="text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 p-2 transition-colors cursor-pointer">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                {/* Item Content */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${textMutedClass}`}>Libellé / Nom</label>
                      <input 
                        disabled={config.isLocked}
                        className={`w-full ${inputBgClass} border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${config.isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        value={config.label}
                        onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, label: e.target.value} : c))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${textMutedClass}`}>Valeur</label>
                      <div className="relative">
                        <input 
                          disabled={config.isLocked}
                          type="number"
                          min="0"
                          className={`w-full ${inputBgClass} border rounded-lg p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${config.isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                          value={config.valeur}
                          onChange={(e) => {
                            let rawValue = e.target.value;
                            let validatedValue = validateValeur(rawValue, config.type_montant, config.label);
                            setSntlData(sntlData.map(c => c.id === config.id ? {...c, valeur: validatedValue} : c));
                          }}
                        />
                        <span className={`absolute right-3 top-3 font-bold text-xs uppercase ${textMutedClass}`}>
                          {config.type_montant === 'fixe' ? 'DH' : '%'}
                        </span>
                      </div>
                      {config.type_montant === 'pourcentage' && (
                        <p className={`text-[9px] ${textMutedClass} mt-1`}>⚠️ Maximum: 100%</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${textMutedClass}`}>Type de Montant</label>
                      <select 
                        disabled={config.isLocked}
                        className={`w-full ${inputBgClass} border rounded-lg p-3 text-sm font-semibold outline-none cursor-pointer ${config.isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        value={config.type_montant}
                        onChange={(e) => {
                          const newType = e.target.value;
                          let nouvelleValeur = config.valeur;
                          // Si on change de fixe vers pourcentage, vérifier la limite
                          if (newType === 'pourcentage' && config.valeur > 100) {
                            nouvelleValeur = 100;
                            showNotification("⚠️ Le pourcentage a été limité à 100%", "warning");
                          }
                          setSntlData(sntlData.map(c => c.id === config.id ? {...c, type_montant: newType, valeur: nouvelleValeur} : c));
                        }}
                      >
                        <option value="fixe">Montant Fixe (DH)</option>
                        <option value="pourcentage">Pourcentage (%)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className={`text-[10px] font-black uppercase tracking-wider ${textMutedClass}`}>Application</label>
                      <div className={`flex p-1 rounded-lg border h-[46px] ${config.isLocked ? 'opacity-70 pointer-events-none' : ''} ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-slate-50 border-slate-100'}`}>
                        <button 
                          onClick={() => setSntlData(sntlData.map(c => c.id === config.id ? {...c, categorie_cible: 'tous'} : c))}
                          className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-bold rounded-md transition-all cursor-pointer ${config.categorie_cible === 'tous' ? 'bg-white dark:bg-[#333] shadow-sm text-blue-600 dark:text-blue-400' : darkMode ? 'text-gray-500' : 'text-slate-400'}`}
                        >
                          <Users size={14} /> TOUS
                        </button>
                        <button 
                          onClick={() => setSntlData(sntlData.map(c => c.id === config.id ? {...c, categorie_cible: 'cadres'} : c))}
                          className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-bold rounded-md transition-all cursor-pointer ${config.categorie_cible === 'cadres' ? 'bg-white dark:bg-[#333] shadow-sm text-blue-600 dark:text-blue-400' : darkMode ? 'text-gray-500' : 'text-slate-400'}`}
                        >
                          <Search size={14} /> SPECIFIER
                        </button>
                      </div>
                    </div>
                  </div>

                  {config.categorie_cible === 'cadres' && (
                    <div className={`pt-4 border-t p-4 rounded-xl space-y-4 ${darkMode ? 'border-[#333] bg-indigo-900/10' : 'border-slate-100 bg-blue-50/30'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase italic ${textMutedClass}`}>Role</label>
                          <select 
                            className={`w-full ${inputBgClass} border rounded-lg p-2.5 text-sm outline-none cursor-pointer`}
                            value={config.role_id || ''}
                            onChange={(e) => handleRoleChange(config.id, e.target.value)}
                          >
                            <option value="">Sélectionner Role (Optionnel)</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase italic ${textMutedClass}`}>Grade</label>
                          <select 
                            className={`w-full ${inputBgClass} border rounded-lg p-2.5 text-sm outline-none cursor-pointer`}
                            value={config.grade_id || ''}
                            onChange={(e) => handleGradeChange(config.id, e.target.value)}
                            disabled={!config.role_id}
                          >
                            <option value="">Sélectionner Grade</option>
                            {config.availableGrades?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase italic ${textMutedClass}`}>Échelle</label>
                          <select 
                            className={`w-full ${inputBgClass} border rounded-lg p-2.5 text-sm outline-none cursor-pointer`}
                            value={config.echelle || ''}
                            onChange={(e) => handleEchelleChange(config.id, e.target.value)}
                            disabled={!config.grade_id}
                          >
                            <option value="">Sélectionner Échelle</option>
                            {config.availableEchelles?.map(e => <option key={e.id} value={e.id}>Échelle {e.level}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className={`text-[10px] font-black uppercase italic ${textMutedClass}`}>Échelon</label>
                          <select 
                            className={`w-full ${inputBgClass} border rounded-lg p-2.5 text-sm outline-none cursor-pointer`}
                            value={config.echelon || ''}
                            onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, echelon: e.target.value} : c))}
                            disabled={!config.echelle}
                          >
                            <option value="">Sélectionner Échelon</option>
                            {config.availableEchelons?.map(ech => <option key={ech.id} value={ech.id}>Échelon {ech.order}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Save Button */}
        {sntlData.length > 0 && (
          <div className="mt-12 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="flex items-center gap-3 bg-[#003366] text-white px-10 py-3 rounded-xl text-sm font-black hover:bg-[#002244] shadow-lg disabled:opacity-50 transition-all active:scale-95 cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? "ENREGISTREMENT..." : "SAUVEGARDER LE PARAMÉTRAGE SNTL"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionSNTL;