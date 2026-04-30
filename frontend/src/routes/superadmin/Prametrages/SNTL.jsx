import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, Plus, Loader2, Layout, 
  FileText, Trash2, Save, Truck, Users, Settings2, Search,
  Lock, Unlock, Eye, EyeOff, FileDown
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig'; 
import { useNotification } from '../../../context/NotificationContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GestionSNTL = () => {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const { showNotification } = useNotification();
  const [availableYears, setAvailableYears] = useState([]);
  
  const [sntlData, setSntlData] = useState([]);
  const [roles, setRoles] = useState([]);

  // 1. Charger les années disponibles au montage
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
        if (response.data.length > 0) {
          // On prend la dernière année par défaut
          const lastYear = response.data[response.data.length - 1];
          setSelectedYear(lastYear.year);
        }
      } catch (error) {
        showNotification("Erreur lors du chargement des années", "error");
      }
    };
    fetchYears();
  }, []);

  // 2. Charger les rôles quand l'année change
  useEffect(() => {
    const fetchRoles = async () => {
      if (!selectedYear || availableYears.length === 0) return;
      try {
        const yearObj = availableYears.find(y => y.year === selectedYear);
        if (yearObj) {
          const res = await api.get(`/api/gestionEtat/roles/${yearObj.id}`);
          setRoles(res.data);
        }
      } catch (err) { 
        console.error("Erreur roles", err); 
      }
    };
    fetchRoles();
  }, [selectedYear, availableYears]);

  // 3. Fonction pour charger les données (Définie avant l'usage dans useEffect)
  const fetchSntlData = async () => {
    if (!selectedYear || availableYears.length === 0) return;
    
    const yearObj = availableYears.find(y => y.year === selectedYear);
    if (!yearObj) return;

    setFetching(true);
    try {
      const response = await api.get(`/api/sntl/configs?year_id=${yearObj.id}`);
      
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

  // 4. Déclencheur automatique de chargement (Le FIX pour 2026)
  useEffect(() => {
    if (availableYears.length > 0) {
      fetchSntlData();
    }
  }, [selectedYear, availableYears]);

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

    const yearObj = availableYears.find(y => y.year === selectedYear);
    if (!yearObj) {
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
        salary_year_id: yearObj.id, 
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

  const stats = [
    { label: "Total Config", value: sntlData.length, icon: <Truck size={20}/>, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Année Active", value: selectedYear, icon: <Settings2 size={20}/>, bg: "bg-slate-50", color: "text-slate-600" },
    { label: "Status", value: `${sntlData.filter(d => d.is_active).length} Actifs`, icon: <Users size={20}/>, bg: "bg-emerald-50", color: "text-emerald-600" },
  ];

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
    <div className="min-h-screen bg-[#f1f5f9] p-6 font-sans antialiased text-slate-900 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Paramétrage Assurance SNTL</h1>
            <p className="text-slate-500 text-sm italic">Gestion des retenues spécifiques pour l'année {selectedYear}</p>
          </div>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-50 transition-all shadow-sm uppercase"
          >
            <FileDown size={16} className="text-rose-600" /> Exporter PDF
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-lg flex items-center justify-center`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-xl font-bold text-slate-800">{stat.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-4 tracking-tight">Année</span>
              <div className="relative flex items-center">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-xl font-bold text-[#003366] outline-none cursor-pointer appearance-none pr-6 z-10">
                  {availableYears.map(y => (
                    <option key={y.id} value={y.year}>{y.year}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-0 text-slate-400 pointer-events-none" />
              </div>
            </div>
            
            <button 
              onClick={addSntlConfig}
              className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-md uppercase"
            >
              <Plus size={16} /> Nouveau Paramètre
            </button>
          </div>
          {fetching && <Loader2 className="animate-spin text-blue-600" size={20} />}
        </div>

        {/* Main List */}
        <div className="space-y-6">
          {sntlData.length === 0 && !fetching ? (
            <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-slate-50 p-6 rounded-full mb-6"><Layout size={48} className="text-slate-300" /></div>
              <h2 className="text-xl font-bold text-slate-700 mb-2">Aucun paramétrage trouvé</h2>
              <button onClick={addSntlConfig} className="bg-[#003366] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#002244] transition-all">
                <Plus size={20} /> Ajouter une configuration
              </button>
            </div>
          ) : (
            sntlData.map((config) => (
              <div key={config.id} className={`bg-white rounded-2xl border ${!config.is_active ? 'opacity-60 grayscale-[0.5]' : ''} border-slate-200 shadow-sm overflow-hidden transition-all`}>
                
                {/* Item Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`${config.is_active ? 'bg-[#003366]' : 'bg-slate-400'} p-1.5 rounded text-white`}><FileText size={16}/></div>
                    <input 
                      disabled={config.isLocked}
                      className={`bg-transparent font-bold text-slate-700 outline-none border-b ${config.isLocked ? 'border-transparent' : 'border-blue-500'}`}
                      value={config.label}
                      onChange={(e) => {
                        setSntlData(sntlData.map(c => c.id === config.id ? {...c, label: e.target.value} : c));
                      }}
                    />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleActive(config.id)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold transition-all ${config.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}
                    >
                      {config.is_active ? <Eye size={14}/> : <EyeOff size={14}/>}
                      {config.is_active ? 'ACTIF' : 'INACTIF'}
                    </button>

                    <button 
                      onClick={() => toggleLock(config.id)}
                      className={`p-2 rounded-lg transition-all ${config.isLocked ? 'text-slate-400 hover:text-blue-600' : 'bg-blue-50 text-blue-600'}`}
                    >
                      {config.isLocked ? <Lock size={18}/> : <Unlock size={18}/>}
                    </button>

                    <button onClick={() => handleDelete(config.id)} className="text-slate-300 hover:text-rose-500 p-2 transition-colors">
                      <Trash2 size={18}/>
                    </button>
                  </div>
                </div>

                {/* Item Content */}
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Libellé / Nom</label>
                      <input 
                        disabled={config.isLocked}
                        className={`w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm focus:bg-white outline-none ${config.isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        value={config.label}
                        onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, label: e.target.value} : c))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Valeur</label>
                      <div className="relative">
                        <input 
                          disabled={config.isLocked}
                          type="number"
                          className={`w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm font-bold text-indigo-600 focus:bg-white outline-none ${config.isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                          value={config.valeur}
                          onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, valeur: e.target.value} : c))}
                        />
                        <span className="absolute right-3 top-3 text-slate-400 font-bold text-xs uppercase">
                          {config.type_montant === 'fixe' ? 'DH' : '%'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Type de Montant</label>
                      <select 
                        disabled={config.isLocked}
                        className={`w-full bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm font-semibold outline-none ${config.isLocked ? 'cursor-not-allowed opacity-70' : ''}`}
                        value={config.type_montant}
                        onChange={(e) => setSntlData(sntlData.map(c => c.id === config.id ? {...c, type_montant: e.target.value} : c))}
                      >
                        <option value="fixe">Montant Fixe (DH)</option>
                        <option value="pourcentage">Pourcentage (%)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase">Application</label>
                      <div className={`flex bg-slate-50 p-1 rounded-lg border border-slate-100 h-[46px] ${config.isLocked ? 'opacity-70 pointer-events-none' : ''}`}>
                        <button 
                          onClick={() => setSntlData(sntlData.map(c => c.id === config.id ? {...c, categorie_cible: 'tous'} : c))}
                          className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-bold rounded-md transition-all ${config.categorie_cible === 'tous' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                        >
                          <Users size={14} /> TOUS
                        </button>
                        <button 
                          onClick={() => setSntlData(sntlData.map(c => c.id === config.id ? {...c, categorie_cible: 'cadres'} : c))}
                          className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-bold rounded-md transition-all ${config.categorie_cible === 'cadres' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                        >
                          <Search size={14} /> SPECIFIER
                        </button>
                      </div>
                    </div>
                  </div>

                  {config.categorie_cible === 'cadres' && (
                    <div className="pt-4 border-t border-slate-100 bg-blue-50/30 p-4 rounded-xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">Role</label>
                            <select 
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none"
                              value={config.role_id || ''}
                              onChange={(e) => handleRoleChange(config.id, e.target.value)}>
                              <option value="">Sélectionner Role (Optionnel)</option>
                              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">Grade</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none"
                            value={config.grade_id || ''}
                            onChange={(e) => handleGradeChange(config.id, e.target.value)}
                            disabled={!config.role_id}
                          >
                            <option value="">Sélectionner Grade</option>
                            {config.availableGrades?.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">Échelle</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none"
                            value={config.echelle || ''}
                            onChange={(e) => handleEchelleChange(config.id, e.target.value)}
                            disabled={!config.grade_id}
                          >
                            <option value="">Sélectionner Échelle</option>
                            {config.availableEchelles?.map(e => <option key={e.id} value={e.id}>Échelle {e.level}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase italic">Échelon</label>
                          <select 
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-sm outline-none"
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
              className="flex items-center gap-3 bg-[#003366] text-white px-10 py-3 rounded-xl text-sm font-black hover:bg-[#002244] shadow-lg disabled:opacity-50 transition-all active:scale-95">
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