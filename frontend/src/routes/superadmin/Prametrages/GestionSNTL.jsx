import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Plus, Loader2, Layout, 
  FileText, Trash2, Save, Truck, Users, Settings2, Search,
  Lock, Unlock, Eye, EyeOff, FileDown, ArrowLeft,
  Shield, AlertTriangle, CheckCircle2, Sliders
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
  const [posts, setPosts] = useState([]);

  const dm = darkMode;

  // ── Design tokens (dark mode colors UNCHANGED) ──
  const bg          = dm ? 'bg-black'    : 'bg-gray-50';
  const card        = dm ? 'bg-[#1A1A1A]'    : 'bg-white';
  const cardBorder  = dm ? 'border-[#2A2A2A]': 'border-slate-200';
  const surface     = dm ? 'bg-[#252525]'    : 'bg-slate-50';
  const surfaceBorder = dm ? 'border-[#333]' : 'border-slate-200';
  const text        = dm ? 'text-gray-100'   : 'text-slate-900';
  const textSub     = dm ? 'text-gray-400'   : 'text-slate-500';
  const textMuted   = dm ? 'text-gray-600'   : 'text-slate-400';
  const inputBg     = dm ? 'bg-[#252525] border-[#333] text-white placeholder-gray-600' : 'bg-slate-50 border-slate-200 text-slate-700 placeholder-slate-400';
  const divider     = dm ? 'divide-[#2A2A2A]': 'divide-slate-100';

  const inputCls = `w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all font-medium ${inputBg}`;

  // ── Validation ──
  const validateValeur = (value, typeMontant, label = '') => {
    let numValue = parseFloat(value);
    if (isNaN(numValue)) return 0;
    if (numValue < 0) return 0;
    if (typeMontant === 'pourcentage') {
      if (numValue > 100) {
        showNotification(`⚠️ Le pourcentage "${label || 'cette ligne'}" ne peut pas dépasser 100%`, "warning");
        return 100;
      }
    }
    return numValue;
  };

  // ── Click outside ──
  useEffect(() => {
    const h = (e) => { if (yearRef.current && !yearRef.current.contains(e.target)) setIsYearOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleGoBack = () => window.history.back();

  // ── Data fetching ──
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
      } catch { showNotification("Erreur lors du chargement des années", "error"); }
    };
    fetchYears();
  }, []);

  const handleYearChange = (yearValue, yearId) => {
    setSelectedYear(yearValue);
    setSelectedYearId(yearId);
    setIsYearOpen(false);
    localStorage.setItem('sntl_selected_year', yearValue);
    localStorage.setItem('sntl_selected_year_id', yearId);
    showNotification(`Année ${yearValue} sélectionnée`, "success");
  };

  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedYearId || availableYears.length === 0) return;
      try {
        const res = await api.get(`/api/gestionEtat/posts/${selectedYearId}`);
        setPosts(res.data);
      } catch (err) { console.error("Erreur roles", err); }
    };
    fetchRoles();
  }, [selectedYearId, availableYears]);

  const fetchSntlData = async () => {
    if (!selectedYearId) return;
    setFetching(true);
    try {
      const response = await api.get(`/api/sntl/configs?year_id=${selectedYearId}`);
      const formattedData = await Promise.all(response.data.map(async (item) => {
        let grades = [], echelles = [], echelons = [];
        if (item.Post_id) { const r = await api.get(`/api/gestionEtat/grades/${item.Post_id}`); grades = r.data; }
        if (item.grade_id) { const r = await api.get(`/api/gestionEtat/echelles/${item.grade_id}`); echelles = r.data; }
        if (item.echelle_id) { const r = await api.get(`/api/gestionEtat/echelons/${item.echelle_id}`); echelons = r.data; }
        return { ...item, echelle: item.echelle_id, echelon: item.echelon_id, is_active: item.is_active === 1 || item.is_active === true, isLocked: true, availableGrades: grades, availableEchelles: echelles, availableEchelons: echelons };
      }));
      setSntlData(formattedData);
    } catch { showNotification("Erreur lors du chargement des données", "error"); }
    finally { setFetching(false); }
  };

  useEffect(() => { if (selectedYearId) fetchSntlData(); }, [selectedYearId]);

  // ── Handlers ──
  const handlePostChange = async (configId, postId) => {
    try {
      const res = await api.get(`/api/gestionEtat/grades/${postId}`);
      setSntlData(prev => prev.map(c => c.id === configId ? { ...c, Post_id: postId, grade_id: '', echelle: '', echelon: '', availableGrades: res.data, availableEchelles: [], availableEchelons: [] } : c));
    } catch (err) { console.error(err); }
  };

  const handleGradeChange = async (configId, gradeId) => {
    try {
      const res = await api.get(`/api/gestionEtat/echelles/${gradeId}`);
      setSntlData(prev => prev.map(c => c.id === configId ? { ...c, grade_id: gradeId, echelle: '', echelon: '', availableEchelles: res.data, availableEchelons: [] } : c));
    } catch (err) { console.error(err); }
  };

  const handleEchelleChange = async (configId, echelleId) => {
    try {
      const res = await api.get(`/api/gestionEtat/echelons/${echelleId}`);
      setSntlData(prev => prev.map(c => c.id === configId ? { ...c, echelle: echelleId, echelon: '', availableEchelons: res.data } : c));
    } catch (err) { console.error(err); }
  };

  const addSntlConfig = () => {
    const newConfig = { id: Date.now(), label: "Nouvelle Cotisation SNTL", valeur: 0, type_montant: "fixe", categorie_cible: "tous", Post_id: "", grade_id: "", echelle: "", echelon: "", is_active: true, isLocked: false, availableGrades: [], availableEchelles: [], availableEchelons: [] };
    setSntlData([...sntlData, newConfig]);
  };

  const handleDelete = async (id) => {
    if (typeof id === 'number' && id > 1000000000) { setSntlData(sntlData.filter(item => item.id !== id)); return; }
    if (window.confirm("Voulez-vous vraiment supprimer définitivement ce paramètre ?")) {
      try {
        await api.delete(`/api/sntl/configs/${id}`);
        setSntlData(sntlData.filter(item => item.id !== id));
        showNotification("Configuration supprimée", "success");
      } catch { showNotification("Erreur lors de la suppression", "error"); }
    }
  };

  const toggleLock   = (id) => setSntlData(sntlData.map(item => item.id === id ? { ...item, isLocked: !item.isLocked } : item));
  const toggleActive = (id) => setSntlData(sntlData.map(item => item.id === id ? { ...item, is_active: !item.is_active } : item));

  const handleSave = async () => {
    if (sntlData.length === 0) { showNotification("Veuillez ajouter au moins une configuration", "warning"); return; }
    for (const config of sntlData) {
      if (config.valeur < 0) { showNotification(`⚠️ La valeur "${config.label}" ne peut pas être négative`, "warning"); return; }
      if (config.type_montant === 'pourcentage' && config.valeur > 100) { showNotification(`⚠️ Le pourcentage "${config.label}" ne peut pas dépasser 100%`, "warning"); return; }
    }
    if (!selectedYearId) { showNotification("Année non valide", "error"); return; }
    setLoading(true);
    try {
      const payload = sntlData.map(item => {
        const isSpec = item.categorie_cible === 'cadres';
        return { label: item.label, valeur: item.valeur, type_montant: item.type_montant, categorie_cible: item.categorie_cible, Post_id: isSpec ? (item.Post_id || null) : null, grade_id: isSpec ? (item.grade_id || null) : null, echelle_id: isSpec ? (item.echelle || null) : null, echelon_id: isSpec ? (item.echelon || null) : null, is_active: item.is_active ? 1 : 0 };
      });
      await api.post('/api/sntl/save', { salary_year_id: selectedYearId, configs: payload });
      showNotification("Enregistré avec succès !", "success");
      fetchSntlData();
    } catch { showNotification("Erreur lors de l'enregistrement", "error"); }
    finally { setLoading(false); }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const dateGen = new Date().toLocaleDateString();
      doc.setFontSize(18); doc.setTextColor(0, 51, 102);
      doc.text("PARAMÉTRAGE ASSURANCE SNTL", 14, 22);
      doc.setFontSize(11); doc.setTextColor(100);
      doc.text(`Année de référence : ${selectedYear}`, 14, 30);
      doc.text(`Date de génération : ${dateGen}`, 14, 35);
      const tableColumn = ["Libellé", "Valeur", "Cible", "Détails Hiérarchiques", "Statut"];
      const tableRows = [];
      sntlData.forEach(item => {
        const cible = item.categorie_cible === 'tous' ? 'Tous les agents' : 'Spécifique';
        let details = "-";
        if (item.categorie_cible === 'cadres') {
          const postName = posts.find(p => p.id == item.Post_id)?.name || '';
          const gradeName = item.availableGrades?.find(g => g.id == item.grade_id)?.name || '';
          details = `${postName}${gradeName ? ' > ' + gradeName : ''}`;
        }
        tableRows.push([item.label, `${item.valeur} ${item.type_montant === 'fixe' ? 'DH' : '%'}`, cible, details, item.is_active ? "Actif" : "Inactif"]);
      });
      autoTable(doc, { head: [tableColumn], body: tableRows, startY: 45, styles: { fontSize: 9 }, headStyles: { fillColor: [0, 51, 102] } });
      doc.save(`SNTL_Parametrage_${selectedYear}.pdf`);
      showNotification("PDF généré", "success");
    } catch (error) { console.error(error); }
  };

  const activeCount   = sntlData.filter(c => c.is_active).length;
  const inactiveCount = sntlData.length - activeCount;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bg}`}>
      {/* Top accent stripe */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-600 to-transparent opacity-70" />

      <div className="w-full mx-auto  py-6 space-y-6">

        {/* ══════════════════════════════════
            HEADER
        ══════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            <button
              onClick={handleGoBack}
              className={`mt-0.5 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${cardBorder} ${card} shadow-sm hover:border-blue-500/40 transition-all cursor-pointer`}
            >
              <ArrowLeft size={18} className={textSub} />
            </button>
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className={`text-2xl font-bold tracking-tight ${text}`}>Paramétrage Assurance SNTL</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-600/20 uppercase tracking-widest">
                  {selectedYear}
                </span>
              </div>
              <p className={`text-sm ${textSub}`}>Gestion des retenues spécifiques · Cotisations & Assurances</p>
            </div>
          </div>
          <button
            onClick={exportToPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border ${cardBorder} ${card} text-sm font-semibold shadow-sm hover:border-rose-400/50 transition-all cursor-pointer ${textSub}`}
          >
            <FileDown size={15} className="text-rose-500" />
            Exporter PDF
          </button>
        </div>
        {/* ══════════════════════════════════
            TOOLBAR
        ══════════════════════════════════ */}
        <div className={`${card} border ${cardBorder} rounded-2xl p-4 shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">

              {/* Year picker */}
              <div className="relative" ref={yearRef}>
                <button
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  className={`h-10 px-4 rounded-xl border ${cardBorder} ${surface} text-sm font-semibold flex items-center gap-3 min-w-[150px] transition-all cursor-pointer hover:border-blue-500/50 ${text}`}
                >
                  <span className="truncate">{selectedYear || 'Année'}</span>
                  <ChevronDown size={15} className={`text-blue-400 transition-transform duration-200 flex-shrink-0 ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                {isYearOpen && (
                  <div className={`absolute top-full left-0 mt-2 w-44 rounded-xl border ${cardBorder} ${card} z-50 shadow-2xl overflow-hidden`}
                       style={{ boxShadow: dm ? '0 20px 50px rgba(0,0,0,0.6)' : '0 20px 50px rgba(0,0,0,0.10)' }}>
                    {availableYears.map((y) => (
                      <div
                        key={y.id}
                        onClick={() => handleYearChange(y.year, y.id)}
                        className={`px-4 py-2.5 cursor-pointer text-sm font-medium transition-colors ${selectedYear === y.year ? (dm ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-700') : `${text} ${dm ? 'hover:bg-[#252525]' : 'hover:bg-slate-50'}`}`}
                      >
                        {selectedYear === y.year && <span className="mr-1.5">✓</span>}{y.year}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={addSntlConfig}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-all shadow-lg shadow-blue-700/20 cursor-pointer active:scale-95"
              >
                <Plus size={15} /> Nouveau paramètre
              </button>
            </div>

            {fetching && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <Loader2 className="animate-spin" size={16} />
                <span className={`text-xs font-medium ${textSub}`}>Chargement…</span>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════
            CONFIGS LIST
        ══════════════════════════════════ */}
        <div className="space-y-4">
          {sntlData.length === 0 && !fetching ? (
            <div className={`${card} border-2 border-dashed ${cardBorder} rounded-2xl p-16 flex flex-col items-center gap-4 text-center`}>
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center ${surface}`}>
                <Layout size={36} className={textMuted} />
              </div>
              <div>
                <p className={`text-lg font-bold ${text} mb-1`}>Aucun paramétrage trouvé</p>
                <p className={`text-sm ${textSub}`}>Commencez par ajouter une configuration SNTL</p>
              </div>
              <button onClick={addSntlConfig} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-semibold text-sm transition-all cursor-pointer shadow-lg">
                <Plus size={16} /> Ajouter une configuration
              </button>
            </div>
          ) : (
            sntlData.map((config, index) => (
              <div
                key={config.id}
                className={`${card} border ${cardBorder} rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${!config.is_active ? 'opacity-55' : ''}`}
              >
                {/* ── Card header ── */}
                <div className={`px-5 py-3.5 border-b ${surfaceBorder} ${surface} flex justify-between items-center gap-3`}>
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Numbered badge */}
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${config.is_active ? 'bg-blue-600/20 text-blue-400' : dm ? 'bg-[#333] text-gray-500' : 'bg-slate-200 text-slate-400'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <input
                      disabled={config.isLocked}
                      className={`bg-transparent font-semibold text-sm outline-none min-w-0 flex-1 border-b transition-colors ${config.isLocked ? 'border-transparent cursor-default' : 'border-blue-500 cursor-text'} ${text}`}
                      value={config.label}
                      onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, label: e.target.value} : c))}
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Active toggle pill */}
                    <button
                      onClick={() => toggleActive(config.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all cursor-pointer border ${config.is_active
                        ? (dm ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                        : (dm ? 'bg-[#252525] text-gray-500 border-[#333]' : 'bg-slate-100 text-slate-500 border-slate-200')}`}
                    >
                      {config.is_active ? <Eye size={11}/> : <EyeOff size={11}/>}
                      {config.is_active ? 'Actif' : 'Inactif'}
                    </button>

                    {/* Lock */}
                    <button
                      onClick={() => toggleLock(config.id)}
                      title={config.isLocked ? 'Déverrouiller' : 'Verrouiller'}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${config.isLocked
                        ? `${dm ? 'hover:bg-[#333]' : 'hover:bg-slate-100'} ${textMuted}`
                        : (dm ? 'bg-blue-600/15 text-blue-400' : 'bg-blue-50 text-blue-600')}`}
                    >
                      {config.isLocked ? <Lock size={15}/> : <Unlock size={15}/>}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(config.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${textMuted} ${dm ? 'hover:bg-rose-900/20 hover:text-rose-400' : 'hover:bg-rose-50 hover:text-rose-600'}`}
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>

                {/* ── Card body ── */}
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Libellé */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Libellé</label>
                      <input
                        disabled={config.isLocked}
                        className={`${inputCls} ${config.isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        value={config.label}
                        onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, label: e.target.value} : c))}
                      />
                    </div>

                    {/* Valeur */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Valeur</label>
                      <div className="relative">
                        <input
                          disabled={config.isLocked}
                          type="number"
                          min="0"
                          className={`${inputCls} pr-12 font-bold ${config.isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                          value={config.valeur}
                          onChange={(e) => {
                            const v = validateValeur(e.target.value, config.type_montant, config.label);
                            setSntlData(sntlData.map(c => c.id === config.id ? {...c, valeur: v} : c));
                          }}
                        />
                        <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase ${textMuted}`}>
                          {config.type_montant === 'fixe' ? 'DH' : '%'}
                        </span>
                      </div>
                      {config.type_montant === 'pourcentage' && (
                        <p className={`text-[9px] flex items-center gap-1 ${textMuted}`}>
                          <AlertTriangle size={9} /> Max 100%
                        </p>
                      )}
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Type de montant</label>
                      <select
                        disabled={config.isLocked}
                        className={`${inputCls} ${config.isLocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                        value={config.type_montant}
                        onChange={(e) => {
                          const newType = e.target.value;
                          let val = config.valeur;
                          if (newType === 'pourcentage' && val > 100) { val = 100; showNotification("⚠️ Le pourcentage a été limité à 100%", "warning"); }
                          setSntlData(sntlData.map(c => c.id === config.id ? {...c, type_montant: newType, valeur: val} : c));
                        }}
                      >
                        <option value="fixe">Montant Fixe (DH)</option>
                        <option value="pourcentage">Pourcentage (%)</option>
                      </select>
                    </div>

                    {/* Application segmented control */}
                    <div className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-widest ${textMuted}`}>Application</label>
                      <div className={`flex p-1 rounded-xl border h-11 ${dm ? 'bg-[#252525] border-[#333]' : 'bg-slate-100 border-slate-200'} ${config.isLocked ? 'opacity-60 pointer-events-none' : ''}`}>
                        {[
                          { key: 'tous',   label: 'Tous',      icon: Users },
                          { key: 'cadres', label: 'Spécifier', icon: Search },
                        ].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            onClick={() => setSntlData(sntlData.map(c => c.id === config.id ? {...c, categorie_cible: key} : c))}
                            className={`flex-1 flex items-center justify-center gap-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${config.categorie_cible === key
                              ? (dm ? 'bg-[#1A1A1A] shadow text-blue-400' : 'bg-white shadow text-blue-700')
                              : textMuted}`}
                          >
                            <Icon size={11} /> {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ── Hierarchy selectors (expanded) ── */}
                  {config.categorie_cible === 'cadres' && (
                    <div className={`p-4 rounded-xl border ${dm ? 'border-[#333] bg-blue-950/15' : 'border-blue-100 bg-blue-50/40'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${dm ? 'text-blue-400/60' : 'text-blue-400'}`}>
                        Filtrage hiérarchique <span className="normal-case font-normal">(optionnel)</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          { label: 'Post',    value: config.Post_id  || '', options: posts,                  onChange: (v) => handlePostChange(config.id, v),     disabled: false },
                          { label: 'Grade',   value: config.grade_id || '', options: config.availableGrades, onChange: (v) => handleGradeChange(config.id, v),    disabled: !config.Post_id },
                          { label: 'Échelle', value: config.echelle  || '', options: config.availableEchelles, onChange: (v) => handleEchelleChange(config.id, v), disabled: !config.grade_id, labelFn: (o) => `Échelle ${o.level}` },
                          { label: 'Échelon', value: config.echelon  || '', options: config.availableEchelons, onChange: (v) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, echelon: v} : c)), disabled: !config.echelle, labelFn: (o) => `Échelon ${o.order}` },
                        ].map(({ label, value, options, onChange, disabled, labelFn }) => (
                          <div key={label} className="space-y-1.5">
                            <label className={`text-[10px] font-bold uppercase tracking-widest ${disabled ? textMuted + ' opacity-40' : textMuted}`}>{label}</label>
                            <select
                              className={`${inputCls} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                              value={value}
                              onChange={(e) => onChange(e.target.value)}
                              disabled={disabled}
                            >
                              <option value="">— Tous —</option>
                              {options?.map(o => <option key={o.id} value={o.id}>{labelFn ? labelFn(o) : o.name}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ══════════════════════════════════
            SAVE FOOTER
        ══════════════════════════════════ */}
        {sntlData.length > 0 && (
          <div className={`sticky bottom-6 flex justify-end pt-2`}>
            <button
              onClick={handleSave}
              disabled={loading}
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-2xl bg-[#003366] hover:bg-[#002244] text-white text-sm font-bold transition-all active:scale-95 shadow-xl shadow-blue-950/40 disabled:opacity-50 cursor-pointer"
            >
              {loading ? <Loader2 className="animate-spin" size={17} /> : <Save size={17} />}
              {loading ? 'Enregistrement…' : 'Sauvegarder le paramétrage SNTL'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default GestionSNTL;