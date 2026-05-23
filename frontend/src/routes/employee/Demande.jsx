import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { 
  Calendar, FileText, Paperclip, Send, Clock, 
  CheckCircle2, AlertCircle, Loader2, ChevronRight, Folder, ListTree, X,
  LayoutDashboard, Info, User, Eye
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const EmployeeLeave = () => {
  const { showNotification } = useNotification();
  const { darkMode } = useTheme();

  const [years, setYears] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [displayYear, setDisplayYear] = useState(''); 
  const [detailModal, setDetailModal] = useState({ show: false, req: null });
  const [categories, setCategories] = useState([]); 
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Styles pour le thème noir élégant
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800';
  const hoverClass = darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50';

  const tomorrowStr = useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  }, []);

  const [formData, setFormData] = useState({
    category_id: '',
    leave_type_id: '',
    start_date: '',
    end_date: '',
    duration: 0,
    comments: '',
    attachment: null 
  });

  useEffect(() => {
    const fetchAndSetCurrentYear = async () => {
      try {
        const res = await api.get('/api/salary-years');
        setYears(res.data);
        const currentYearValue = new Date().getFullYear().toString();
        const foundYear = res.data.find(y => y.year.toString() === currentYearValue);
        
        if (foundYear) {
          setSelectedYear(foundYear.id);
          setDisplayYear(foundYear.year);
        } else if (res.data.length > 0) {
          setSelectedYear(res.data[0].id);
          setDisplayYear(res.data[0].year);
        }
      } catch (err) {
        showNotification("Erreur lors de la récupération de l'année", 'error');
      }
    };
    fetchAndSetCurrentYear();
  }, []);

  useEffect(() => {
    if (selectedYear) fetchData();
  }, [selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, historyRes] = await Promise.all([
        api.get(`/api/leave-config/full/${selectedYear}`),
        api.get(`/api/leave-requests/my-history`)
      ]);
      setCategories(configRes.data);
      setRequests(historyRes.data);
    } catch (err) {
      showNotification("Erreur chargement des données", 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryTypes = categories.find(c => c.id.toString() === formData.category_id)?.types || [];
  const selectedType = selectedCategoryTypes.find(t => t.id.toString() === formData.leave_type_id);
  const isDateRequired = selectedType && selectedType.max_days_per_request > 0;

  useEffect(() => {
    if (isDateRequired && formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setFormData(prev => ({ ...prev, duration: diff > 0 ? diff : 0 }));
    } else {
      setFormData(prev => ({ ...prev, duration: 0 }));
    }
  }, [formData.start_date, formData.end_date, isDateRequired]);

  const getStatusStyles = (status) => {
    switch(status) {
      case 'APPROVED': 
        return { bg: 'bg-emerald-500', text: 'text-white', label: 'Approuvé' };
      case 'REJECTED': 
        return { bg: 'bg-rose-500', text: 'text-white', label: 'Refusé' };
      default: 
        return { bg: 'bg-amber-500', text: 'text-white', label: 'En Attente' };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedYear) {
      showNotification("Veuillez sélectionner une année", 'error');
      return;
    }
    if (!formData.leave_type_id) {
      showNotification("Veuillez sélectionner un type de congé", 'error');
      return;
    }
    
    if (isDateRequired) {
      if (!formData.start_date) {
        showNotification("Veuillez sélectionner une date de début", 'error');
        return;
      }
      if (!formData.end_date) {
        showNotification("Veuillez sélectionner une date de fin", 'error');
        return;
      }
      if (formData.start_date < tomorrowStr) {
        showNotification("La date de début doit être à partir de demain", 'error');
        return;
      }
      if (formData.end_date < formData.start_date) {
        showNotification("La date de fin doit être après la date de début", 'error');
        return;
      }
    }

    setSubmitting(true);
    const data = new FormData();
    data.append('leave_type_id', formData.leave_type_id);
    data.append('salary_year_id', selectedYear);
    
    if (isDateRequired) {
      data.append('start_date', formData.start_date);
      data.append('end_date', formData.end_date);
      data.append('duration', formData.duration);
    } else {
      data.append('duration', 0);
      data.append('start_date', '');
      data.append('end_date', '');
    }
    
    data.append('comments', formData.comments || '');
    if (formData.attachment) data.append('attachment', formData.attachment);

    try {
      const response = await api.post('/api/leave-requests/store', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      showNotification(response.data.message || 'Demande envoyée avec succès!', 'success');
      
      setFormData({ 
        category_id: '', leave_type_id: '', start_date: '', end_date: '', 
        duration: 0, comments: '', attachment: null 
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      await fetchData();
      
    } catch (err) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const firstError = Object.values(errors)[0];
        showNotification(firstError[0] || 'Erreur de validation', 'error');
      } else if (err.response?.data?.error) {
        showNotification(err.response.data.error, 'error');
      } else {
        showNotification("Une erreur est survenue lors de l'envoi", 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto p-2 md:p-3 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${textClass} flex items-center gap-3`}>
              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                <LayoutDashboard size={22} className="text-white" />
              </div>
              Espace Congés
            </h1>
            <p className={`text-sm ${textMutedClass} mt-2`}>
              Gestion des demandes d'absence • Année: <span className={`font-semibold ${textClass} bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md`}>{displayYear || '...'}</span>
            </p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${cardClass} border ${borderClass}`}>
            <Calendar size={16} className="text-indigo-500" />
            <span className={`text-sm font-medium ${textClass}`}>Session: {displayYear || '...'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Formulaire */}
          <div className="lg:col-span-5">
            <div className={`${cardClass} rounded-xl border ${borderClass} p-6 shadow-xl`}>
              <h2 className={`text-lg font-bold ${textClass} mb-4 flex items-center gap-2`}>
                <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
                Nouvelle Demande
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className={`text-xs font-medium ${textMutedClass} block mb-1`}>Catégorie</label>
                  <select required
                    className={`w-full p-2.5 rounded-lg border ${borderClass} ${inputClass} outline-none focus:ring-2 focus:ring-indigo-500`}
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value, leave_type_id: '' })}>
                    <option value="">Sélectionnez la catégorie</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                </div>

                {formData.category_id && (
                  <div>
                    <label className={`text-xs font-medium ${textMutedClass} block mb-1`}>Type d'absence</label>
                    <select required
                      className={`w-full p-2.5 rounded-lg border ${borderClass} ${inputClass} outline-none focus:ring-2 focus:ring-indigo-500`}
                      value={formData.leave_type_id}
                      onChange={e => setFormData({...formData, leave_type_id: e.target.value})}>
                      <option value="">Choisissez le type</option>
                      {selectedCategoryTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name} (Max {t.max_days_per_request}j)</option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.leave_type_id && (
                  <div className="space-y-4">
                    {isDateRequired ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className={`text-xs font-medium ${textMutedClass} block mb-1`}>Date début</label>
                          <input type="date" required min={tomorrowStr}
                            className={`w-full p-2.5 rounded-lg border ${borderClass} ${inputClass} outline-none focus:ring-2 focus:ring-indigo-500`}
                            value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
                        </div>
                        <div>
                          <label className={`text-xs font-medium ${textMutedClass} block mb-1`}>Date fin</label>
                          <input type="date" required min={formData.start_date || tomorrowStr}
                            className={`w-full p-2.5 rounded-lg border ${borderClass} ${inputClass} outline-none focus:ring-2 focus:ring-indigo-500`}
                            value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
                        </div>
                        {formData.duration > 0 && (
                          <div className="col-span-2 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-center">
                            <span className={`text-sm font-bold text-indigo-600 dark:text-indigo-400`}>
                              {formData.duration} jour{formData.duration > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={`p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-2`}>
                        <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">
                          Un justificatif officiel est nécessaire pour ce type de demande
                        </p>
                      </div>
                    )}

                    <div>
                      <label className={`text-xs font-medium ${textMutedClass} block mb-1`}>Pièce jointe</label>
                      <input type="file" ref={fileInputRef} className="hidden" id="file-upload" 
                        onChange={e => setFormData({...formData, attachment: e.target.files[0]})} />
                      <label htmlFor="file-upload" 
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed ${borderClass} ${inputClass} cursor-pointer hover:border-indigo-500 transition-all`}>
                        <Paperclip size={16} className="text-indigo-500" />
                        <span className={`text-sm ${textMutedClass}`}>
                          {formData.attachment ? formData.attachment.name : "Cliquez pour ajouter un fichier"}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className={`text-xs font-medium ${textMutedClass} block mb-1`}>Commentaires</label>
                      <textarea rows={3}
                        className={`w-full p-2.5 rounded-lg border ${borderClass} ${inputClass} outline-none focus:ring-2 focus:ring-indigo-500 resize-none`}
                        value={formData.comments} onChange={e => setFormData({...formData, comments: e.target.value})} />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={submitting || !formData.leave_type_id}
                  className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Envoyer la demande</>}
                </button>
              </form>
            </div>
          </div>

          {/* Historique */}
          <div className="lg:col-span-7">
            <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden shadow-xl`}>
              <div className={`p-4 border-b ${borderClass} flex justify-between items-center`}>
                <h2 className={`font-bold ${textClass}`}>Historique des demandes</h2>
                <Clock size={18} className={textMutedClass} />
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <div className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" size={28} /></div>
                ) : requests.length === 0 ? (
                  <div className={`p-12 text-center ${textMutedClass}`}>
                    <Calendar size={48} className="mx-auto mb-3 opacity-30" />
                    <p>Aucune demande effectuée</p>
                  </div>
                ) : (
                  requests.map((req, idx) => {
                    const status = getStatusStyles(req.status);
                    return (
                      <div key={req.id} onClick={() => setDetailModal({ show: true, req })}
                        className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${hoverClass} ${idx % 2 === 0 ? (darkMode ? 'bg-black/20' : 'bg-gray-50/30') : ''}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg ${status.bg} flex items-center justify-center text-white shadow-md`}>
                            {req.duration}
                          </div>
                          <div>
                            <p className={`font-medium ${textClass}`}>{req.leave_type?.name}</p>
                            <p className={`text-xs ${textMutedClass}`}>
                            {req.start_date ? (
                            <>
                                {new Date(req.start_date).toLocaleDateString('fr-FR')} → {new Date(req.end_date).toLocaleDateString('fr-FR')}
                            </>
                            ) : 'Document seul'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-medium ${status.bg} text-white`}>
                            {status.label}
                          </span>
                          <ChevronRight size={16} className={textMutedClass} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Detail Modal */}
        {detailModal.show && detailModal.req && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl`}>
              <div className={`sticky top-0 p-4 border-b ${borderClass} flex justify-between items-center ${cardClass}`}>
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-indigo-500" />
                  <h3 className={`font-bold ${textClass}`}>Détails de la demande</h3>
                </div>
                <button onClick={() => setDetailModal({ show: false, req: null })} 
                  className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525] transition-all cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <p className={`text-xs uppercase ${textMutedClass}`}>Type d'absence</p>
                  <p className={`font-medium ${textClass}`}>{detailModal.req.leave_type?.name}</p>
                </div>
                {detailModal.req.start_date && (
                  <div>
                    <p className={`text-xs uppercase ${textMutedClass}`}>Période</p>
                    <p className={`font-medium ${textClass}`}>{detailModal.req.start_date ? (
                            <>
                                {new Date(detailModal.req.start_date).toLocaleDateString('fr-FR')} → {new Date(detailModal.req.end_date).toLocaleDateString('fr-FR')}
                            </>
                            ) : 'Document seul'}</p>
                  </div>
                )}
                <div>
                  <p className={`text-xs uppercase ${textMutedClass}`}>Durée</p>
                  <p className={`font-medium ${textClass}`}>{detailModal.req.duration} jours</p>
                </div>
                {detailModal.req.comments && (
                  <div>
                    <p className={`text-xs uppercase ${textMutedClass}`}>Commentaires</p>
                    <p className={`text-sm ${textMutedClass}`}>{detailModal.req.comments}</p>
                  </div>
                )}
                <div className="pt-2">
                  <div className={`p-3 rounded-lg ${
                    detailModal.req.status === 'APPROVED' ? 'bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800' : 
                    detailModal.req.status === 'REJECTED' ? 'bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800' : 
                    'bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      {detailModal.req.status === 'APPROVED' && <CheckCircle2 size={16} className="text-emerald-600" />}
                      {detailModal.req.status === 'REJECTED' && <X size={16} className="text-rose-600" />}
                      {detailModal.req.status === 'PENDING' && <Clock size={16} className="text-amber-600" />}
                      <span className={`text-sm font-medium ${
                        detailModal.req.status === 'APPROVED' ? 'text-emerald-700 dark:text-emerald-400' : 
                        detailModal.req.status === 'REJECTED' ? 'text-rose-700 dark:text-rose-400' : 
                        'text-amber-700 dark:text-amber-400'
                      }`}>
                        {detailModal.req.status === 'APPROVED' ? 'Approuvé' : detailModal.req.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                      </span>
                    </div>
                    {detailModal.req.hr_note && (
                      <p className={`text-xs mt-2 ${textMutedClass}`}>Note RH: {detailModal.req.hr_note}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeLeave;