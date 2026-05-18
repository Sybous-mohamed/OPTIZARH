import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { 
  CheckCheck, X, Calendar, User, FileText, ExternalLink, 
  MessageSquare, Loader2, Clock, Eye, FileDown, Info, 
  ChevronRight, Search, Filter, Users, Building2, 
  CheckCircle, XCircle, Clock as ClockIcon, Trash2,
  Menu, X as XIcon
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';

const HRLeaveManagement = () => {
  const { darkMode } = useTheme();
  const { showNotification } = useNotification();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const getAttachmentUrl = (path) => {
    if (!path) return null;
    return `http://localhost:8000/storage/${path}`;
  };
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [noteModal, setNoteModal] = useState({ show: false, req: null, action: '' });
  const [detailModal, setDetailModal] = useState({ show: false, req: null });
  const [hrNote, setHrNote] = useState('');

  // Styles responsive
  const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
  const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
  const textClass = darkMode ? 'text-white' : 'text-gray-800';
  const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
  const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
  const inputClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-800';
  const hoverClass = darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50';
  
  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/hr/leaves/all');
      setRequests(res.data);
    } catch (err) {
      showNotification('Erreur lors du chargement des demandes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const processRequest = async () => {
    const { req, action } = noteModal;
    setProcessingId(req.id);
    try {
      await api.post(`/api/hr/leaves/update-status/${req.id}`, {
        status: action,
        hr_note: hrNote,
        salary_year_id: req.salary_year_id 
      });
      showNotification(`Demande ${action === 'APPROVED' ? 'approuvée' : 'refusée'} avec succès`, 'success');
      setNoteModal({ show: false, req: null, action: '' });
      setDetailModal({ show: false, req: null });
      setHrNote('');
      fetchRequests();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const generatePDF = (req) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246);
    doc.text("OPTIZARH - DEMANDE DE CONGÉ", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Réf: REQ-${req.id} | Date: ${new Date().toLocaleDateString()}`, 105, 28, { align: 'center' });

    autoTable(doc, {
      startY: 40,
      head: [['Information de l\'Employé', 'Détails']],
      body: [
        ['Nom Complet', `${req.employee?.nom} ${req.employee?.prenom}`],
        ['Email', req.employee?.email || 'N/A'],
        ['Poste', req.employee?.poste_name || req.employee?.grade || 'N/A'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 10,
      head: [['Détails de la Demande', 'Valeur']],
      body: [
        ['Catégorie', req.leave_type?.category?.category_name || 'N/A'],
        ['Type d\'absence', req.leave_type?.name],
        ['Période', req.start_date ? `Du ${req.start_date} au ${req.end_date}` : 'Document Seul'],
        ['Durée totale', `${req.duration} Jours`],
        ['Statut Actuel', req.status === 'APPROVED' ? 'Approuvé' : req.status === 'REJECTED' ? 'Refusé' : 'En Attente'],
        ['Commentaires Employé', req.comments || 'Aucun'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85] }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(10);
    doc.text("Signature Employé", 40, finalY);
    doc.text("Cachet & Signature RH", 140, finalY);

    doc.save(`Demande_Conge_${req.employee?.nom}_${req.id}.pdf`);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'APPROVED':
        return { color: 'bg-emerald-500', icon: CheckCircle, text: 'Approuvé' };
      case 'REJECTED':
        return { color: 'bg-rose-500', icon: XCircle, text: 'Refusé' };
      default:
        return { color: 'bg-amber-500', icon: ClockIcon, text: 'En Attente' };
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter !== 'ALL' && req.status !== filter) return false;
    if (searchTerm && !`${req.employee?.nom} ${req.employee?.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const stats = {
    pending: requests.filter(r => r.status === 'PENDING').length,
    approved: requests.filter(r => r.status === 'APPROVED').length,
    rejected: requests.filter(r => r.status === 'REJECTED').length,
    total: requests.length
  };

  // Filtres pour mobile
  const filterTabs = [
    { id: 'PENDING', label: 'En Attente', count: stats.pending, icon: ClockIcon },
    { id: 'APPROVED', label: 'Approuvés', count: stats.approved, icon: CheckCircle },
    { id: 'REJECTED', label: 'Refusés', count: stats.rejected, icon: XCircle },
    { id: 'ALL', label: 'Tous', count: stats.total, icon: Users },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto p-2 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className={`text-2xl md:text-3xl font-bold ${textClass} flex items-center gap-3`}>
              <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                <Users size={22} className="text-white" />
              </div>
              Gestion des Congés
            </h1>
            <p className={`text-sm ${textMutedClass} mt-2`}>
              Validation et suivi des demandes d'absence • Total: <span className={`font-semibold ${textClass}`}>{stats.total}</span> demandes
            </p>
          </div>
          <div className={`relative w-full md:w-64 ${cardClass} rounded-xl border ${borderClass}`}>
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} />
            <input
              type="text"
              placeholder="Rechercher un employé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl bg-transparent text-sm ${textClass} outline-none focus:ring-2 focus:ring-indigo-500`}
            />
          </div>
        </div>

        {/* Stats Cards - Grid responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total, color: 'from-indigo-600 to-indigo-600', icon: Users },
            { label: 'En Attente', value: stats.pending, color: 'from-orange-600 to-orange-600', icon: ClockIcon },
            { label: 'Approuvés', value: stats.approved, color: 'from-emerald-500 to-emerald-600', icon: CheckCircle },
            { label: 'Refusés', value: stats.rejected, color: 'from-red-600 to-red-600', icon: XCircle },
          ].map((stat, idx) => (
            <div key={idx} className={`${cardClass} rounded-xl border ${borderClass} p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-xs uppercase tracking-wider font-semibold ${textMutedClass}`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${textClass} mt-1`}>{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon size={18} className="text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Tabs - Responsive */}
        <div className="flex flex-wrap gap-2">
          {filterTabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filter === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : `${textMutedClass} ${hoverClass}`
                }`}
              >
                <TabIcon size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.count}</span>
                <span className="hidden sm:inline">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Requests Table - Responsive */}
        <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden shadow-xl`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className={darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-100 to-gray-200'}>
                <tr className={`text-left text-xs font-semibold uppercase tracking-wider ${textMutedClass}`}>
                  <th className="p-4">Employé</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 hidden md:table-cell">Durée</th>
                  <th className="p-4 hidden lg:table-cell">Période</th>
                  <th className="p-4 hidden sm:table-cell">Justificatif</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="p-12 text-center">
                      <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan="7" className={`p-12 text-center ${textMutedClass}`}>
                      <Users size={48} className="mx-auto mb-3 opacity-30" />
                      <p>Aucune demande trouvée</p>
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((req, idx) => {
                    const status = getStatusBadge(req.status);
                    const StatusIcon = status.icon;
                    return (
                      <tr key={req.id} className={`border-t ${borderClass} transition-colors duration-150 ${hoverClass} ${idx % 2 === 0 ? (darkMode ? 'bg-black/20' : 'bg-gray-50/30') : ''}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                              <span className="text-white text-xs md:text-sm font-bold">
                                {req.employee?.nom?.charAt(0)}{req.employee?.prenom?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className={`font-semibold text-sm ${textClass}`}>{req.employee?.nom} {req.employee?.prenom}</p>
                              <p className={`text-xs ${textMutedClass} hidden sm:block`}>{req.employee?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className={`font-medium text-sm ${textClass}`}>{req.leave_type?.name}</p>
                          <p className={`text-xs ${textMutedClass} hidden sm:block`}>{req.leave_type?.category?.category_name}</p>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                            {req.duration}j
                          </span>
                        </td>
                        <td className="p-4 hidden lg:table-cell">
                        <p className={`text-sm ${textClass}`}>
                            {req.start_date ? (
                            <>
                                {new Date(req.start_date).toLocaleDateString('fr-FR')} → {new Date(req.end_date).toLocaleDateString('fr-FR')}
                            </>
                            ) : 'Document seul'}
                        </p>
                        </td>
                        <td className="p-4 hidden sm:table-cell">
                          {req.attachment_path ? (
                            <a 
                              href={getAttachmentUrl(req.attachment_path)}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-indigo-500 hover:text-indigo-600 flex items-center gap-1 text-xs font-bold"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={14} /> Voir
                            </a>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-xs">Aucun</span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color} text-white`}>
                            <StatusIcon size={10} /> 
                            <span className="hidden sm:inline">{status.text}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => setDetailModal({ show: true, req })}
                              className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer">
                              <Eye size={16} />
                            </button>
                            {req.status === 'PENDING' && (
                              <>
                                <button onClick={() => setNoteModal({ show: true, req, action: 'APPROVED' })}
                                  className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all cursor-pointer">
                                  <CheckCheck size={16} />
                                </button>
                                <button onClick={() => setNoteModal({ show: true, req, action: 'REJECTED' })}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all cursor-pointer">
                                  <X size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reste des modals inchanged... */}
        {/* Detail Modal */}
        {detailModal.show && detailModal.req && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeIn`}>
              <div className={`sticky top-0 z-10 ${cardClass} px-6 py-4 border-b ${borderClass} flex justify-between items-center bg-opacity-95 backdrop-blur-sm`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                    <FileText size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-bold ${textClass}`}>Détails de la Demande</h2>
                    <p className={`text-xs ${textMutedClass}`}>Réf: REQ-{detailModal.req.id}</p>
                  </div>
                </div>
                <button onClick={() => setDetailModal({ show: false, req: null })} 
                  className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition-all cursor-pointer">
                  <X size={20} className={textMutedClass} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Employee Info */}
                <div>
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                      <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                      <User size={16} className="text-emerald-500" /> Informations Employé
                    </h3>
                    <div className="h-px bg-gradient-to-r from-emerald-500 to-transparent mt-2"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Nom complet</p>
                      <p className={`text-sm font-medium ${textClass} mt-1`}>{detailModal.req.employee?.nom} {detailModal.req.employee?.prenom}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Email</p>
                      <p className={`text-sm font-medium ${textClass} mt-1 truncate`}>{detailModal.req.employee?.email}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Poste</p>
                      <p className={`text-sm font-medium ${textClass} mt-1`}>{detailModal.req.employee?.poste_name || detailModal.req.employee?.grade || '-'}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Statut</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                        detailModal.req.employee?.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                        detailModal.req.employee?.statut === 'CONGE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                      }`}>{detailModal.req.employee?.statut || 'ACTIF'}</span>
                    </div>
                  </div>
                </div>

                {/* Leave Details */}
                <div>
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                      <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                      <Calendar size={16} className="text-indigo-500" /> Détails du Congé
                    </h3>
                    <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent mt-2"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Type</p>
                      <p className={`text-sm font-medium ${textClass} mt-1`}>{detailModal.req.leave_type?.name}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Catégorie</p>
                      <p className={`text-sm font-medium ${textClass} mt-1`}>{detailModal.req.leave_type?.category?.category_name}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                    <p className={`text-xs ${textMutedClass}`}>Période</p>
                    <p className={`text-sm font-medium ${textClass} mt-1`}>
                        {detailModal.req.start_date ? (
                        <>
                            {new Date(detailModal.req.start_date).toLocaleDateString('fr-FR')} → {new Date(detailModal.req.end_date).toLocaleDateString('fr-FR')}
                        </>
                        ) : 'Document seul'}
                    </p>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <p className={`text-xs ${textMutedClass}`}>Durée</p>
                      <p className={`text-sm font-medium ${textClass} mt-1`}>{detailModal.req.duration} jours</p>
                    </div>
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <div className="mb-3">
                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                      <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                      <MessageSquare size={16} className="text-blue-500" /> Commentaires
                    </h3>
                    <div className="h-px bg-gradient-to-r from-blue-500 to-transparent mt-2"></div>
                  </div>
                  <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                    <p className={`text-sm ${textMutedClass}`}>{detailModal.req.comments || 'Aucun commentaire'}</p>
                  </div>
                </div>

                {/* Attachment */}
                {detailModal.req.attachment_path && (
                  <div>
                    <div className="mb-3">
                      <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                        <div className="w-1 h-5 bg-purple-500 rounded-full"></div>
                        <FileText size={16} className="text-purple-500" /> Justificatif
                      </h3>
                      <div className="h-px bg-gradient-to-r from-purple-500 to-transparent mt-2"></div>
                    </div>
                    <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                      <a 
                        href={getAttachmentUrl(detailModal.req.attachment_path)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-indigo-500 hover:text-indigo-600 transition-all"
                      >
                        <ExternalLink size={14} /> Voir le document
                      </a>
                    </div>
                  </div>
                )}

                {/* Status Info */}
                <div className={`p-4 rounded-xl ${darkMode ? 'bg-indigo-950/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'}`}>
                  <div className="flex items-center gap-3">
                    {detailModal.req.status === 'APPROVED' && <CheckCircle size={20} className="text-emerald-500" />}
                    {detailModal.req.status === 'REJECTED' && <XCircle size={20} className="text-rose-500" />}
                    {detailModal.req.status === 'PENDING' && <ClockIcon size={20} className="text-amber-500" />}
                    <div>
                      <p className={`text-sm font-semibold ${textClass}`}>
                        Statut: {detailModal.req.status === 'APPROVED' ? 'Approuvé' : detailModal.req.status === 'REJECTED' ? 'Refusé' : 'En attente'}
                      </p>
                      {detailModal.req.hr_note && (
                        <p className={`text-xs ${textMutedClass} mt-1`}>Note RH: {detailModal.req.hr_note}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4 border-t ${borderClass}">
                  <button onClick={() => generatePDF(detailModal.req)}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 text-white font-medium hover:from-slate-800 hover:to-slate-900 transition-all cursor-pointer flex items-center justify-center gap-2">
                    <FileDown size={16} /> PDF
                  </button>
                  {detailModal.req.status === 'PENDING' && (
                    <>
                      <button onClick={() => setNoteModal({ show: true, req: detailModal.req, action: 'APPROVED' })}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer flex items-center justify-center gap-2">
                        <CheckCheck size={16} /> Approuver
                      </button>
                      <button onClick={() => setNoteModal({ show: true, req: detailModal.req, action: 'REJECTED' })}
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-medium hover:from-rose-700 hover:to-red-700 transition-all cursor-pointer flex items-center justify-center gap-2">
                        <X size={16} /> Refuser
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Note Modal */}
        {noteModal.show && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-2xl w-full max-w-md shadow-2xl`}>
              <div className={`px-6 py-4 border-b ${borderClass}`}>
                <h3 className={`text-lg font-bold ${textClass}`}>
                  {noteModal.action === 'APPROVED' ? 'Approuver la demande' : 'Refuser la demande'}
                </h3>
              </div>
              <div className="p-6">
                <textarea 
                  className={`w-full p-3 rounded-xl border ${borderClass} ${inputClass} outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none`}
                  placeholder="Ajouter une note (optionnel)..."
                  value={hrNote}
                  onChange={(e) => setHrNote(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                  <button onClick={() => setNoteModal({ show: false, req: null, action: '' })}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer">
                    Annuler
                  </button>
                  <button onClick={processRequest} disabled={processingId === noteModal.req?.id}
                    className={`flex-1 py-2.5 rounded-xl text-white font-medium transition-all cursor-pointer flex items-center justify-center gap-2
                      ${noteModal.action === 'APPROVED' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700' : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'}`}>
                    {processingId === noteModal.req?.id ? <Loader2 size={16} className="animate-spin" /> : 'Confirmer'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default HRLeaveManagement;