import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, TrendingUp, Calendar, DollarSign, 
  ArrowLeft, Search, Download, Printer, Users, 
  Percent, Wallet, AlertCircle, ChevronDown
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const IRAffichage = () => {
  const { showNotification } = useNotification();
  const { darkMode } = useTheme();
  const navigate = useNavigate();
  
  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [irData, setIrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800';
  const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-200';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (yearRef.current && !yearRef.current.contains(event.target)) {
        setIsYearOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      fetchIRData();
      localStorage.setItem('ir_view_year', selectedYear);
    }
  }, [selectedYear]);

  const fetchYears = async () => {
    try {
      const res = await api.get('/api/ir/annees');
      const data = res.data || [];
      setYears(data);
      if (data.length > 0) {
        const savedYear = localStorage.getItem('ir_view_year');
        if (savedYear && data.includes(parseInt(savedYear))) {
          setSelectedYear(parseInt(savedYear));
        } else {
          setSelectedYear(data[data.length - 1]);
        }
      }
    } catch (err) {
      console.error("Erreur chargement années:", err);
      setYears([]);
    }
  };

  const fetchIRData = async () => {
    if (!selectedYear) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/ir/settings/${selectedYear}`);
      if (res.data && res.data.data_rows) {
        setIrData(res.data.data_rows);
      } else {
        setIrData([]);
      }
    } catch (err) {
      console.error("Erreur fetchIRData:", err);
      setIrData([]);
    } finally {
      setLoading(false);
    }
  };

  const getTotalTranches = () => {
    return irData?.length || 0;
  };

  const getMaxTaux = () => {
    if (!irData || irData.length === 0) return 0;
    return Math.max(...irData.map(row => row.taux || 0));
  };

  const getLastMax = () => {
    if (!irData || irData.length === 0) return '0 MAD';
    const lastRow = irData[irData.length - 1];
    return lastRow.max === 0 ? 'Illimité' : lastRow.max.toLocaleString() + ' MAD';
  };

  const filteredRows = irData?.filter(row => 
    row.taux?.toString().includes(searchTerm) ||
    row.min?.toString().includes(searchTerm) ||
    (row.max !== 0 && row.max?.toString().includes(searchTerm))
  ) || [];

  const statsCards = [
    { title: "TRANCHES", value: getTotalTranches(), icon: TrendingUp, bgColor: "bg-indigo-100 dark:bg-indigo-900/30", iconColor: "text-indigo-500" },
    { title: "TAUX MAX", value: getMaxTaux() + "%", icon: Percent, bgColor: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-500" },
    { title: "PLAFOND MAX", value: getLastMax(), icon: DollarSign, bgColor: "bg-emerald-100 dark:bg-emerald-900/30", iconColor: "text-emerald-500" }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <button 
              onClick={() => navigate(-1)}
              className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-50'} border shadow-sm`}
            >
              <ArrowLeft size={18} className={textClass} />
            </button>
            <div>
              <h1 className={`text-2xl font-bold ${textClass}`}>Impôt sur le Revenu (IR)</h1>
              <p className={`text-sm ${textMutedClass}`}>Consultation du barème et des tranches d'imposition</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className={`${cardClass} rounded-xl border ${borderClass} p-4 mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Custom Select Année */}
              <div className="relative" ref={yearRef}>
                <button 
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  disabled={years.length === 0}
                  className={`h-9 px-4 rounded-lg font-medium outline-none cursor-pointer min-w-[110px] transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-2 hover:border-indigo-400 ${years.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="truncate">{selectedYear || 'Année'}</span>
                  <ChevronDown size={14} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isYearOpen && years.length > 0 && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-48 overflow-y-auto shadow-lg`}>
                    {years.map(y => (
                      <div 
                        key={y}
                        onClick={() => {
                          setSelectedYear(y);
                          setIsYearOpen(false);
                        }}
                        className={`px-4 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${selectedYear === y ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}
                      >
                        {y}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Rechercher une tranche..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-9 pr-3 py-2 rounded-lg text-sm border ${borderClass} ${inputClass} w-56 focus:ring-1 focus:ring-indigo-500`}
                  disabled={!irData || irData.length === 0}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  if (selectedYear) {
                    window.open(`/api/ir/export/${selectedYear}`, '_blank');
                  }
                }}
                disabled={!selectedYear}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${!selectedYear ? 'bg-gray-300 cursor-not-allowed text-gray-500' : darkMode ? 'bg-[#252525] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <Download size={14} /> Exporter PDF
              </button>
              <button 
                onClick={() => window.print()}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-[#252525] hover:bg-[#333]' : 'bg-gray-100 hover:bg-gray-200'} transition-all`}
              >
                <Printer size={14} /> Imprimer
              </button>
            </div>
          </div>
        </div>

        {/* Statistiques */}
        {irData && irData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {statsCards.map((stat, idx) => (
              <div key={idx} className={`${cardClass} rounded-xl p-4 border ${borderClass} hover:shadow-md transition-all`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-wider ${textMutedClass}`}>{stat.title}</p>
                    <p className={`text-2xl font-black ${textClass} mt-1`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon size={22} className={stat.iconColor} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        )}

        {/* Tableau des tranches */}
        {!loading && irData && irData.length > 0 && (
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} px-6 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-indigo-500" />
                <h3 className={`font-bold text-lg ${textClass}`}>Barème IR - {selectedYear}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-600`}>
                  {getTotalTranches()} tranche(s)
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'}`}>
                  <tr className={`text-xs font-bold uppercase tracking-wider ${textMutedClass}`}>
                    <th className="p-4 text-left">Tranche</th>
                    <th className="p-4 text-left">Min (MAD)</th>
                    <th className="p-4 text-left">Max (MAD)</th>
                    <th className="p-4 text-center">Taux (%)</th>
                    <th className="p-4 text-center">Déduction Marié</th>
                    <th className="p-4 text-center">Déduction Enfant 1</th>
                    <th className="p-4 text-center">Déduction Enfant 2</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-12 text-center">
                        <AlertCircle size={32} className="mx-auto mb-2 text-gray-400" />
                        <p className={`text-sm ${textMutedClass}`}>Aucune tranche trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, i) => (
                      <tr key={i} className={`border-b ${borderClass} hover:${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} transition-all`}>
                        <td className="p-4">
                          <span className={`font-mono font-bold ${textClass}`}>Tranche {i + 1}</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-semibold ${textClass}`}>{row.min.toLocaleString()} MAD</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-semibold ${textClass}`}>
                            {row.max === 0 ? 'Illimité' : row.max.toLocaleString() + ' MAD'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold`}>
                            <TrendingUp size={12} />
                            {row.taux}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-emerald-600 dark:text-emerald-400 font-semibold`}>
                            {row.marie.toLocaleString()} MAD
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-blue-600 dark:text-blue-400 font-semibold`}>
                            {row.enfant1.toLocaleString()} MAD
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`text-purple-600 dark:text-purple-400 font-semibold`}>
                            {row.enfant2.toLocaleString()} MAD
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aucune donnée */}
        {!loading && (!irData || irData.length === 0) && (
          <div className={`${cardClass} rounded-xl border ${borderClass} p-12 text-center`}>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-full mb-4 inline-block">
              <AlertCircle size={48} className="text-yellow-500" />
            </div>
            <p className={`text-lg font-medium ${textClass}`}>Aucune configuration IR</p>
            <p className={`text-sm ${textMutedClass} mt-1`}>
              {years.length === 0 
                ? "Aucune année configurée dans la base de données"
                : `Aucun barème trouvé pour l'année ${selectedYear}`}
            </p>
            <p className={`text-xs ${textMutedClass} mt-2`}>
              Veuillez configurer l'IR dans "Paramétrage IR"
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IRAffichage;