import React, { useState, useEffect, useRef } from 'react';
import { 
  Star, Download, Search, FileText, Loader2, TrendingUp, Wallet, Shield, Settings2, ArrowLeft, ChevronDown
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

const ConsulterRCAR = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [rcarData, setRcarData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  // Dark mode classes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const cardHeaderClass = darkMode ? 'bg-gradient-to-r from-indigo-700 to-indigo-600' : 'bg-gradient-to-r from-indigo-500 to-indigo-400';
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
  const dangerButtonClass = `${buttonClass} bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-md`;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const stats = React.useMemo(() => {
    if (!rcarData || rcarData.length === 0) return { totalTaux: "0.00", maxPlafond: 0, totalTypes: 0 };
    
    let totalTaux = 0;
    let maxPlafond = 0;
    
    rcarData.forEach(type => {
      if (type.details) {
        type.details.forEach(d => {
          totalTaux += parseFloat(d.percentage || 0);
          const p = parseFloat(d.plafond || 0);
          if (p > maxPlafond) maxPlafond = p;
        });
      }
    });

    return {
      totalTaux: totalTaux.toFixed(2),
      maxPlafond: maxPlafond,
      totalTypes: rcarData.length
    };
  }, [rcarData]);

  // Récupérer uniquement les années qui ont des données RCAR
  useEffect(() => {
    const fetchYears = async () => {
      try {
        // Utiliser le nouveau endpoint qui retourne uniquement les années avec données
        const response = await api.get('/api/rcar/years-with-data');
        const years = response.data || [];
        setAvailableYears(years);
        
        const savedYear = localStorage.getItem('consulter_rcar_selected_year');
        if (savedYear && years.some(y => y.year == savedYear)) {
          setSelectedYear(savedYear);
        } else if (years.length > 0) {
          const lastYear = years[years.length - 1];
          setSelectedYear(lastYear.year);
          localStorage.setItem('consulter_rcar_selected_year', lastYear.year);
        }
      } catch (error) { 
        console.error(error);
        showNotification(" Erreur chargement des années", "error");
      }
    };
    fetchYears();
  }, []);

  // Récupérer la configuration RCAR
  useEffect(() => {
    const fetchConfig = async () => {
      if (!selectedYear) return;
      setLoading(true);
      try {
        const response = await api.get(`/api/rcar/config/${selectedYear}`);
        setRcarData(response.data?.rcar_types || []);
      } catch (error) { 
        console.error(error);
        setRcarData([]);
      } finally { 
        setLoading(false);
        setInitialLoading(false);
      }
    };
    fetchConfig();
  }, [selectedYear]);

  const handleYearChange = (yearValue) => {
    setSelectedYear(yearValue);
    setIsYearOpen(false);
    localStorage.setItem('consulter_rcar_selected_year', yearValue);
    showNotification(` Année ${yearValue} sélectionnée`, "success");
  };

  const exportToPDF = () => {
    if (rcarData.length === 0) {
      showNotification(" Aucune donnée à exporter", "error");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Consultation RCAR - Année ${selectedYear}`, 14, 22);
    let finalY = 30;

    rcarData.forEach((type) => {
      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 51, 102);
      doc.text(type.label.toUpperCase(), 14, finalY + 10);
      
      autoTable(doc, {
        startY: finalY + 15,
        head: [['Désignation', 'Plafond (DH)', 'Taux (%)']],
        body: type.details.map(d => [
          d.designation, 
          d.plafond ? `${parseFloat(d.plafond).toLocaleString()} DH` : '---', 
          `${d.percentage} %`
        ]),
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 10 }
      });
      finalY = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Consultation_RCAR_${selectedYear}.pdf`);
    showNotification("📄 PDF exporté avec succès", "success");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const filteredData = rcarData.filter(t => t.label.toLowerCase().includes(searchTerm.toLowerCase()));

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
    <div className={`min-h-screen transition-colors duration-300 p-3 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Settings2 size={24} className="text-indigo-500" />
              <h1 className={`text-xl font-bold ${textClass}`}>Consultation RCAR</h1>
            </div>
          </div>
          <p className={`text-sm ${textMutedClass} mt-1 ml-12`}>
            Affichage des taux et plafonds par année
          </p>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className={`${cardClass} p-5 rounded-2xl border ${borderClass} shadow-sm flex items-center gap-5`}>
            <div className={`h-12 w-12 ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'} rounded-xl flex items-center justify-center shrink-0`}>
              <TrendingUp size={24} className="text-indigo-600" />
            </div>
            <div>
              <p className={`${textMutedClass} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Somme des Taux</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${textClass}`}>{stats.totalTaux}</span>
                <span className={`text-sm font-semibold ${textMutedClass}`}>%</span>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5 rounded-2xl border ${borderClass} shadow-sm flex items-center gap-5`}>
            <div className={`h-12 w-12 ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl flex items-center justify-center shrink-0`}>
              <Wallet size={24} className="text-blue-600" />
            </div>
            <div>
              <p className={`${textMutedClass} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Plafond Maximal</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${textClass}`}>
                  {stats.maxPlafond > 0 ? stats.maxPlafond.toLocaleString('fr-FR') : "0"}
                </span>
                <span className={`text-sm font-semibold ${textMutedClass}`}>DH</span>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5 rounded-2xl border ${borderClass} shadow-sm flex items-center gap-5`}>
            <div className={`h-12 w-12 ${darkMode ? 'bg-rose-900/30' : 'bg-rose-50'} rounded-xl flex items-center justify-center shrink-0`}>
              <Shield size={24} className="text-rose-600" />
            </div>
            <div>
              <p className={`${textMutedClass} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Organismes Actifs</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${textClass}`}>{stats.totalTypes}</span>
                <span className={`text-sm font-semibold ${textMutedClass} ml-1`}>Entités</span>
              </div>
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className={`${cardClass} rounded-2xl border ${borderClass} p-4 mb-6 shadow-sm`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative" ref={yearRef}>
              <button 
                onClick={() => setIsYearOpen(!isYearOpen)}
                className={`h-10 px-4 rounded-xl font-medium outline-none cursor-pointer min-w-[140px] transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
              >
                <span className="truncate">{selectedYear || 'Sélectionner année'}</span>
                <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isYearOpen && (
                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${cardClass} z-50 max-h-60 overflow-y-auto shadow-xl`}>
                  {availableYears.map((y) => (
                    <div 
                      key={y.id}
                      onClick={() => handleYearChange(y.year)}
                      className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${
                        selectedYear === y.year 
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' 
                          : textClass
                      }`}
                    >
                      {y.year}
                    </div>
                  ))}
                  {availableYears.length === 0 && (
                    <div className="px-4 py-2.5 text-sm text-gray-400">
                      Aucune année disponible
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="relative flex-1 min-w-[200px]">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} />
              <input 
                type="text"
                placeholder="Rechercher un organisme..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${inputClass} ${borderClass} focus:ring-2 focus:ring-indigo-500`}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button onClick={exportToPDF} className={`${dangerButtonClass} cursor-pointer`}>
              <Download size={16} /> Exporter PDF
            </button>
            
            {loading && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          </div>
        </div>

        {/* DATA DISPLAY */}
        <div className="space-y-6">
          {filteredData.length === 0 ? (
            <div className={`${cardClass} rounded-2xl border-2 border-dashed ${borderClass} p-12 text-center`}>
              <div className={`p-6 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} mb-4 inline-block`}>
                <FileText size={48} className="text-gray-300" />
              </div>
              <p className={`${textMutedClass} font-medium`}>Aucune donnée trouvée pour cette sélection.</p>
            </div>
          ) : (
            filteredData.map((type) => (
              <div key={type.id} className={`${cardClass} rounded-2xl border ${borderClass} shadow-sm overflow-hidden`}>
                <div className={`${cardHeaderClass} px-5 py-3`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-white" />
                      <h2 className="font-bold text-white uppercase tracking-tight text-sm">{type.label}</h2>
                      {type.is_favorite && <Star size={14} className="text-amber-400" fill="currentColor" />}
                    </div>
                  </div>
                </div>

                <div className="p-4 overflow-x-auto">
                  <table className="w-full min-w-[600px] border-collapse">
                    <thead>
                      <tr className={`border-b ${borderClass}`}>
                        <th className={`text-left py-3 px-2 text-xs font-semibold ${textMutedClass} w-2/5`}>Désignation</th>
                        <th className={`text-center py-3 px-3 text-xs font-semibold ${textMutedClass} w-1/4`}>Plafond (DH)</th>
                        <th className={`text-right py-3 px-3 text-xs font-semibold ${textMutedClass} w-1/4`}>Taux (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {type.details && type.details.map((det, idx) => (
                        <tr key={idx} className={`border-b ${borderClass} last:border-0 hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors`}>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-40"></div>
                              <span className={`text-sm font-medium ${textClass}`}>{det.designation}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-xs font-bold px-3 py-1 rounded-md ${darkMode ? 'bg-[#252525] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                              {det.plafond ? `${parseFloat(det.plafond).toLocaleString('fr-FR')} DH` : 'SANS PLAFOND'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{det.percentage}%</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default ConsulterRCAR;