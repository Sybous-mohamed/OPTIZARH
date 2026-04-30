import React, { useState, useEffect } from 'react';
import { 
  Plus, Trash2, Save, Building2, LayoutGrid, CheckCircle2, 
  Loader2, ChevronUp, ChevronDown, FileText, Database,
  TrendingUp, ShieldCheck, Star, Eye, EyeOff, Download
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';

const GestionCotisation = () => {
  const [config, setConfig] = useState({
    year: 2026,
    organismes: []
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [uiStates, setUiStates] = useState({});

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
      const response = await api.get(`/api/get-cotisations?year=${config.year}`);
      if (response.data && response.data.length > 0) {
        setConfig(prev => ({ ...prev, organismes: response.data }));
        // Initialiser les états UI (visible par défaut)
        const initialStates = {};
        response.data.forEach(org => {
          initialStates[org.id] = { 
            visible: true, 
            favorite: org.is_favorite 
          };
        });
        setUiStates(initialStates);
      } else {
        setConfig(prev => ({ ...prev, organismes: [] }));
      }
    } catch (error) {
      console.error("Erreur chargement:", error);
    } finally {
      setFetching(false);
    }
  };

useEffect(() => {
  fetchData();
}, [config.year]);

  const toggleVisibility = (id) => {
    setUiStates(prev => ({
      ...prev,
      [id]: { ...prev[id], visible: !prev[id]?.visible }
    }));
  };

  const addOrganisme = () => {
    const newId = Date.now();
    const newOrg = { id: newId, name: 'Nouvel Organisme', rubriques: [] };
    setConfig({ ...config, organismes: [...config.organismes, newOrg] });
    setUiStates(prev => ({ ...prev, [newId]: { visible: true, favorite: false } }));
  };

  const addRubrique = (orgId) => {
    const updatedOrgs = config.organismes.map(org => {
      if (org.id === orgId) {
        return {
          ...org,
          rubriques: [...org.rubriques, { id: Date.now(), label: '', type: 'Social', taux: '', plafond: '' }]
        };
      }
      return org;
    });
    setConfig({ ...config, organismes: updatedOrgs });
  };

  const updateRubrique = (orgId, rubId, field, val) => {
    const updatedOrgs = config.organismes.map(org => {
      if (org.id === orgId) {
        const newRubriques = org.rubriques.map(rub => rub.id === rubId ? { ...rub, [field]: val } : rub);
        return { ...org, rubriques: newRubriques };
      }
      return org;
    });
    setConfig({ ...config, organismes: updatedOrgs });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.post('/api/save-cotisations', config);
      await fetchData();
      setMessage('Configuration enregistrée !');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      alert("Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id) => {
    const currentStatus = uiStates[id]?.favorite || false;
    const newStatus = !currentStatus;

    try {
      // 1. Appel API bach i-proupagé l-ga3 les années
      const response = await api.post(`/api/favorite/${id}`, {
        is_favorite: newStatus
      });

      if (response.status === 200) {
        // 2. ILA khetat, updata l-UI localement
        setUiStates(prev => ({
          ...prev,
          [id]: { ...prev[id], favorite: newStatus }
        }));
        
        // 3. Refresh bach t-chouf les changements ila bghiti
        fetchData();
        setMessage(response.data.message);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error("Erreur propagation favorite:", error);
      alert("Ma-mkanch n-syncronisiw les années lokhrin");
    }
  };

  const exportPDF = () => {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // --- Header dyal l-PDF ---
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102); // Dik l-loun l-zreq dyal l-UI (#003366)
  doc.text(`Paramétrage des Cotisations - ${config.year}`, 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Généré le: ${dateStr}`, 14, 28);
  
  let currentY = 35;

  // --- Boucle 3la ga3 les organismes ---
  config.organismes.forEach((org, index) => {
    // Check ila khassna n-bdaw page jdida (bach may-t-qte3ch l-PDF)
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Ism l-Organisme
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(org.name, 14, currentY);
    
    // Icone sghira (Optionnel)
    doc.setDrawColor(0, 51, 102);
    doc.line(14, currentY + 2, 40, currentY + 2);

    // Tabla dyal les rubriques
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
      headStyles: { 
        fillColor: [0, 51, 102], // #003366
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { halign: 'center' },
        2: { halign: 'center' }
      },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: 14, right: 14 }
    });

    // Update l-position dyal currentY bach l-organisme l-jdid ibda men thét tabla
    currentY = doc.lastAutoTable.finalY + 15;
  });

  // Sauvegarder l-ficher
  doc.save(`Cotisations_${config.year}.pdf`);
};

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 font-sans antialiased text-slate-900 pb-32">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER AREA (STYLE SCREENSHOT) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 mb-8 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            {/* YEAR PICKER */}
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg px-4 py-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase mr-4 tracking-tight">Année</span>
              <select 
                value={config.year}
                onChange={(e) => setConfig(prev => ({...prev, year: parseInt(e.target.value)}))}
                className="bg-transparent text-xl font-bold text-[#003366] outline-none cursor-pointer appearance-none"
              >
                {availableYears.map(y => (
                  <option key={y.id} value={y.year || y.annee}>
                    {y.year || y.annee}
                  </option>
                ))}
              </select>
            </div>

            {/* EXPORTER PDF (PINK BUTTON) */}
            <button 
            onClick={exportPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#ff2d55] text-white rounded-xl font-bold text-xs hover:bg-[#e6294d] transition-all shadow-sm uppercase tracking-wide">
              <Download size={18} /> Exporter PDF
            </button>

            {/* NOUVEAU TYPE (TEAL BUTTON) */}
            <button onClick={addOrganisme} className="flex items-center gap-2 px-5 py-2.5 bg-[#00a878] text-white rounded-xl font-bold text-xs hover:bg-[#008f66] transition-all shadow-sm uppercase tracking-wide">
              <Plus size={18} /> Nouveau Type
            </button>
          </div>

          {fetching && <Loader2 className="animate-spin text-blue-600" size={20} />}
          {message && <div className="text-emerald-600 font-bold text-sm flex items-center gap-2"><CheckCircle2 size={16}/> {message}</div>}
        </div>

        {/* ORGANISMES LIST */}
        <div className="space-y-6">
          {config.organismes.map((org) => (
            <div key={org.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* CARD HEADER */}
              <div className="px-6 py-4 border-b border-slate-50 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="bg-[#003366] p-2 rounded-lg text-white">
                    <FileText size={18}/>
                  </div>
                  <input 
                    className="font-bold text-slate-800 text-lg outline-none bg-transparent focus:border-b border-blue-500"
                    value={org.name}
                    onChange={(e) => {
                      const updated = config.organismes.map(o => o.id === org.id ? {...o, name: e.target.value} : o);
                      setConfig({...config, organismes: updated});
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  {/* FAVORITE BUTTON */}
                  <button 
                    onClick={() => toggleFavorite(org.id)} // Khaliha toggleFavorite hit bdlnaha l-fou9
                    className={`p-2 rounded-lg transition-all ${uiStates[org.id]?.favorite ? 'text-yellow-500 bg-yellow-50' : 'text-slate-300 hover:bg-slate-50'}`}>
                    <Star size={20} fill={uiStates[org.id]?.favorite ? "currentColor" : "none"} />
                  </button>

                  {/* VISIBILITY TOGGLE (EYE) */}
                  <button 
                    onClick={() => toggleVisibility(org.id)}
                    className={`p-2 rounded-lg transition-all ${uiStates[org.id]?.visible ? 'text-blue-500 bg-blue-50' : 'text-slate-300 hover:bg-slate-50'}`}
                  >
                    {uiStates[org.id]?.visible ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>

                  <div className="w-px h-6 bg-slate-100 mx-1" />

                  <button onClick={() => setConfig({...config, organismes: config.organismes.filter(o => o.id !== org.id)})} className="text-slate-300 hover:text-rose-500 p-2">
                    <Trash2 size={20}/>
                  </button>
                </div>
              </div>

              {/* CARD CONTENT (TOGGLEABLE) */}
              {uiStates[org.id]?.visible && (
                <div className="p-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
                        <th className="pb-4 w-1/3">Désignation</th>
                        <th className="pb-4 text-center">Plafond (DH)</th>
                        <th className="pb-4 text-center">Taux (%)</th>
                        <th className="pb-4 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {org.rubriques.map((rub) => (
                        <tr key={rub.id}>
                          <td className="py-4 pr-4">
                            <input 
                              className="w-full bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-sm focus:bg-white focus:ring-2 ring-blue-500/10 outline-none transition-all"
                              value={rub.label}
                              placeholder="ex: RC"
                              onChange={(e) => updateRubrique(org.id, rub.id, 'label', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <input 
                              type="number"
                              className="w-32 mx-auto block bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-sm font-bold text-slate-700 text-center outline-none"
                              value={rub.plafond}
                              placeholder="0.00"
                              onChange={(e) => updateRubrique(org.id, rub.id, 'plafond', e.target.value)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="relative w-28 mx-auto">
                              <input 
                                type="number"
                                className="w-full bg-blue-50/30 border border-blue-100 rounded-xl p-3 text-sm font-bold text-blue-600 text-center outline-none"
                                value={rub.taux}
                                onChange={(e) => updateRubrique(org.id, rub.id, 'taux', e.target.value)}
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-300 text-xs font-bold">%</span>
                            </div>
                          </td>
                          <td className="py-4">
                            <button onClick={() => {
                              const updated = config.organismes.map(o => o.id === org.id ? {...o, rubriques: o.rubriques.filter(r => r.id !== rub.id)} : o);
                              setConfig({...config, organismes: updated});
                            }} className="text-slate-200 hover:text-rose-500 transition-colors">
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button onClick={() => addRubrique(org.id)} className="mt-6 text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline uppercase tracking-tight">
                    <Plus size={16} /> Ajouter une ligne
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* FOOTER SAVE BAR */}
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="bg-[#003366] hover:bg-[#002244] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all transform hover:scale-105 disabled:opacity-70"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            <span className="font-bold uppercase tracking-widest text-sm">Sauvegarder le paramétrage</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default GestionCotisation;