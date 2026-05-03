import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, UserCheck, ChevronDown, Download, 
  Save, Loader2, Edit3, X, Settings2, ArrowLeft,
  Calendar, Award, TrendingUp
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import api from '../../lib/apis/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GestionRetraite = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedYear, setSelectedYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [lastModified, setLastModified] = useState(null);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const yearRef = useRef(null);

  const [retraiteData, setRetraiteData] = useState({
    age_legal: 60,
    duree_max: 2,
    nb_fois: 2
  });

  // Dark mode classes - RH simple design
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  
  // Input de type TEXT au lieu de NUMBER pour pouvoir supprimer le zéro
  const inputNumberClass = darkMode 
    ? 'w-full bg-[#252525] border border-[#333] rounded-xl px-6 py-4 text-3xl font-bold text-center text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
    : 'w-full bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 text-3xl font-bold text-center text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
  
  const selectClass = darkMode 
    ? 'bg-[#252525] border-[#333] text-white' 
    : 'bg-gray-50 border-gray-200 text-gray-800';

  const buttonClass = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer";
  const primaryButtonClass = `${buttonClass} bg-indigo-600 text-white hover:bg-indigo-700 shadow-md`;
  const successButtonClass = `${buttonClass} bg-emerald-600 text-white hover:bg-emerald-700 shadow-md`;
  const outlineButtonClass = `${buttonClass} border ${borderClass} ${textClass} hover:bg-gray-100 dark:hover:bg-[#252525]`;

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

  // 1. Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        const years = response.data || [];
        setAvailableYears(years);
        
        const savedYear = localStorage.getItem('retraite_selected_year');
        if (savedYear && years.some(y => parseInt(y.year) === parseInt(savedYear))) {
          setSelectedYear(savedYear);
        } else if (years.length > 0) {
          const lastYear = years[years.length - 1];
          setSelectedYear(lastYear.year);
          localStorage.setItem('retraite_selected_year', lastYear.year);
        }
      } catch (err) {
        console.error("Erreur lors du chargement des années");
        showNotification(" Erreur chargement des années", "error");
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch settings for selected year
  useEffect(() => {
    const fetchSettings = async () => {
      if (!selectedYear) return;
      try {
        const response = await api.get(`/api/retraite/settings/${selectedYear}`);
        if (response.data) {
          setRetraiteData({
            age_legal: response.data.age_legal ?? 60,
            duree_max: response.data.duree_max ?? 2, 
            nb_fois: response.data.nb_fois ?? 2
          });
          setLastModified(response.data.created_at || response.data.updated_at);
        } else {
          setLastModified(null);
        }
      } catch (err) {
        console.log("Pas de config pour cette année");
        setLastModified(null);
      }
    };
    fetchSettings();
  }, [selectedYear]);

  const handleYearChange = (yearValue) => {
    setSelectedYear(yearValue);
    setIsYearOpen(false);
    localStorage.setItem('retraite_selected_year', yearValue);
    showNotification(` Année ${yearValue} sélectionnée`, "success");
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/api/retraite/settings', { year: selectedYear, ...retraiteData });
      showNotification("Paramètres enregistrés avec succès !", "success");
      setIsEditing(false);
      setLastModified(new Date().toISOString());
    } catch (err) {
      showNotification(" Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.setTextColor(0, 51, 102); 
      doc.text("PARAMETRAGE DE LA RETRAITE", 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Année de référence : ${selectedYear}`, 105, 30, { align: 'center' });

      const tableRows = [
        ["Âge légal de départ", `${retraiteData.age_legal} Ans`],
        ["Durée maximale de prolongation", `${retraiteData.duree_max} Ans`],
        ["Nombre de renouvellements autorisés", `${retraiteData.nb_fois} Fois`],
      ];

      autoTable(doc, {
        startY: 45,
        head: [["Paramètre", "Valeur Paramétrée"]],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 11, cellPadding: 5 }
      });

      doc.save(`Retraite_Configuration_${selectedYear}.pdf`);
      showNotification("📄 PDF généré avec succès", "success");
      
    } catch (error) {
      console.error("Détails de l'erreur PDF:", error);
      showNotification(" Erreur lors de la génération du PDF", "error");
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Fonction pour gérer le changement des inputs (permet de supprimer le 0)
  const handleInputChange = (field, value) => {
    // Si la valeur est vide, on met une chaîne vide temporairement
    if (value === '') {
      setRetraiteData({...retraiteData, [field]: ''});
      return;
    }
    // Sinon on convertit en nombre
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setRetraiteData({...retraiteData, [field]: numValue});
    }
  };

  // Afficher la valeur correctement (si c'est vide on affiche vide)
  const getDisplayValue = (value) => {
    return value === '' ? '' : value;
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-6 ${bgClass}`}>
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER avec bouton retour */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleGoBack}
                className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'} hover:scale-105`}
                title="Retour"
              >
                <ArrowLeft size={20} className={textClass} />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <Settings2 size={24} className="text-indigo-500" />
                  <h1 className={`text-2xl font-bold ${textClass}`}>Paramétrage de la Retraite</h1>
                </div>
                <p className={`text-sm ${textMutedClass} mt-1 ml-10`}>
                  Gestion annuelle de l'âge légal et des prolongations
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-all shadow-sm"
              >
                <Download size={16} /> PDF
              </button>

              {!isEditing ? (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Edit3 size={16} /> Modifier
                </button>
              ) : (
                <button 
                  onClick={() => setIsEditing(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${outlineButtonClass}`}
                >
                  <X size={16} /> Annuler
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ACTIONS BAR - Year Selector */}
        <div className={`${cardClass} rounded-xl border ${borderClass} p-4 mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className={textMutedClass} />
                <span className={`text-sm font-medium ${textMutedClass}`}>Année de référence</span>
              </div>
              
              {/* YEAR PICKER */}
              <div className="relative" ref={yearRef}>
                <button 
                  onClick={() => setIsYearOpen(!isYearOpen)}
                  disabled={isEditing}
                  className={`h-10 px-4 rounded-lg font-medium outline-none cursor-pointer min-w-[120px] transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="truncate">{selectedYear || 'Sélectionner'}</span>
                  <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isYearOpen && (
                  <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg border ${borderClass} ${cardClass} z-50 max-h-60 overflow-y-auto shadow-lg`}>
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
                  </div>
                )}
              </div>
            </div>

            {/* Last Modified Badge */}
            {lastModified && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${borderClass} ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                <Clock size={12} className={textMutedClass} />
                <span className={`text-xs ${textMutedClass}`}>
                  Mis à jour : {new Date(lastModified).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONFIGURATION CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Carte 1: Âge Légal */}
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <UserCheck size={16} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className={`font-semibold text-sm ${textClass}`}>Cadre Légal</h2>
              </div>
            </div>
            
            <div className="p-5">
              <label className={`text-xs font-medium block mb-2 ${textMutedClass}`}>
                Âge légal de départ
              </label>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={!isEditing}
                className={inputNumberClass}
                value={getDisplayValue(retraiteData.age_legal)}
                onChange={(e) => handleInputChange('age_legal', e.target.value)}
                placeholder="0"
              />
              <div className={`text-xs ${textMutedClass} mt-2 text-center`}>Années</div>
            </div>
          </div>

          {/* Carte 2: Durée Max */}
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <Clock size={16} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className={`font-semibold text-sm ${textClass}`}>Prolongation</h2>
              </div>
            </div>
            
            <div className="p-5">
              <label className={`text-xs font-medium block mb-2 ${textMutedClass}`}>
                Durée maximale
              </label>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={!isEditing}
                className={inputNumberClass}
                value={getDisplayValue(retraiteData.duree_max)}
                onChange={(e) => handleInputChange('duree_max', e.target.value)}
                placeholder="0"
              />
              <div className={`text-xs ${textMutedClass} mt-2 text-center`}>Années</div>
            </div>
          </div>

          {/* Carte 3: Nombre de renouvellements */}
          <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden`}>
            <div className={`px-5 py-4 border-b ${borderClass}`}>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <TrendingUp size={16} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h2 className={`font-semibold text-sm ${textClass}`}>Renouvellement</h2>
              </div>
            </div>
            
            <div className="p-5">
              <label className={`text-xs font-medium block mb-2 ${textMutedClass}`}>
                Nombre autorisé
              </label>
              <input 
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={!isEditing}
                className={inputNumberClass}
                value={getDisplayValue(retraiteData.nb_fois)}
                onChange={(e) => handleInputChange('nb_fois', e.target.value)}
                placeholder="0"
              />
              <div className={`text-xs ${textMutedClass} mt-2 text-center`}>Fois</div>
            </div>
          </div>
        </div>


        {/* SAVE BUTTON */}
        {isEditing && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className={`${successButtonClass} cursor-pointer px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {loading ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionRetraite;