import React, { useState, useEffect ,useRef } from 'react';
import { 
  Download, Loader2, Building2, ListTree, 
  TrendingUp, Calendar, ShieldCheck, FileText,
  Search, Activity ,ChevronDown 
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';

const ConsultationCotisation = () => {
  const { darkMode } = useTheme();
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [data, setData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [fetching, setFetching] = useState(false);
  const [isYearOpen, setIsYearOpen] = useState(false);
const yearRef = useRef(null);

  // Dark mode classes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#f1f5f9]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-slate-200';
  const headerClass = darkMode ? 'bg-[#252525]' : 'bg-slate-50/50';
  const tableHeaderClass = darkMode ? 'bg-[#1A1A1A]' : 'bg-white';
  const textClass = darkMode ? 'text-gray-100' : 'text-slate-800';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-slate-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-slate-200';
  const inputClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-slate-50 border-slate-200 text-slate-700';
  const selectClass = darkMode ? 'bg-transparent text-indigo-400' : 'bg-transparent text-[#003366]';
  const badgeClass = darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-700';
  const hoverClass = darkMode ? 'hover:bg-[#252525]' : 'hover:bg-slate-50';

  // --- Fetch years that have data ---
  useEffect(() => {
    const fetchYears = async () => {
      try {
        // Utiliser la nouvelle route qui retourne uniquement les années avec data
        const response = await api.get('/api/cotisations/years-with-data');
        setAvailableYears(response.data);
        
        // Sélectionner la première année par défaut si disponible
        if (response.data && response.data.length > 0) {
          setSelectedYear(response.data[0]);
        }
      } catch (err) { 
        console.error(err);
        // Fallback: essayer avec salary-years si la route échoue
        try {
          const fallbackResponse = await api.get('/api/salary-years');
          setAvailableYears(fallbackResponse.data.map(y => y.year || y.annee));
          if (fallbackResponse.data.length > 0) {
            setSelectedYear(fallbackResponse.data[0].year || fallbackResponse.data[0].annee);
          }
        } catch (fallbackErr) {
          console.error(fallbackErr);
        }
      }
    };
    fetchYears();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    const fetchData = async () => {
      setFetching(true);
      try {
        const res = await api.get(`/api/cotisations?year=${selectedYear}`);
        setData(res.data || []);
      } catch (err) { 
        console.error(err);
        setData([]);
      } finally { 
        setFetching(false); 
      }
    };
    fetchData();
  }, [selectedYear]);
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (yearRef.current && !yearRef.current.contains(event.target)) {
      setIsYearOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  // --- Search Logic ---
  const filteredData = data.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Stats Logic ---
  const stats = {
    totalOrganismes: data.length,
    totalRubriques: data.reduce((acc, org) => acc + (org.rubriques?.length || 0), 0),
    maxTaux: data.length > 0 ? Math.max(...data.flatMap(org => org.rubriques?.map(r => parseFloat(r.taux) || 0) || [0])) : 0,
  };

  // --- Export PDF ---
  const exportPDF = () => {
    if (filteredData.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Rapport des Cotisations - Année ${selectedYear}`, 14, 20);
    
    let currentY = 30;
    filteredData.forEach((org) => {
      if (currentY > 250) { doc.addPage(); currentY = 20; }
      doc.setFontSize(12);
      doc.setTextColor(40);
      doc.text(org.name, 14, currentY);
      
      const rows = org.rubriques.map(r => [
        r.label, 
        r.plafond ? `${parseFloat(r.plafond).toLocaleString()} DH` : 'N/A', 
        `${r.taux}%`
      ]);

      autoTable(doc, {
        startY: currentY + 2,
        head: [['Désignation', 'Plafond', 'Taux']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        margin: { left: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`Synthese_Cotisations_${selectedYear}.pdf`);
  };

  // Message si aucune année n'a de données
  if (availableYears.length === 0 && !fetching) {
    return (
      <div className={`min-h-screen transition-colors duration-300 flex items-center justify-center ${bgClass}`}>
        <div className={`${cardClass} rounded-2xl p-8 text-center max-w-md border ${borderClass}`}>
          <ShieldCheck size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className={`text-xl font-bold ${textClass} mb-2`}>Aucune donnée disponible</h2>
          <p className={`${textMutedClass} mb-4`}>
            Aucune cotisation n'a été configurée pour l'instant.
          </p>
          <p className={`text-sm ${textMutedClass}`}>
            Veuillez d'abord configurer des cotisations dans l'interface d'administration.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 p-4 md:p-8 font-sans ${bgClass}`}>
      <div className="max-w-6xl mx-auto">
        
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className={`text-2xl font-black ${textClass} flex items-center gap-3`}>
              <ShieldCheck className="text-blue-600" size={32} />
              Consultation des Paramètres
            </h1>
            <p className={`${textMutedClass} text-sm italic`}>Système de gestion des cotisations sociales</p>
          </div>

          <button 
            onClick={exportPDF}
            disabled={data.length === 0}
            className={`flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white rounded-xl text-xs font-bold transition-all uppercase shadow-md shadow-rose-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Download size={16} /> Exporter PDF
          </button>
        </div>

        {/* TOP STATS BOXES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className={`${cardClass} p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={24} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className={`${textMutedClass} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Organismes</p>
                <h3 className={`text-2xl font-bold ${textClass}`}>{stats.totalOrganismes}</h3>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center shrink-0">
                <ListTree size={24} className="text-[#003366] dark:text-blue-400" />
              </div>
              <div>
                <p className={`${textMutedClass} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Total Rubriques</p>
                <h3 className={`text-2xl font-bold ${textClass}`}>{stats.totalRubriques}</h3>
              </div>
            </div>
          </div>

          <div className={`${cardClass} p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md`}>
            <div className="flex items-center gap-5">
              <div className="h-12 w-12 bg-rose-100 dark:bg-rose-900/30 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp size={24} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <p className={`${textMutedClass} text-[10px] font-bold uppercase tracking-widest mb-0.5`}>Taux Maximal</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${textClass}`}>{stats.maxTaux}</span>
                  <span className={`text-sm font-semibold ${textMutedClass}`}>%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className={`${cardClass} p-4 rounded-2xl border mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm`}>
          <div className="flex items-center gap-4 flex-1 flex-wrap">
            <div className="relative" ref={yearRef}>
                <button 
                    onClick={() => setIsYearOpen(!isYearOpen)}
                    className={`h-10 px-4 rounded-xl font-medium outline-none cursor-pointer min-w-[140px] transition-all ${darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} border ${borderClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
                >
                    <span className="truncate">{selectedYear || 'Sélectionner année'}</span>
                    <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isYearOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200'} z-50 max-h-60 overflow-y-auto shadow-xl animate-fadeIn`}>
                    {availableYears.map((year) => (
                        <div 
                        key={year}
                        onClick={() => {
                            setSelectedYear(year);
                            setIsYearOpen(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${selectedYear === year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                        {year}
                        </div>
                    ))}
                    </div>
                )}
            </div>
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} size={18} />
              <input 
                type="text"
                placeholder="Rechercher un organisme..."
                className={`w-full rounded-lg py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${inputClass} border ${borderClass}`}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          {fetching && <Loader2 className="animate-spin text-indigo-500" size={20} />}
        </div>

        {/* DATA DISPLAY */}
        {fetching ? (
          <div className={`flex flex-col items-center justify-center py-20 ${cardClass} rounded-3xl border shadow-sm`}>
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={40} />
            <p className={`${textMutedClass} font-medium italic`}>Traitement des paramètres en cours...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className={`text-center py-20 ${cardClass} rounded-3xl border-2 border-dashed ${borderClass}`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-[#252525]' : 'bg-slate-50'}`}>
              <Search size={24} className={textMutedClass} />
            </div>
            <p className={`${textMutedClass} font-bold`}>Aucun résultat trouvé pour "{searchTerm}"</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredData.map((org) => (
              <div key={org.id} className={`${cardClass} rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-800`}>
                <div className={`px-6 py-4 ${headerClass} border-b ${borderClass} flex items-center justify-between`}>
                  <h4 className={`font-bold ${textClass} flex items-center gap-2 uppercase text-sm tracking-tight`}>
                    <FileText size={16} className="text-indigo-500" />
                    {org.name}
                  </h4>
                  <span className={`text-[10px] ${cardClass} px-2 py-1 rounded-md border ${borderClass} ${textMutedClass} font-bold`}>
                    {org.rubriques?.length || 0} Rubriques
                  </span>
                </div>
                <div className="p-0 text-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className={tableHeaderClass}>
                        <tr className={`${textMutedClass} border-b ${borderClass}`}>
                          <th className="px-6 py-3 font-black uppercase tracking-tighter">Désignation</th>
                          <th className="px-6 py-3 font-black uppercase tracking-tighter text-right">Plafond</th>
                          <th className="px-6 py-3 font-black uppercase tracking-tighter text-center">Taux</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-[#2A2A2A]">
                        {org.rubriques?.map((rub) => (
                          <tr key={rub.id} className={`transition-colors ${hoverClass}`}>
                            <td className={`px-6 py-3 font-medium ${textClass}`}>{rub.label || '-'}</td>
                            <td className={`px-6 py-3 text-right font-bold ${textMutedClass}`}>
                              {rub.plafond ? `${parseFloat(rub.plafond).toLocaleString('fr-FR')} DH` : '-'}
                            </td>
                            <td className="px-6 py-3 text-center">
                              <span className={`${badgeClass} px-2 py-1 rounded-lg font-black text-xs`}>
                                {rub.taux || 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {org.rubriques?.length === 0 && (
                          <tr>
                            <td colSpan="3" className={`px-6 py-8 text-center ${textMutedClass}`}>
                              Aucune rubrique configurée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationCotisation;