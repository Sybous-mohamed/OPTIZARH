import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig';
import { 
  Home, Car, ShoppingBag, Laptop, Heart, Plane, 
  Briefcase, FileText, Search, Calculator, TrendingUp,
  ShieldCheck, Download, Loader2, X
} from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';

const ConsultationCredits = () => {
  const { darkMode } = useTheme();
  const [credits, setCredits] = useState([]);
  const [types, setTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('TOUS');
  const [filterType, setFilterType] = useState('TOUS');
  const [selectedYear, setSelectedYear] = useState('');

  // Dark mode classes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-700';

  const fetchData = async () => {
    setLoading(true);
    try {
      const url = selectedYear ? `/api/credits?year=${selectedYear}` : '/api/credits';
      
      const [creditsRes, typesRes, categoriesRes] = await Promise.all([
        api.get(url),
        api.get('/api/credit-types'),
        api.get('/api/credit-categories')
      ]);
      
      setCredits(Array.isArray(creditsRes.data) ? creditsRes.data : []);
      setTypes(Array.isArray(typesRes.data) ? typesRes.data : []);
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : []);
      
      // Récupérer les années UNIQUEMENT à partir des crédits qui ont des données
      const allCreditsRes = await api.get('/api/credits');
      const allCredits = Array.isArray(allCreditsRes.data) ? allCreditsRes.data : [];
      const yearsWithData = [...new Set(allCredits.filter(c => c.year).map(c => c.year))].sort((a, b) => b - a);
      setAvailableYears(yearsWithData);
      
    } catch (error) { 
      console.error('Erreur chargement:', error);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [selectedYear]);

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'Immobilier': Home,
      'Transport': Car,
      'Consommation': ShoppingBag,
      'Electronique': Laptop,
      'Santé': Heart,
      'Voyage': Plane,
      'Education': Briefcase
    };
    const Icon = icons[categoryName] || FileText;
    return <Icon size={18} />;
  };

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Immobilier': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'Transport': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
      'Consommation': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      'Electronique': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400',
      'Santé': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      'Voyage': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      'Education': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
    };
    return colors[categoryName] || 'bg-gray-100 dark:bg-gray-800 text-gray-600';
  };

  const filteredCredits = credits.filter(credit => {
    const matchSearch = credit.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryName = credit.category?.name || '';
    const typeName = credit.type?.name || '';
    const matchCategory = filterCategory === 'TOUS' || categoryName === filterCategory;
    const matchType = filterType === 'TOUS' || typeName === filterType;
    return matchSearch && matchCategory && matchType;
  });

  const stats = {
    total: credits.length,
    actifs: credits.filter(c => c.status === 'Actif').length,
    montantMax: credits.length > 0 
      ? Math.max(...credits.map(c => parseFloat(c.max_amount))) 
      : 0,
    tauxMoyen: credits.length > 0 
      ? (credits.reduce((acc, c) => acc + parseFloat(c.interest_rate), 0) / credits.length).toFixed(1)
      : 0
  };

  const exportPDF = () => {
    if (filteredCredits.length === 0) {
      alert("Aucune donnée à exporter");
      return;
    }

    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('fr-FR');
    
    doc.setFontSize(18);
    doc.setTextColor(0, 51, 102);
    doc.text(`Liste des Crédits ${selectedYear ? `- Année ${selectedYear}` : ''}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${dateStr}`, 14, 28);
    doc.text(`Total: ${filteredCredits.length} crédit(s)`, 14, 35);

    const tableData = filteredCredits.map(credit => [
      credit.name,
      credit.type?.name || '-',
      credit.category?.name || '-',
      credit.year || '-',
      `${new Intl.NumberFormat('fr-MA').format(credit.max_amount)} DH`,
      `${credit.interest_rate}%`,
      `${credit.max_duration} mois`,
      credit.status
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Nom', 'Type', 'Catégorie', 'Année', 'Montant Max', 'Taux', 'Durée', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255] },
      styles: { fontSize: 9 }
    });

    doc.save(`credits_${selectedYear || 'all'}_${dateStr}.pdf`);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategory('TOUS');
    setFilterType('TOUS');
    setSelectedYear('');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 p-6 ${bgClass}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <h1 className={`text-2xl font-bold ${textClass}`}>
                Consultation des Crédits
              </h1>
            </div>
            <p className={`text-sm ${textMutedClass} ml-12`}>
              Liste des produits financiers disponibles {selectedYear && `pour l'année ${selectedYear}`}
            </p>
          </div>
          <button 
            onClick={exportPDF}
            disabled={filteredCredits.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm font-bold hover:from-red-700 hover:to-rose-700 transition-all shadow-lg disabled:opacity-50"
          >
            <Download size={16} /> Exporter PDF
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`${cardClass} rounded-xl p-4 border shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs ${textMutedClass}`}>Total Crédits</span>
                <p className={`text-2xl font-bold ${textClass} mt-1`}>{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <Calculator size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-xl p-4 border shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs ${textMutedClass}`}>Crédits Actifs</span>
                <p className={`text-2xl font-bold ${textClass} mt-1`}>{stats.actifs}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <ShieldCheck size={18} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-xl p-4 border shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs ${textMutedClass}`}>Montant Max</span>
                <p className={`text-2xl font-bold ${textClass} mt-1`}>
                  {new Intl.NumberFormat('fr-MA').format(stats.montantMax)} DH
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <TrendingUp size={18} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
          <div className={`${cardClass} rounded-xl p-4 border shadow-sm hover:shadow-md transition-all`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-xs ${textMutedClass}`}>Taux Moyen</span>
                <p className={`text-2xl font-bold ${textClass} mt-1`}>{stats.tauxMoyen}%</p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`${cardClass} rounded-xl p-4 mb-6 border shadow-sm`}>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMutedClass}`} />
              <input
                type="text"
                placeholder="Rechercher un crédit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 rounded-lg border ${inputClass} ${borderClass} outline-none focus:ring-2 focus:ring-indigo-500 text-sm`}
              />
            </div>
            
            {/* Sélecteur d'année - UNIQUEMENT les années qui ont des données */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${inputClass} ${borderClass} outline-none text-sm cursor-pointer`}
            >
              <option value="">📅 Toutes les années</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  📅 {year}
                </option>
              ))}
            </select>
            
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${inputClass} ${borderClass} outline-none text-sm cursor-pointer`}
            >
              <option value="TOUS">📁 Toutes les catégories</option>
              {categories.filter(c => c.is_active !== false).map(cat => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${inputClass} ${borderClass} outline-none text-sm cursor-pointer`}
            >
              <option value="TOUS">📋 Tous les types</option>
              {types.filter(t => t.is_active !== false).map(type => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            
            {(searchTerm || filterCategory !== 'TOUS' || filterType !== 'TOUS' || selectedYear) && (
              <button 
                onClick={resetFilters}
                className="text-xs px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all flex items-center gap-1"
              >
                <X size={14} /> Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Credits Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
          </div>
        ) : filteredCredits.length === 0 ? (
          <div className={`text-center py-12 border-2 border-dashed rounded-xl ${cardClass}`}>
            <Calculator size={48} className="mx-auto mb-3 opacity-30" />
            <p className={textMutedClass}>Aucun crédit trouvé {selectedYear ? `pour l'année ${selectedYear}` : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCredits.map((credit) => {
              const categoryName = credit.category?.name || 'Autre';
              const categoryColor = getCategoryColor(categoryName);
              return (
                <div key={credit.id} className={`${cardClass} rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl ${categoryColor} flex items-center justify-center shadow-sm`}>
                        {getCategoryIcon(categoryName)}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-bold ${textClass} line-clamp-1`}>{credit.name}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${categoryColor}`}>
                            {credit.category?.name || '-'}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                            {credit.type?.name || '-'}
                          </span>
                          {credit.year && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${darkMode ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                              📅 {credit.year}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        credit.status === 'Actif' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : credit.status === 'Inactif'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        {credit.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 pt-3 border-t dark:border-[#2A2A2A]">
                      <div className="flex justify-between text-sm">
                        <span className={textMutedClass}>💰 Montant max</span>
                        <span className={`font-bold text-indigo-600 dark:text-indigo-400`}>
                          {new Intl.NumberFormat('fr-MA').format(credit.max_amount)} DH
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={textMutedClass}>📊 Taux</span>
                        <span className="font-semibold">{credit.interest_rate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className={textMutedClass}>⏱️ Durée</span>
                        <span className="font-semibold">{credit.max_duration} mois</span>
                      </div>
                      {credit.description && (
                        <div className="flex justify-between text-sm">
                          <span className={textMutedClass}>📝 Description</span>
                          <span className="text-xs text-right line-clamp-2">{credit.description}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultationCredits;