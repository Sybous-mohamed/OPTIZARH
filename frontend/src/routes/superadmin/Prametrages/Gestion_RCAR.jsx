import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Save, Users, Layers, 
  Grid, Database, DollarSign, FileText, Download, ChevronDown,
  Layout, Loader2, Star, Eye, Settings2, ArrowLeft
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../../context/ThemeContext';
import { useNotification } from '../../../context/NotificationContext';

const GestionRCAR = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [rcarData, setRcarData] = useState({
    salary_year_id: null,
    types: [] 
  });
  const [availableYears, setAvailableYears] = useState([]);
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
  const primaryButtonClass = `${buttonClass} bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-md`;
  const successButtonClass = `${buttonClass} bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-md`;
  const dangerButtonClass = `${buttonClass} bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-md`;
  const outlineButtonClass = `${buttonClass} border ${borderClass} ${textClass} hover:bg-gray-100 dark:hover:bg-[#252525] cursor-pointer`;

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
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
        
        const savedYear = localStorage.getItem('rcar_selected_year');
        const savedYearId = localStorage.getItem('rcar_selected_year_id');
        
        if (savedYear && response.data.some(y => y.year == savedYear)) {
          setSelectedYear(savedYear);
          setSelectedYearId(savedYearId ? parseInt(savedYearId) : null);
        } else if (response.data && response.data.length > 0) {
          const lastYear = response.data[response.data.length - 1];
          setSelectedYear(lastYear.year);
          setSelectedYearId(lastYear.id);
          localStorage.setItem('rcar_selected_year', lastYear.year);
          localStorage.setItem('rcar_selected_year_id', lastYear.id);
        }
      } catch (error) {
        console.error("Erreur fetching years:", error);
        showNotification("❌ Erreur chargement des années", "error");
      }
    };
    fetchYears();
  }, []);

  const handleYearChange = (yearValue, yearId) => {
    setSelectedYear(yearValue);
    setSelectedYearId(yearId);
    setIsYearOpen(false);
    localStorage.setItem('rcar_selected_year', yearValue);
    localStorage.setItem('rcar_selected_year_id', yearId);
    showNotification(`📅 Année ${yearValue} sélectionnée`, "success");
  };

  const handleToggleFavorite = async (typeId, currentStatus) => {
    const updated = rcarData.types.map(t => 
      t.id === typeId ? { ...t, isFavorite: !currentStatus } : t
    );
    setRcarData({ ...rcarData, types: updated });

    try {
      if (!String(typeId).startsWith('new-')) {
        await api.patch(`/api/rcar/type/${typeId}/toggle-favorite`, {
          is_favorite: !currentStatus
        });
        showNotification(`⭐ ${!currentStatus ? 'Favori ajouté' : 'Favori retiré'}`, "success");
      }
    } catch (error) {
      console.error("Erreur favorite:", error);
      fetchConfig(selectedYear);
      showNotification("❌ Erreur", "error");
    }
  };

  const handleToggleView = (typeId) => {
    const updated = rcarData.types.map(t => 
      t.id === typeId ? { ...t, isVisible: !t.isVisible } : t
    );
    setRcarData({ ...rcarData, types: updated });
  };

  const fetchConfig = async (year) => {
    setFetching(true);
    try {
      const response = await api.get(`/api/rcar/config/${year}`);
      const data = response.data;

      if (data && data.rcar_types) {
        setRcarData({
          salary_year_id: data.id,
          types: data.rcar_types.map(t => ({
            id: t.id,
            label: t.label,
            isFavorite: Boolean(t.is_favorite),
            isVisible: true,
            details: t.details.map(d => ({
              id: d.id,
              name: d.designation,
              plafond: d.plafond || '',
              percentage: d.percentage
            }))
          }))
        });
      } else {
        setRcarData({ salary_year_id: data?.id || null, types: [] });
      }
    } catch (error) {
      console.error("Erreur de chargement:", error);
      showNotification("❌ Erreur chargement configuration", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (selectedYear) {
      fetchConfig(selectedYear);
    }
  }, [selectedYear]);

  const addType = () => {
    const newType = { 
      id: `new-${Date.now()}`, 
      label: 'Nouveau Type de Cotisation', 
      isFavorite: false, 
      isVisible: true, 
      details: [] 
    };
    setRcarData(prev => ({ ...prev, types: [...prev.types, newType] }));
    showNotification("➕ Nouveau type ajouté", "success");
  };

  const addDetail = (typeId) => {
    const updated = rcarData.types.map(t => {
      if (t.id === typeId) {
        return { ...t, details: [...t.details, { id: `det-${Date.now()}`, name: '', plafond: '', percentage: '' }] };
      }
      return t;
    });
    setRcarData(prev => ({ ...prev, types: updated }));
  };

  const handleDeleteType = async (typeId) => {
    if (String(typeId).startsWith('new-')) {
      setRcarData(prev => ({ ...prev, types: prev.types.filter(t => t.id !== typeId) }));
      showNotification("🗑️ Type supprimé", "success");
      return;
    }

    if (window.confirm("Voulez-vous supprimer cet organisme et toutes ses lignes ?")) {
      try {
        await api.delete(`/api/rcar/type/${typeId}`);
        setRcarData(prev => ({ ...prev, types: prev.types.filter(t => t.id !== typeId) }));
        showNotification("✅ Organisme supprimé", "success");
      } catch (error) {
        showNotification("❌ Erreur lors de la suppression", "error");
      }
    }
  };

  const handleDeleteDetail = async (typeId, detailId) => {
    if (String(detailId).startsWith('det-')) {
      const updated = rcarData.types.map(t => 
        t.id === typeId ? { ...t, details: t.details.filter(d => d.id !== detailId) } : t
      );
      setRcarData(prev => ({ ...prev, types: updated }));
      return;
    }

    if (window.confirm("Supprimer cette ligne ?")) {
      try {
        await api.delete(`/api/rcar/detail/${detailId}`);
        const updated = rcarData.types.map(t => 
          t.id === typeId ? { ...t, details: t.details.filter(d => d.id !== detailId) } : t
        );
        setRcarData(prev => ({ ...prev, types: updated }));
        showNotification("✅ Ligne supprimée", "success");
      } catch (error) {
        showNotification("❌ Erreur lors de la suppression", "error");
      }
    }
  };

  const handleSave = async () => {
    if (!rcarData.salary_year_id) {
      showNotification("❌ Erreur: Aucun ID d'année trouvé", "error");
      return;
    }

    setLoading(true);
    const payload = {
      salary_year_id: rcarData.salary_year_id,
      types: rcarData.types.map(t => ({
        label: t.label,
        details: t.details.map(d => ({
          designation: d.name,
          plafond: d.plafond === '' ? null : d.plafond,
          percentage: d.percentage || 0
        }))
      }))
    };

    try {
      await api.post('/api/rcar/config/save', payload);
      showNotification("✅ Configuration RCAR enregistrée !", "success");
      fetchConfig(selectedYear);
    } catch (error) {
      showNotification("❌ Erreur de sauvegarde", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Grille des Salaires RCAR - Année ${selectedYear}`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Document généré le : ${new Date().toLocaleDateString()}`, 14, 30);

    let finalY = 35;

    rcarData.types.forEach((type) => {
      if (finalY > 240) {
        doc.addPage();
        finalY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0, 51, 102); 
      doc.text(type.label, 14, finalY + 10);

      const tableData = type.details.map(d => [
        d.name || '---',
        d.plafond ? `${d.plafond} DH` : '---',
        `${d.percentage} %`
      ]);

      autoTable(doc, {
        startY: finalY + 15,
        head: [['Désignation', 'Plafond (DH)', 'Taux (%)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 10 },
        margin: { left: 14 }
      });

      finalY = doc.lastAutoTable.finalY + 5;
    });

    doc.save(`Grille_RCAR_${selectedYear}.pdf`);
    showNotification("📄 PDF exporté avec succès", "success");
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-3 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER avec bouton retour */}
        <div className="mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleGoBack}
              className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'} hover:scale-105`}
              title="Retour"
            >
              <ArrowLeft size={20} className={textClass} />
            </button>
            <div className="flex items-center gap-2">
              <Settings2 size={24} className="text-indigo-500" />
              <h1 className={`text-xl font-bold ${textClass}`}>Grille des Salaires RCAR</h1>
            </div>
          </div>
          <p className={`text-sm ${textMutedClass} mt-1 ml-12`}>
            Gestion et paramétrage des taux de RCAR
          </p>
        </div>

        {/* CONTROLS */}
        <div className={`${cardClass} rounded-xl border ${borderClass} p-4 mb-6 shadow-sm`}>
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

            <button onClick={exportToPDF} className={`${dangerButtonClass} cursor-pointer`}>
              <Download size={16} /> Exporter PDF
            </button>
            
            <button onClick={addType} className={`${successButtonClass} cursor-pointer`}>
              <Plus size={16} /> Nouveau Type
            </button>
            
            {fetching && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          </div>
        </div>

        {/* DATA AREA - TABLEAU CORRIGÉ */}
        <div className="space-y-6 min-h-[300px]">
          {rcarData.types.length === 0 && !fetching ? (
            <div className={`${cardClass} rounded-2xl border-2 border-dashed ${borderClass} p-12 flex flex-col items-center justify-center text-center`}>
              <div className={`p-6 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} mb-6`}>
                <Layout size={48} className="text-gray-300" />
              </div>
              <h2 className={`text-xl font-bold ${textClass} mb-2`}>Aucune configuration trouvée</h2>
              <button onClick={addType} className={`${primaryButtonClass} cursor-pointer`}>
                <Plus size={20} /> Ajouter le premier type
              </button>
            </div>
          ) : (
            rcarData.types.map((type) => (
              <div key={type.id} className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden shadow-sm`}>
                <div className={`${cardHeaderClass} px-4 py-3`}>
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                      <FileText size={16} className="text-white flex-shrink-0" />
                      <input 
                        className="bg-transparent font-bold text-white outline-none border-b border-transparent focus:border-white/50 px-1 py-1 text-sm w-full max-w-md"
                        value={type.label}
                        onChange={(e) => {
                          const updated = rcarData.types.map(t => t.id === type.id ? {...t, label: e.target.value} : t);
                          setRcarData({...rcarData, types: updated});
                        }}
                      />
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <button 
                        onClick={() => handleToggleFavorite(type.id, type.isFavorite)}
                        className={`transition-colors cursor-pointer ${type.isFavorite ? 'text-amber-400' : 'text-white/50 hover:text-amber-400'}`}
                        title="Appliquer à toutes les années"
                      >
                        <Star size={16} fill={type.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={() => handleToggleView(type.id)}
                        className={`transition-colors cursor-pointer ${type.isVisible ? 'text-white' : 'text-white/50 hover:text-white'}`}
                      >
                        <Eye size={16} />
                      </button>
                      <button onClick={() => handleDeleteType(type.id)} className="text-white/50 hover:text-rose-400 transition-colors cursor-pointer">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                </div>

                {type.isVisible && (
                  <div className="p-4 overflow-x-auto">
                    <table className="w-full min-w-[600px] border-collapse">
                      <thead>
                        <tr className={`border-b ${borderClass}`}>
                          <th className={`text-left py-3 px-2 text-xs font-semibold ${textMutedClass} w-2/5`}>
                            Désignation
                          </th>
                          <th className={`text-left py-3 px-3 text-xs font-semibold ${textMutedClass} w-1/4`}>
                            Plafond (DH)
                          </th>
                          <th className={`text-left py-3 px-3 text-xs font-semibold ${textMutedClass} w-1/4`}>
                            Taux (%)
                          </th>
                          <th className={`py-3 w-10 ${textMutedClass}`}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {type.details.map((det) => (
                          <tr key={det.id} className={`border-b ${borderClass} last:border-0`}>
                            <td className="py-2 px-2">
                              <input 
                                className={`w-full rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                                placeholder="Ex: Salaire de base"
                                value={det.name}
                                onChange={(e) => {
                                  const updated = rcarData.types.map(t => t.id === type.id ? {
                                    ...t, details: t.details.map(d => d.id === det.id ? {...d, name: e.target.value} : d)
                                  } : t);
                                  setRcarData({...rcarData, types: updated});
                                }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input 
                                type="number"
                                placeholder="0"
                                className={`w-full rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                                value={det.plafond}
                                onChange={(e) => {
                                  const updated = rcarData.types.map(t => t.id === type.id ? {
                                    ...t, details: t.details.map(d => d.id === det.id ? {...d, plafond: e.target.value} : d)
                                  } : t);
                                  setRcarData({...rcarData, types: updated});
                                }}
                              />
                            </td>
                            <td className="py-2 px-3">
                              <div className="flex items-center gap-1">
                                <input 
                                  type="number"
                                  step="0.1"
                                  placeholder="0"
                                  className={`w-full rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${inputClass}`}
                                  value={det.percentage}
                                  onChange={(e) => {
                                    const updated = rcarData.types.map(t => t.id === type.id ? {
                                      ...t, details: t.details.map(d => d.id === det.id ? {...d, percentage: e.target.value} : d)
                                    } : t);
                                    setRcarData({...rcarData, types: updated});
                                  }}
                                />
                                <span className={`text-xs font-bold ${textMutedClass}`}>%</span>
                              </div>
                            </td>
                            <td className="py-2 text-center">
                              <button 
                                onClick={() => handleDeleteDetail(type.id, det.id)} 
                                className={`p-2 ${textMutedClass} hover:text-rose-500 transition-colors cursor-pointer`}
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {type.details.length === 0 && (
                          <tr>
                            <td colSpan="4" className={`py-8 text-center ${textMutedClass}`}>
                              Aucune ligne configurée
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <button 
                      onClick={() => addDetail(type.id)} 
                      className={`mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer`}
                    >
                      <Plus size={14} /> Ajouter une ligne
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* FOOTER */}
        {rcarData.types.length > 0 && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={loading || fetching} 
              className={`${primaryButtonClass} disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer px-8 py-3`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? "ENREGISTREMENT..." : "SAUVEGARDER LE PARAMÉTRAGE"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionRCAR;