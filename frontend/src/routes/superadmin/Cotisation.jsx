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
    <div className="bg-[#F8FAFC] dark:bg-[#0a0a0a] min-h-screen font-sans text-slate-900 dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Cotisations Sociales</h1>
            <p className="text-slate-500 dark:text-gray-500 font-medium text-sm italic uppercase tracking-tighter">Gestion des référentiels par année.</p>
          </div>
          
          {availableYears.length > 0 && (
            <div className="relative">
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none bg-white dark:bg-[#1c1c1c] border border-slate-200 dark:border-[#262626] rounded-full px-6 py-2.5 pr-12 text-sm font-bold text-slate-700 dark:text-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-3 text-slate-400 dark:text-gray-600 pointer-events-none" size={16} />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#121212] p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-[#262626] min-h-[500px] flex flex-col transition-all">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {availableYears.length > 0 ? `Référentiel Organismes (${selectedYear})` : 'Référentiel'}
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-indigo-600 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 hover:bg-indigo-700 font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-95"
            >
              <Plus size={20}/> Nouvel Organisme
            </button>
          </div>

          {organismes.length > 0 ? (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-slate-400 dark:text-gray-500 text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-6 pb-4">Organisme</th>
                    <th className="px-6 pb-4">Type</th>
                    <th className="px-6 pb-4">Taux</th>
                    <th className="px-6 pb-4">Plafond</th>
                    <th className="px-6 pb-4">Mise à jour</th>
                    <th className="px-4 pb-4 text-center">MGPAP</th>
                    <th className="px-4 pb-4 text-center">OMFAM</th>
                    <th className="px-6 pb-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="before:block before:h-2">
                  {organismes.map((item) => {
                    const rule = item.rules.find(r => r.year.toString() === selectedYear);
                    if (!rule) return null;
                    
                    const formattedDate = item.updated_at ? new Date(item.updated_at).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    }) : '---';

                    return (
                      <tr key={item.id} className="group bg-slate-50/50 dark:bg-[#1c1c1c]/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all">
                        <td className="px-6 py-5 font-black text-slate-900 dark:text-white rounded-l-2xl">{item.nom}</td>
                        <td className="px-6 py-5 text-slate-500 dark:text-gray-400 font-bold text-xs uppercase">{item.type}</td>
                        <td className="px-6 py-5 font-black text-indigo-600 dark:text-indigo-400 text-lg">{rule.taux}%</td>
                        <td className="px-6 py-5 font-black text-slate-700 dark:text-gray-300">{rule.plafond} <span className="text-[10px] text-slate-400">DH</span></td>
                        <td className="px-6 py-5 text-slate-400 dark:text-gray-500 font-medium text-xs">{formattedDate}</td>
                        
                        {/* MGPAP Toggle View */}
                        <td className="px-4 py-5 text-center">
                          <div className={`mx-auto w-9 h-5 rounded-full relative transition-colors ${rule.mgpap ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-[#333]'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${rule.mgpap ? 'left-4.5' : 'left-0.5'}`} />
                          </div>
                        </td>

                        {/* OMFAM Toggle View */}
                        <td className="px-4 py-5 text-center">
                          <div className={`mx-auto w-9 h-5 rounded-full relative transition-colors ${rule.omfam ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-[#333]'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${rule.omfam ? 'left-4.5' : 'left-0.5'}`} />
                          </div>
                        </td>

                        <td className="px-6 py-5 rounded-r-2xl">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => handleEditClick(item)} className="p-2 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-400 transition-all"><Edit3 size={18}/></button>
                            <button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-red-500 hover:text-white rounded-xl text-slate-400 transition-all"><Trash2 size={18}/></button>
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
              <Inbox size={60} strokeWidth={1} className="text-slate-200 dark:text-[#262626]" />
              <p className="text-slate-400 dark:text-gray-600 font-bold uppercase text-xs tracking-widest">Aucune donnée pour {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Section */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-300">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#121212] w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col border border-transparent dark:border-[#262626]">
                <div className="p-10 pb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white">{selectedId ? 'Modifier' : 'Ajouter'}</h2>
                    <p className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">Détails de l'organisme social</p>
                  </div>
                  <button type="button" onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-[#1c1c1c] rounded-full transition-colors">
                    <X size={28} className="text-slate-400"/>
                  </button>
                </div>

                <div className="p-10 pt-4 space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nom de l'organisme</label>
                    <input required value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="Ex: CNSS, CIMR..." className="w-full bg-slate-50 dark:bg-[#1c1c1c] dark:text-white dark:border-[#262626] border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"/>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                      <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-slate-50 dark:bg-[#1c1c1c] dark:text-white dark:border-[#262626] border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold appearance-none cursor-pointer">
                          <option>Sécurité Sociale</option>
                          <option>Assurance Maladie</option>
                          <option>Retraite</option>
                          <option>Impôt Revenu</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Année</label>
                      <input required type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} placeholder="2024" className="w-full bg-slate-50 dark:bg-[#1c1c1c] dark:text-white dark:border-[#262626] border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"/>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taux (%)</label>
                      <input required step="0.01" type="number" value={formData.taux} onChange={e => setFormData({...formData, taux: e.target.value})} placeholder="0.00" className="w-full bg-slate-50 dark:bg-[#1c1c1c] dark:text-white dark:border-[#262626] border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plafond (DH)</label>
                      <input type="number" value={formData.plafond} onChange={e => setFormData({...formData, plafond: e.target.value})} placeholder="Laisser vide si aucun" className="w-full bg-slate-50 dark:bg-[#1c1c1c] dark:text-white dark:border-[#262626] border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all"/>
                    </div>
                  </div>

                  <div className="flex gap-8 py-2">
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div onClick={() => setFormData({...formData, mgpap: !formData.mgpap})} className={`w-10 h-5 rounded-full relative transition-colors ${formData.mgpap ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-[#333]'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.mgpap ? 'left-5.5' : 'left-0.5'}`}/>
                        </div>
                        <span className="text-xs font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">MGPAP</span>
                     </label>
                     <label className="flex items-center gap-3 cursor-pointer group">
                        <div onClick={() => setFormData({...formData, omfam: !formData.omfam})} className={`w-10 h-5 rounded-full relative transition-colors ${formData.omfam ? 'bg-indigo-600' : 'bg-slate-200 dark:bg-[#333]'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${formData.omfam ? 'left-5.5' : 'left-0.5'}`}/>
                        </div>
                        <span className="text-xs font-black text-slate-600 dark:text-gray-400 uppercase tracking-widest">OMFAM</span>
                     </label>
                  </div>

                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] mt-4">
                    Enregistrer les données
                  </button>
                </div>
            </form>
        </div>
      )}
    </div>
  );
}