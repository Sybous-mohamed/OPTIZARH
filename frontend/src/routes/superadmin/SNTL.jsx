import React, { useState, useEffect, useRef } from 'react';
import { 
  FileDown, Loader2, Truck, Search, 
  ShieldCheck, Calendar, Filter, Users,
  ChevronDown, ArrowRight, Info, Settings2, ArrowLeft
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig'; 
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

const ConsultationSNTL = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [sntlData, setSntlData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetching, setFetching] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  // Dark mode classes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#f1f5f9]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-slate-900';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-slate-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-slate-200';
  const inputClass = darkMode 
    ? 'w-full bg-[#252525] border-[#333] text-white placeholder-gray-500 focus:ring-2 focus:ring-indigo-500'
    : 'w-full bg-slate-50 border-slate-200 text-slate-700 focus:ring-2 focus:ring-indigo-500';
  const selectClass = darkMode 
    ? 'bg-[#252525] border-[#333] text-white' 
    : 'bg-gray-50 border-gray-200 text-gray-800';

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

  // Récupérer les années qui ont des données SNTL
  useEffect(() => {
    const fetchYearsWithData = async () => {
      try {
        const response = await api.get('/api/sntl/years-with-data');
        const yearsWithData = response.data || [];
        
        setAvailableYears(yearsWithData);
        
        const savedYear = localStorage.getItem('consultation_sntl_selected_year');
        const savedYearId = localStorage.getItem('consultation_sntl_selected_year_id');
        
        if (savedYear && yearsWithData.some(y => y.year == savedYear)) {
          setSelectedYear(savedYear);
          setSelectedYearId(savedYearId ? parseInt(savedYearId) : null);
        } else if (yearsWithData.length > 0) {
          const lastYear = yearsWithData[yearsWithData.length - 1];
          setSelectedYear(lastYear.year);
          setSelectedYearId(lastYear.id);
          localStorage.setItem('consultation_sntl_selected_year', lastYear.year);
          localStorage.setItem('consultation_sntl_selected_year_id', lastYear.id);
        }
        setInitialLoading(false);
      } catch (err) { 
        console.error(err);
        showNotification(" Erreur chargement des années", "error");
        setInitialLoading(false);
      }
    };
    fetchYearsWithData();
  }, []);

  const handleYearChange = (yearValue, yearId) => {
    setSelectedYear(yearValue);
    setSelectedYearId(yearId);
    setIsYearOpen(false);
    localStorage.setItem('consultation_sntl_selected_year', yearValue);
    localStorage.setItem('consultation_sntl_selected_year_id', yearId);
    showNotification(` Année ${yearValue} sélectionnée`, "success");
  };

  // Charger les données SNTL
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedYearId) return;

      setFetching(true);
      try {
        const res = await api.get(`/api/sntl/configs?year_id=${selectedYearId}`);
        setSntlData(res.data || []);
      } catch (err) { 
        console.error(err);
        setSntlData([]);
      } finally { 
        setFetching(false); 
      }
    };
    fetchData();
  }, [selectedYearId]);

  // Filter Logic
  const filteredData = sntlData.filter(item => 
    item.label?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculate
  const stats = {
    totalConfigs: sntlData.length,
    activeConfigs: sntlData.filter(d => d.is_active === 1).length,
    specificConfigs: sntlData.filter(d => d.categorie_cible === 'cadres').length
  };

  const exportPDF = () => {
    if (filteredData.length === 0) {
      showNotification(" Aucune donnée à exporter", "error");
      return;
    }
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Récapitulatif SNTL - ${selectedYear}`, 14, 20);
    
    const rows = filteredData.map(item => [
      item.label,
      `${item.valeur} ${item.type_montant === 'fixe' ? 'DH' : '%'}`,
      item.categorie_cible === 'tous' ? 'Tous les agents' : 'Cible spécifique',
      item.is_active ? 'Actif' : 'Inactif'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Désignation', 'Valeur', 'Application', 'Statut']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });
    doc.save(`Consultation_SNTL_${selectedYear}.pdf`);
    showNotification("📄 PDF exporté avec succès", "success");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  if (initialLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <p className={`text-sm ${textMutedClass}`}>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 p-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header avec bouton retour */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-white hover:bg-gray-100 border border-gray-200'} hover:scale-105 shadow-sm`}
              title="Retour"
            >
              <ArrowLeft size={20} className={darkMode ? 'text-gray-400' : 'text-slate-600'} />
            </button>
            <div>
              <h1 className={`text-2xl font-black flex items-center gap-3 uppercase tracking-tight ${textClass}`}>
                <Truck className="text-[#003366]" size={32} />
                Consultation Assurance SNTL
              </h1>
              <p className={`text-sm italic ${textMutedClass}`}>Visualisation des paramètres de retenue SNTL</p>
            </div>
          </div>

          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all uppercase shadow-md cursor-pointer"
          >
            <FileDown size={16} /> Télécharger Synthèse
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className={`${cardClass} p-6 rounded-2xl border ${borderClass} shadow-sm flex items-center justify-between group`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textMutedClass}`}>Configurations</p>
              <h3 className={`text-3xl font-black ${textClass}`}>{stats.totalConfigs}</h3>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-[#252525] text-gray-400' : 'bg-slate-50 text-slate-400'}`}>
              <ShieldCheck size={24} />
            </div>
          </div>

          <div className={`${cardClass} p-6 rounded-2xl border ${borderClass} shadow-sm flex items-center justify-between group`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textMutedClass}`}>Statut Actif</p>
              <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats.activeConfigs}</h3>
            </div>
            <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center text-emerald-600">
              <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
            </div>
          </div>

          <div className={`${cardClass} p-6 rounded-2xl border ${borderClass} shadow-sm flex items-center justify-between group`}>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${textMutedClass}`}>Ciblages Cadres</p>
              <h3 className="text-3xl font-black text-blue-800 dark:text-blue-400">{stats.specificConfigs}</h3>
            </div>
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Users size={24} />
            </div>
          </div>
        </div>

        {/* Search & Year Selector Bar */}
        <div className={`${cardClass} rounded-2xl border ${borderClass} p-4 mb-6 shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              
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
                    {availableYears.length === 0 ? (
                      <div className={`px-4 py-2.5 text-sm ${textMutedClass}`}>Aucune année disponible</div>
                    ) : (
                      availableYears.map((y) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
              
              <div className="relative flex-1 min-w-[200px]">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} size={18} />
                <input 
                  type="text"
                  placeholder="Rechercher une retenue..."
                  className={`w-full rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-medium border ${inputClass}`}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            {fetching && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          </div>
        </div>

        {/* Content Table / List */}
        {fetching ? (
          <div className={`${cardClass} rounded-3xl p-20 flex flex-col items-center border ${borderClass}`}>
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
            <p className={`font-bold italic tracking-tight ${textMutedClass}`}>Récupération des données SNTL...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.map((item) => (
              <div key={item.id} className={`${cardClass} rounded-2xl border ${borderClass} shadow-sm hover:shadow-md transition-all overflow-hidden ${item.is_active === 0 ? 'opacity-70' : ''}`}>
                <div className="p-5 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`h-2 w-2 rounded-full ${item.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <h4 className={`font-black uppercase text-sm tracking-tight ${textClass}`}>{item.label}</h4>
                    </div>
                    
                    <div className="flex items-center gap-6 mt-4">
                      <div>
                        <p className={`text-[9px] font-bold uppercase mb-1 ${textMutedClass}`}>Valeur Actuelle</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-[#003366] dark:text-indigo-400">
                            {item.valeur}
                          </span>
                          <span className={`text-xs font-bold ${textMutedClass}`}>
                            {item.type_montant === 'fixe' ? 'DH' : '%'}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`h-10 w-px ${darkMode ? 'bg-[#2A2A2A]' : 'bg-slate-100'}`} />
                      
                      <div>
                        <p className={`text-[9px] font-bold uppercase mb-1 ${textMutedClass}`}>Application</p>
                        <div className="flex items-center gap-2 font-bold text-xs uppercase">
                          {item.categorie_cible === 'tous' ? (
                            <> <Users size={14} className="text-blue-500" /> <span className={textClass}>Tous les agents</span> </>
                          ) : (
                            <> <Filter size={14} className="text-orange-500" /> <span className={textClass}>Spécifique (Cadres)</span> </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black border ${item.is_active ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'}`}>
                    {item.is_active ? 'ACTIF' : 'INACTIF'}
                  </div>
                </div>

                {item.categorie_cible === 'cadres' && (
                  <div className={`px-5 py-3 border-t flex items-center gap-2 overflow-hidden ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-slate-50 border-slate-100'}`}>
                    <Info size={14} className="text-blue-400 shrink-0" />
                    <div className="flex items-center gap-2 text-[10px] font-bold whitespace-nowrap flex-wrap">
                      <span className={textMutedClass}>Rôle ID: {item.role_id || '-'}</span>
                      <ArrowRight size={10} className={textMutedClass} />
                      <span className={textMutedClass}>Grade: {item.grade_id || '-'}</span>
                      <ArrowRight size={10} className={textMutedClass} />
                      <span className={textMutedClass}>Échelle: {item.echelle_id || '-'}</span>
                      <ArrowRight size={10} className={textMutedClass} />
                      <span className={textMutedClass}>Échelon: {item.echelon_id || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!fetching && filteredData.length === 0 && (
          <div className={`text-center py-24 ${cardClass} rounded-3xl border-2 border-dashed ${borderClass}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border ${darkMode ? 'bg-[#252525] border-[#333]' : 'bg-slate-50 border-slate-100'}`}>
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className={`font-black uppercase text-sm tracking-widest ${textMutedClass}`}>Aucune donnée trouvée</h3>
            <p className={`text-xs mt-2 italic font-medium ${textMutedClass}`}>Réessayez avec un autre filtre ou une autre année.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationSNTL;