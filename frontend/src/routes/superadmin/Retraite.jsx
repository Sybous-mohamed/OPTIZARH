import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, UserCheck, ChevronDown, Download, 
  Save, Loader2, Edit3, X 
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import api from '../../lib/apis/axiosConfig';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const GestionRetraite = () => {
  const { showNotification } = useNotification();
  
  const [isEditing, setIsEditing] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [loading, setLoading] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);
  const [lastModified, setLastModified] = useState(null);

  const [retraiteData, setRetraiteData] = useState({
    age_legal: 60,
    duree_max: 0,
    nb_fois: 0
  });

  // 1. Fetch available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const response = await api.get('/api/salary-years');
        setAvailableYears(response.data);
        const has2026 = response.data.some(y => parseInt(y.year) === 2026);
        if (!has2026 && response.data.length > 0) {
          setSelectedYear(parseInt(response.data[0].year));
        }
      } catch (err) {
        console.error("Erreur lors du chargement des années");
      }
    };
    fetchYears();
  }, []);

  // 2. Fetch settings for selected year (With ?? fix and Date update)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get(`/api/retraite/settings/${selectedYear}`);
        if (response.data) {
          setRetraiteData({
            // Using ?? to allow '0' as a valid value from database
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

  // Handlers
  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/api/retraite/settings', { year: selectedYear, ...retraiteData });

      showNotification("Paramètres enregistrés avec succès !", "success");
      setIsEditing(false);
      setLastModified(new Date().toISOString()); // Visual update
    } catch (err) {
      showNotification("Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.setTextColor(0, 51, 102); 
      doc.text("PARAMETRAGE DE LA RETRAITE", 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Année de référence : ${selectedYear}`, 105, 30, { align: 'center' });

      const tableRows = [
        ["Âge légal de départ", `${retraiteData.age_legal} Ans`],
        ["Durée maximale de prolongation", `${retraiteData.duree_max} Ans`],
        ["Nombre de renouvellements autorisés", `${retraiteData.nb_fois} Fois`],
      ];

      // Fixed autoTable call (using it as a function)
      autoTable(doc, {
        startY: 45,
        head: [["Paramètre", "Valeur Paramétrée"]],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 11, cellPadding: 5 }
      });

      doc.save(`Retraite_Configuration_${selectedYear}.pdf`);
      showNotification("PDF généré avec succès", "success");
      
    } catch (error) {
      console.error("Détails de l'erreur PDF:", error);
      showNotification("Erreur lors de la génération du PDF", "error");
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-6 font-sans antialiased text-slate-900 pb-24">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Paramétrage de la Retraite</h1>
            <p className="text-slate-500 text-sm italic tracking-tight">Gestion annuelle de l'âge légal et du Tamdid</p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={exportToPDF}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-xs font-black hover:bg-slate-50 transition-all shadow-sm uppercase tracking-wider">
              <Download size={16} /> Exporter PDF
            </button>

            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg uppercase tracking-widest"
              >
                <Edit3 size={16} /> Modifier
              </button>
            ) : (
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 bg-rose-50 text-rose-600 border border-rose-100 px-6 py-2.5 rounded-xl text-xs font-black hover:bg-rose-100 transition-all uppercase tracking-widest"
              >
                <X size={16} /> Annuler
              </button>
            )}
          </div>
        </div>

        {/* YEAR SELECTION & MODIFICATION BADGE */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 mb-8 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-6 w-full justify-between">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-4 tracking-tight">Année de référence</span>
              <div className="relative flex items-center">
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={isEditing}
                  className="bg-transparent text-xl font-bold text-[#003366] outline-none cursor-pointer appearance-none pr-6 z-10 disabled:opacity-50"
                >
                  {availableYears.map(item => (
                    <option key={item.id || item.year} value={item.year}>{item.year}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-0 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Last Modified Badge */}
            {lastModified && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <Clock size={14} className="text-slate-400" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Dernière mise à jour</span>
                  <span className="text-[11px] font-bold text-slate-600">
                    {new Date(lastModified).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN CONFIGURATION AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Section: Âge Légal */}
          <div className="lg:col-span-1">
            <div className={`bg-white h-full rounded-2xl border transition-all duration-300 ${isEditing ? 'border-indigo-200 shadow-md' : 'border-slate-200 shadow-sm opacity-95'}`}>
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
                <div className={`${isEditing ? 'bg-indigo-600' : 'bg-[#003366]'} p-1.5 rounded text-white transition-colors`}>
                  <UserCheck size={16}/>
                </div>
                <h2 className="font-bold text-slate-700 uppercase text-sm tracking-tight">Cadre Légal</h2>
              </div>
              
              <div className="p-6">
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Âge légal de départ</label>
                <div className={`flex items-center border rounded-xl px-4 py-4 transition-all ${isEditing ? 'bg-white border-indigo-500 ring-4 ring-indigo-50' : 'bg-slate-50 border-slate-100 cursor-not-allowed'}`}>
                  <input 
                    disabled={!isEditing}
                    type="number"
                    className="bg-transparent w-full outline-none font-bold text-2xl text-slate-700 disabled:text-slate-400"
                    value={retraiteData.age_legal}
                    onChange={(e) => setRetraiteData({...retraiteData, age_legal: parseInt(e.target.value) || 0})}
                  />
                  <span className="text-slate-300 font-bold ml-2">ANS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Prolongation Policy */}
          <div className="lg:col-span-2">
            <div className={`bg-white rounded-2xl border transition-all duration-300 ${isEditing ? 'border-emerald-200 shadow-md' : 'border-slate-200 shadow-sm opacity-95'}`}>
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`${isEditing ? 'bg-emerald-600' : 'bg-slate-400'} p-1.5 rounded text-white transition-colors`}>
                    <Clock size={16}/>
                  </div>
                  <h2 className="font-bold text-slate-700 uppercase text-sm tracking-tight">Politique de Prolongation</h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Durée Max (Ans)</label>
                    <div className={`flex items-center border rounded-xl px-4 py-3 transition-all ${isEditing ? 'bg-white border-emerald-500 ring-4 ring-emerald-50' : 'bg-slate-50 border-slate-100 cursor-not-allowed'}`}>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        className="bg-transparent w-full outline-none font-bold text-xl text-slate-700 disabled:text-slate-400"
                        value={retraiteData.duree_max}
                        onChange={(e) => setRetraiteData({...retraiteData, duree_max: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1.5 tracking-widest">Renouvelable (Fois)</label>
                    <div className={`flex items-center border rounded-xl px-4 py-3 transition-all ${isEditing ? 'bg-white border-indigo-500 ring-4 ring-indigo-50' : 'bg-slate-50 border-slate-100 cursor-not-allowed'}`}>
                      <input 
                        disabled={!isEditing}
                        type="number"
                        className="bg-transparent w-full outline-none font-bold text-xl text-slate-700 disabled:text-slate-400"
                        value={retraiteData.nb_fois}
                        onChange={(e) => setRetraiteData({...retraiteData, nb_fois: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                </div>
                
                <p className="mt-6 text-[11px] text-slate-400 leading-relaxed italic border-t border-slate-50 pt-4">
                  * Ces paramètres définissent les limites maximales autorisées pour chaque demande de prolongation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        {isEditing && (
          <div className="mt-12 flex justify-end animate-in fade-in slide-in-from-bottom-4">
            <button 
              onClick={handleSave} 
              disabled={loading} 
              className="flex items-center gap-3 bg-[#003366] text-white px-12 py-4 rounded-2xl text-xs font-black hover:bg-[#002244] shadow-2xl transition-all uppercase tracking-[0.2em] active:scale-95 disabled:opacity-50"
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