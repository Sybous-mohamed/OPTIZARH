import React, { useState, useEffect ,useRef  } from 'react';
import { 
  Plus, Trash2, Save, Building2, Loader2, 
  Star, Eye, EyeOff, Download, Calendar, AlertCircle ,ChevronDown 
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../../context/ThemeContext';
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

const GestionCotisation = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  
  const [config, setConfig] = useState({
    year: new Date().getFullYear(),
    organismes: []
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [uiStates, setUiStates] = useState({});
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({ 
    isOpen: false, type: null, id: null, name: '', orgId: null 
  });
  const [isYearOpen, setIsYearOpen] = useState(false);
const yearRef = useRef(null);

  // Dark mode classes
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-800';
  const inputErrorClass = darkMode 
    ? 'bg-[#252525] border-red-500 text-white ring-1 ring-red-500' 
    : 'bg-gray-50 border-red-500 text-gray-800 ring-1 ring-red-500';

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years'); 
        setAvailableYears(response.data); 
      } catch (error) {
        console.error("Erreur fetching years:", error);
      }
    };
    fetchYears();
  }, []);

  const fetchData = async () => {
    setFetching(true);
    try {
      const response = await api.get(`/api/cotisations?year=${config.year}`);
      if (response.data && response.data.length > 0) {
        setConfig(prev => ({ ...prev, organismes: response.data }));
        const initialStates = {};
        response.data.forEach(org => {
          initialStates[org.id] = { visible: true, favorite: org.is_favorite };
        });
        setUiStates(initialStates);
        setErrors({});
      } else {
        setConfig(prev => ({ ...prev, organismes: [] }));
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
      showNotification("❌ Erreur chargement des données", "error");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [config.year]);
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (yearRef.current && !yearRef.current.contains(event.target)) {
      setIsYearOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  const toggleVisibility = (id) => {
    setUiStates(prev => ({ ...prev, [id]: { ...prev[id], visible: !prev[id]?.visible } }));
  };

  const addOrganisme = () => {
    const newId = Date.now();
    const newOrg = { id: newId, name: 'Nouvel Organisme', rubriques: [] };
    setConfig({ ...config, organismes: [...config.organismes, newOrg] });
    setUiStates(prev => ({ ...prev, [newId]: { visible: true, favorite: false } }));
    showNotification("✨ Nouvel organisme ajouté", "success");
  };

  const addRubrique = (orgId) => {
    const updatedOrgs = config.organismes.map(org => {
      if (org.id === orgId) {
        return {
          ...org,
          rubriques: [...org.rubriques, { id: Date.now(), label: '', taux: '', plafond: '' }]
        };
      }
      return org;
    });
    setConfig({ ...config, organismes: updatedOrgs });
    showNotification("📋 Nouvelle rubrique ajoutée", "success");
  };

  const validateTaux = (taux) => {
    if (taux === '' || taux === null) return true;
    const numTaux = parseFloat(taux);
    return !isNaN(numTaux) && numTaux >= 0 && numTaux <= 100;
  };

  const validatePlafond = (plafond) => {
    if (plafond === '' || plafond === null) return true;
    const numPlafond = parseFloat(plafond);
    return !isNaN(numPlafond) && numPlafond >= 0;
  };

  const updateRubrique = (orgId, rubId, field, val) => {
    if (field === 'taux') {
      const numVal = parseFloat(val);
      if (val !== '' && (isNaN(numVal) || numVal < 0 || numVal > 100)) {
        setErrors(prev => ({ ...prev, [`${orgId}_${rubId}_taux`]: "Taux doit être entre 0% et 100%" }));
        return;
      } else {
        setErrors(prev => ({ ...prev, [`${orgId}_${rubId}_taux`]: null }));
      }
    }
    
    if (field === 'plafond') {
      const numVal = parseFloat(val);
      if (val !== '' && (isNaN(numVal) || numVal < 0)) {
        setErrors(prev => ({ ...prev, [`${orgId}_${rubId}_plafond`]: "Plafond ne peut pas être négatif" }));
        return;
      } else {
        setErrors(prev => ({ ...prev, [`${orgId}_${rubId}_plafond`]: null }));
      }
    }

    const updatedOrgs = config.organismes.map(org => {
      if (org.id === orgId) {
        const newRubriques = org.rubriques.map(rub => rub.id === rubId ? { ...rub, [field]: val } : rub);
        return { ...org, rubriques: newRubriques };
      }
      return org;
    });
    setConfig({ ...config, organismes: updatedOrgs });
  };

  // ============ DELETE WITH API ============
  const openDeleteOrganismeModal = (orgId, orgName) => {
    setDeleteModal({ isOpen: true, type: 'organisme', id: orgId, name: orgName, orgId: null });
  };

  const openDeleteRubriqueModal = (orgId, rubId, rubLabel) => {
    setDeleteModal({ isOpen: true, type: 'rubrique', id: rubId, name: rubLabel || 'cette rubrique', orgId: orgId });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: null, id: null, name: '', orgId: null });
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'organisme') {
      setLoading(true);
      try {
        await api.delete(`/api/cotisations/organisme/${deleteModal.id}`);
        setConfig({...config, organismes: config.organismes.filter(o => o.id !== deleteModal.id)});
        showNotification(`🗑️ Organisme "${deleteModal.name}" supprimé`, "success");
      } catch (error) {
        showNotification("❌ Erreur lors de la suppression", "error");
      } finally {
        setLoading(false);
      }
    } else if (deleteModal.type === 'rubrique') {
      setLoading(true);
      try {
        await api.delete(`/api/cotisations/rubrique/${deleteModal.id}`);
        const updated = config.organismes.map(o => 
          o.id === deleteModal.orgId 
            ? {...o, rubriques: o.rubriques.filter(r => r.id !== deleteModal.id)} 
            : o
        );
        setConfig({...config, organismes: updated});
        showNotification(`🗑️ Rubrique "${deleteModal.name}" supprimée`, "success");
      } catch (error) {
        showNotification("❌ Erreur lors de la suppression", "error");
      } finally {
        setLoading(false);
      }
    }
    closeDeleteModal();
  };
  // ============ END DELETE ============

  const handleSave = async () => {
    let hasError = false;
    for (const org of config.organismes) {
      for (const rub of org.rubriques) {
        if (!validateTaux(rub.taux)) {
          showNotification(`❌ Taux invalide pour "${rub.label || 'sans nom'}" (0-100%)`, "error");
          hasError = true;
        }
        if (!validatePlafond(rub.plafond)) {
          showNotification(`❌ Plafond invalide pour "${rub.label || 'sans nom'}" (positif)`, "error");
          hasError = true;
        }
      }
    }
    if (hasError) return;
    
    setLoading(true);
    try {
      await api.post('/api/cotisations/save', config);
      await fetchData();
      showNotification(`✅ Configuration ${config.year} enregistrée`, "success");
    } catch (error) {
      showNotification("❌ Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    const currentStatus = uiStates[id]?.favorite || false;
    const newStatus = !currentStatus;
    try {
      const response = await api.post(`/api/cotisations/favorite/${id}`, {
        is_favorite: newStatus,
        name: config.organismes.find(o => o.id === id)?.name,
        year: config.year
      });
      if (response.status === 200) {
        setUiStates(prev => ({ ...prev, [id]: { ...prev[id], favorite: newStatus } }));
        fetchData();
        showNotification(response.data.message, "success");
      }
    } catch (error) {
      showNotification("❌ Erreur lors de la propagation", "error");
    }
  };

  const exportPDF = () => {
    if (config.organismes.length === 0) {
      showNotification("⚠️ Aucune donnée à exporter", "warning");
      return;
    }
    const doc = new jsPDF();
    const dateStr = new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text(`Paramétrage des Cotisations - ${config.year}`, 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${dateStr}`, 14, 28);
    let currentY = 35;
    config.organismes.forEach((org) => {
      if (currentY > 240) { doc.addPage(); currentY = 20; }
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text(org.name, 14, currentY);
      doc.setDrawColor(0, 51, 102);
      doc.line(14, currentY + 2, 60, currentY + 2);
      const tableData = org.rubriques.map(rub => [
        rub.label || 'Sans désignation',
        rub.plafond ? `${parseFloat(rub.plafond).toLocaleString()} DH` : '-',
        `${rub.taux || 0} %`
      ]);
      autoTable(doc, {
        startY: currentY + 5,
        head: [['Désignation', 'Plafond (DH)', 'Taux (%)']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { cellWidth: 80 }, 1: { halign: 'center' }, 2: { halign: 'center' } },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });
      currentY = doc.lastAutoTable.finalY + 15;
    });
    doc.save(`Cotisations_${config.year}.pdf`);
    showNotification("📄 PDF exporté", "success");
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto p-4 pb-32">
        
        {/* HEADER */}
        <div className={`${cardClass} rounded-2xl border ${borderClass} p-4 mb-6 shadow-sm`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="relative" ref={yearRef}>
                <button 
                    onClick={() => setIsYearOpen(!isYearOpen)}
                    className={`h-10 px-4 rounded-xl font-medium outline-none cursor-pointer min-w-[140px] transition-all ${darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-800'} border ${borderClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
                >
                    <span className="truncate">{config.year || 'Sélectionner année'}</span>
                    <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isYearOpen && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200'} z-50 max-h-60 overflow-y-auto shadow-xl animate-fadeIn`}>
                    {availableYears.map(y => (
                        <div 
                        key={y.id}
                        onClick={() => {
                            setConfig(prev => ({...prev, year: y.year || y.annee}));
                            setIsYearOpen(false);
                        }}
                        className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${config.year === (y.year || y.annee) ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                        {y.year || y.annee}
                        </div>
                    ))}
                    </div>
                )}
                </div>
              <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold text-xs hover:from-red-700 hover:to-rose-700 transition-all shadow-lg cursor-pointer">
                <Download size={16} /> Exporter PDF
              </button>
              <button onClick={addOrganisme} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-xs hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg cursor-pointer">
                <Plus size={16} /> Nouveau Type
              </button>
            </div>
            {fetching && <Loader2 className="animate-spin text-indigo-500" size={20} />}
          </div>
        </div>

        {/* Organismes List */}
        <div className="space-y-4">
          {config.organismes.map((org) => (
            <div key={org.id} className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden transition-all hover:shadow-md`}>
              {/* Card Header */}
              <div className={`px-5 py-3 border-b ${borderClass} flex justify-between items-center ${darkMode ? 'bg-[#252525]' : 'bg-gray-50/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg text-white shadow-md">
                    <Building2 size={16} />
                  </div>
                  <input 
                    className={`font-bold outline-none bg-transparent focus:border-b-2 border-indigo-400 ${textClass} text-base`}
                    value={org.name}
                    onChange={(e) => {
                      const updated = config.organismes.map(o => o.id === org.id ? {...o, name: e.target.value} : o);
                      setConfig({...config, organismes: updated});
                    }}
                    placeholder="Nom de l'organisme"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleFavorite(org.id)} className={`p-1.5 rounded-lg transition-all cursor-pointer ${uiStates[org.id]?.favorite ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'}`}>
                    <Star size={16} fill={uiStates[org.id]?.favorite ? "currentColor" : "none"} />
                  </button>
                  <button onClick={() => toggleVisibility(org.id)} className={`p-1.5 rounded-lg transition-all cursor-pointer ${uiStates[org.id]?.visible ? 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525]'}`}>
                    {uiStates[org.id]?.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <div className="w-px h-5 bg-gray-200 dark:bg-[#2A2A2A] mx-1" />
                  <button onClick={() => openDeleteOrganismeModal(org.id, org.name)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              {uiStates[org.id]?.visible && (
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`text-left text-xs font-bold uppercase tracking-wider ${textMutedClass}`}>
                          <th className="pb-3">Désignation</th>
                          <th className="pb-3 text-center">Plafond (DH)</th>
                          <th className="pb-3 text-center">Taux (%)</th>
                          <th className="pb-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y dark:divide-[#2A2A2A]">
                        {org.rubriques.map((rub) => {
                          const tauxError = errors[`${org.id}_${rub.id}_taux`];
                          const plafondError = errors[`${org.id}_${rub.id}_plafond`];
                          return (
                            <tr key={rub.id} className={darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}>
                              <td className="py-3 pr-4">
                                <input 
                                  className={`w-full p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${inputClass} border ${borderClass} text-sm`}
                                  value={rub.label}
                                  placeholder="ex: RC, AMO, CNSS..."
                                  onChange={(e) => updateRubrique(org.id, rub.id, 'label', e.target.value)}
                                />
                              </td>
                              <td className="py-3 px-3">
                                <div>
                                  <input 
                                    type="number" min="0"
                                    className={`w-32 mx-auto block p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-center ${plafondError ? inputErrorClass : inputClass} border ${borderClass} text-sm`}
                                    value={rub.plafond} placeholder="0"
                                    onChange={(e) => updateRubrique(org.id, rub.id, 'plafond', e.target.value)}
                                  />
                                  {plafondError && <p className="text-red-500 text-xs text-center mt-1"><AlertCircle size={10} /> {plafondError}</p>}
                                </div>
                               </td>
                              <td className="py-3 px-3">
                                <div>
                                  <div className="relative w-24 mx-auto">
                                    <input 
                                      type="number" step="0.1" min="0" max="100"
                                      className={`w-full p-2 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 text-center pr-7 ${tauxError ? inputErrorClass : inputClass} border ${borderClass} text-sm font-semibold`}
                                      value={rub.taux}
                                      onChange={(e) => updateRubrique(org.id, rub.id, 'taux', e.target.value)}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                                  </div>
                                  {tauxError && <p className="text-red-500 text-xs text-center mt-1"><AlertCircle size={10} /> {tauxError}</p>}
                                </div>
                               </td>
                              <td className="py-3 text-center">
                                <button onClick={() => openDeleteRubriqueModal(org.id, rub.id, rub.label)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer">
                                  <Trash2 size={14} />
                                </button>
                               </td>
                             </tr>
                          );
                        })}
                        {org.rubriques.length === 0 && (
                          <tr><td colSpan="4" className={`py-6 text-center text-sm ${textMutedClass}`}>Aucune rubrique - Cliquez sur "Ajouter une ligne"</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => addRubrique(org.id)} className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline transition-all cursor-pointer">
                    <Plus size={12} /> Ajouter une ligne
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {config.organismes.length === 0 && !fetching && (
          <div className={`text-center py-12 border-2 border-dashed rounded-xl ${cardClass} ${borderClass}`}>
            <Building2 size={48} className="mx-auto mb-3 opacity-30" />
            <p className={`text-base font-medium ${textClass}`}>Aucun organisme configuré</p>
            <button onClick={addOrganisme} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-all cursor-pointer">
              + Ajouter un organisme
            </button>
          </div>
        )}

        {fetching && (
          <div className="text-center py-12">
            <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
            <p className={`mt-2 ${textMutedClass}`}>Chargement...</p>
          </div>
        )}

        {/* Save Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 cursor-pointer">
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span className="text-sm uppercase tracking-wide">Sauvegarder</span>
          </button>
        </div>

      </div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title={deleteModal.type === 'organisme' ? "Supprimer l'organisme" : "Supprimer la rubrique"}
        message={deleteModal.type === 'organisme' 
          ? `Supprimer l'organisme "${deleteModal.name}" et toutes ses rubriques ?`
          : `Supprimer la rubrique "${deleteModal.name}" ?`
        }
        darkMode={darkMode}
      />
    </div>
  );
};

export default GestionCotisation;