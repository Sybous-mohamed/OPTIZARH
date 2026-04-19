import React, { useState, useEffect } from 'react';
import api from "../../lib/apis/axiosConfig";
import { Trash2, Edit3, Plus, ChevronDown, X, Inbox } from 'lucide-react';

export default function Cotisation() {
  const [selectedYear, setSelectedYear] = useState('2026');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [organismes, setOrganismes] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    nom: '',
    type: 'Sécurité Sociale',
    taux: '',
    plafond: '',
    year: '2026',
    mgpap: false,
    omfam: false,
    rattachement: ''
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const allRes = await api.get(`/api/cotisations`);
      const allData = allRes.data;

      const yearsInDb = [...new Set(allData.flatMap(org => org.rules.map(r => r.year.toString())))].sort((a, b) => b - a);

      if (yearsInDb.length > 0) {
        setAvailableYears(yearsInDb);
        const currentYearHasData = allData.some(org => org.rules.some(r => r.year.toString() === selectedYear));
        
        if (!currentYearHasData) {
          setSelectedYear(yearsInDb[0]);
          return; 
        }

        const filtered = allData.filter(org => org.rules.some(r => r.year.toString() === selectedYear));
        setOrganismes(filtered);
      } else {
        setAvailableYears([]);
        setOrganismes([]);
      }
    } catch (err) {
      console.error("Erreur Fetch:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    let parts = [];
    if (formData.mgpap) parts.push('MGPAP');
    if (formData.omfam) parts.push('OMFAM');
    setFormData(prev => ({ ...prev, rattachement: parts.join(' + ') }));
  }, [formData.mgpap, formData.omfam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedId) {
        await api.put(`/api/cotisations/${selectedId}`, formData);
      } else {
        await api.post('/api/cotisations', formData);
      }
      closeModal();
      fetchData();
    } catch (err) {
      alert("Erreur lors de l'enregistrement");
    }
  };

  const handleEditClick = (item) => {
    const rule = item.rules.find(r => r.year.toString() === selectedYear) || item.rules[0] || {};
    setSelectedId(item.id);
    setFormData({
      nom: item.nom,
      type: item.type,
      taux: rule.taux || '',
      plafond: rule.plafond || '',
      year: rule.year || selectedYear,
      mgpap: !!rule.mgpap,
      omfam: !!rule.omfam,
      rattachement: item.rattachement || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr ?")) {
      try {
        await api.delete(`/api/cotisations/${id}`);
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
    setFormData({
      nom: '', type: 'Sécurité Sociale', taux: '', plafond: '',
      year: selectedYear || '2026', mgpap: false, omfam: false, rattachement: ''
    });
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Cotisations Sociales</h1>
            <p className="text-slate-500 font-medium text-sm">Gestion des référentiels par année.</p>
          </div>
          
          {availableYears.length > 0 && (
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-full px-6 py-2.5 pr-12 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-3 text-slate-400 pointer-events-none" size={16} />
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {availableYears.length > 0 ? `Référentiel Organismes (${selectedYear})` : 'Référentiel'}
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 font-bold transition-all shadow-lg shadow-indigo-100"
            >
              <Plus size={20}/> Nouvel Organisme
            </button>
          </div>

          {organismes.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-4 pb-4">Organisme</th>
                    <th className="px-4 pb-4">Type</th>
                    <th className="px-4 pb-4">Taux</th>
                    <th className="px-4 pb-4">Plafond</th>
                    <th className="px-4 pb-4">Dernière mise à jour</th>
                    <th className="px-4 pb-4 text-center">MGPAP</th>
                    <th className="px-4 pb-4 text-center">OMFAM</th>
                    <th className="px-4 pb-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="before:block before:h-4">
                  {organismes.map((item) => {
                    const rule = item.rules.find(r => r.year.toString() === selectedYear);
                    if (!rule) return null;
                    
                    const formattedDate = item.updated_at ? new Date(item.updated_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    }) : '---';

                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/80 transition-all rounded-2xl">
                        <td className="px-4 py-6 font-extrabold text-slate-900">{item.nom}</td>
                        <td className="px-4 py-6 text-slate-400 font-medium text-sm">{item.type}</td>
                        <td className="px-4 py-6 font-bold text-indigo-600 text-lg">{rule.taux}%</td>
                        <td className="px-4 py-6 font-bold text-indigo-600 text-lg">{rule.plafond} DH</td>
                        <td className="px-4 py-6 text-slate-500 font-medium text-sm">{formattedDate}</td>
                        
                        {/* MGPAP */}
                        <td className="px-4 py-6 text-center">
                          <div className={`mx-auto w-10 h-5 rounded-full relative transition-colors ${rule.mgpap ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${rule.mgpap ? 'left-5.5' : 'left-0.5'}`} />
                          </div>
                        </td>

                        {/* OMFAM */}
                        <td className="px-4 py-6 text-center">
                          <div className={`mx-auto w-10 h-5 rounded-full relative transition-colors ${rule.omfam ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${rule.omfam ? 'left-5.5' : 'left-0.5'}`} />
                          </div>
                        </td>

                        <td className="px-4 py-6">
                          <div className="flex justify-center gap-3">
                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-300 hover:text-red-500 transition-all"><Trash2 size={20}/></button>
                            <button onClick={() => handleEditClick(item)} className="p-2 hover:bg-indigo-50 rounded-lg text-slate-300 hover:text-indigo-600 transition-all"><Edit3 size={20}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
              <Inbox size={60} strokeWidth={1} className="text-slate-200" />
              <p className="text-slate-400 font-bold">Aucune donnée pour {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <form onSubmit={handleSubmit} className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col">
                <div className="p-10 pb-4 flex justify-between items-start">
                  <h2 className="text-3xl font-black text-slate-800">{selectedId ? 'Modifier' : 'Ajouter'}</h2>
                  <button type="button" onClick={closeModal}><X size={28} className="text-slate-400"/></button>
                </div>
                <div className="p-10 pt-4 space-y-6">
                  <input required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="Organisme" className="w-full bg-slate-50 rounded-2xl p-4 outline-none font-bold"/>
                  <div className="grid grid-cols-2 gap-4">
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="bg-slate-50 rounded-2xl p-4 outline-none font-bold">
                        <option>Sécurité Sociale</option>
                        <option>Assurance Maladie</option>
                        <option>Retraite</option>
                        <option>Impôt Revenu</option>
                    </select>
                    <input required type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="Année" className="bg-slate-50 rounded-2xl p-4 outline-none font-bold"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <input required step="0.01" type="number" value={formData.taux} onChange={e => setFormData({...formData, taux: e.target.value})} placeholder="Taux %" className="bg-slate-50 rounded-2xl p-4 outline-none font-bold"/>
                    <input type="number" value={formData.plafond} onChange={e => setFormData({...formData, plafond: e.target.value})} placeholder="Plafond" className="bg-slate-50 rounded-2xl p-4 outline-none font-bold"/>
                  </div>
                  <div className="flex gap-8">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setFormData({...formData, mgpap: !formData.mgpap})} className={`w-10 h-5 rounded-full relative transition-colors ${formData.mgpap ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.mgpap ? 'left-5.5' : 'left-0.5'}`}/>
                        </div>
                        <span className="text-sm font-bold">MGPAP</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <div onClick={() => setFormData({...formData, omfam: !formData.omfam})} className={`w-10 h-5 rounded-full relative transition-colors ${formData.omfam ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.omfam ? 'left-5.5' : 'left-0.5'}`}/>
                        </div>
                        <span className="text-sm font-bold">OMFAM</span>
                     </label>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white p-4 rounded-2xl font-black shadow-lg">Enregistrer</button>
                </div>
           </form>
        </div>
      )}
    </div>
  );
}