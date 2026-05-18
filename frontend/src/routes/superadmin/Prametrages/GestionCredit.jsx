import React, { useState, useEffect } from 'react';
import { 
    Plus, Trash2, Edit2, X, Loader2, 
    Tag, Search, CheckCircle, ChevronDown, Users,
    CreditCard, Save, ArrowLeft, DollarSign,
    Calendar, Clock, AlertCircle, Percent, Sparkles,
    TrendingUp, Shield, ChevronRight
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig';
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';
import { useLocation, useNavigate } from 'react-router-dom';

const GestionCredit = () => {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeesList, setEmployeesList] = useState([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [employeeCredits, setEmployeeCredits] = useState([]);
    const [loadingCredits, setLoadingCredits] = useState(false);
    const [showCreditForm, setShowCreditForm] = useState(false);
    const [editingCredit, setEditingCredit] = useState(null);
    const [tempCredit, setTempCredit] = useState({
        credit_type_id: '',
        montant_credit: '',
        taux_credit: '',
        credit_duree: '',
        credit_date_debut: '',
        credit_date_fin: '',
    });
    const [editingType, setEditingType] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: null, id: null, name: '' });
    const [showNewTypeForm, setShowNewTypeForm] = useState(false);
    const [newTypeName, setNewTypeName] = useState('');

    // ── Design tokens ──────────────────────────────────────────────
    const dm = darkMode;

    const bg         = dm ? 'bg-black'   : 'bg-slate-50';
    const card       = dm ? 'bg-[#1A1A1A]'   : 'bg-white';
    const cardBorder = dm ? 'border-[#2A2A2A]': 'border-slate-200';
    const surface    = dm ? 'bg-[#252525]'   : 'bg-slate-50';
    const text       = dm ? 'text-gray-100'  : 'text-slate-800';
    const textSub    = dm ? 'text-gray-400'  : 'text-slate-500';
    const textMuted  = dm ? 'text-gray-600'  : 'text-slate-400';
    const divider    = dm ? 'divide-[#2A2A2A]': 'divide-slate-100';
    const borderC    = dm ? 'border-[#2A2A2A]': 'border-slate-200';

    const inputCls = `w-full px-4 py-2.5 rounded-xl border ${borderC} ${dm ? 'bg-[#252525] text-white placeholder-gray-600 focus:border-indigo-500' : 'bg-slate-50 text-slate-800 placeholder-slate-400 focus:border-indigo-400'} focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm font-medium`;

    const btnPrimary = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer";
    const btnSuccess = "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer";
    const btnGhost   = `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border ${borderC} ${text} hover:${surface} text-sm font-medium transition-all cursor-pointer`;
    const btnIcon    = `p-2 rounded-lg transition-all cursor-pointer ${dm ? 'hover:bg-[#2A2A2A]' : 'hover:bg-slate-100'}`;

    // ── Data fetching ──────────────────────────────────────────────
    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/credit-types');
            setTypes(res.data || []);
        } catch { showNotification("❌ Erreur chargement des types", "error"); }
        finally { setLoading(false); }
    };

    const fetchEmployees = async () => {
        setLoadingEmployees(true);
        try {
            const res = await api.get('/api/employees', { params: { per_page: 100 } });
            setEmployeesList(res.data.data || []);
        } catch { showNotification("Erreur chargement des employés", "error"); }
        finally { setLoadingEmployees(false); }
    };

    const fetchEmployeeCredits = async (employeeId) => {
        setLoadingCredits(true);
        try {
            const res = await api.get(`/api/employees/${employeeId}/credits`);
            setEmployeeCredits(res.data || []);
        } catch { showNotification("Erreur chargement des crédits", "error"); }
        finally { setLoadingCredits(false); }
    };

    useEffect(() => {
        fetchTypes();
        fetchEmployees();
        if (location.state?.employee) {
            setSelectedEmployee(location.state.employee);
            fetchEmployeeCredits(location.state.employee.id);
        }
    }, []);

    // ── Business logic ─────────────────────────────────────────────
    const addType = async () => {
        if (!newTypeName.trim()) return showNotification(" Nom requis", "error");
        const code = newTypeName.toUpperCase().replace(/\s/g, '_');
        try {
            await api.post('/api/credit-types', { name: newTypeName, code });
            fetchTypes(); setNewTypeName(''); setShowNewTypeForm(false);
            showNotification("✅ Type ajouté", "success");
        } catch { showNotification("❌ Erreur", "error"); }
    };

    const updateType = async (id, name) => {
        if (!name.trim()) return;
        try {
            await api.put(`/api/credit-types/${id}`, { name });
            fetchTypes(); setEditingType(null);
            showNotification("Type modifié", "success");
        } catch { showNotification("Erreur", "error"); }
    };

    const deleteType = (id, name) => setDeleteModal({ isOpen: true, type: 'type', id, name });

    const calculerMensualite = (montant, tauxAnnuel, dureeMois) => {
        const m = parseFloat(montant), t = parseFloat(tauxAnnuel), d = parseInt(dureeMois);
        if (isNaN(m) || isNaN(t) || isNaN(d) || m <= 0 || d <= 0) return 0;
        if (t === 0) return Number(m / d).toFixed(2);
        const tm = (t / 100) / 12, p = Math.pow(1 + tm, d);
        return Number(m * (tm * p) / (p - 1)).toFixed(2);
    };

    const calculerDateFin = (dateDebut, dureeMois) => {
        if (!dateDebut || !dureeMois) return '';
        const fin = new Date(dateDebut);
        fin.setMonth(fin.getMonth() + parseInt(dureeMois));
        return fin.toISOString().split('T')[0];
    };

    const addCreditToEmployee = async () => {
        if (!selectedEmployee) return showNotification("❌ Veuillez sélectionner un employé", "warning");
        if (!tempCredit.credit_type_id) return showNotification("❌ Veuillez sélectionner un type de crédit", "warning");
        if (!tempCredit.montant_credit || parseFloat(tempCredit.montant_credit) <= 0) return showNotification("❌ Montant invalide", "warning");
        if (parseFloat(tempCredit.taux_credit) < 0 || parseFloat(tempCredit.taux_credit) > 100) return showNotification("❌ Taux invalide (0–100%)", "warning");
        if (!tempCredit.credit_duree || parseInt(tempCredit.credit_duree) <= 0) return showNotification("❌ Durée invalide", "warning");

        const mensualite = calculerMensualite(tempCredit.montant_credit, tempCredit.taux_credit, tempCredit.credit_duree);
        const dateFin = tempCredit.credit_date_debut ? calculerDateFin(tempCredit.credit_date_debut, tempCredit.credit_duree) : '';

        const creditData = {
            credit_type_id: tempCredit.credit_type_id,
            montant_credit: tempCredit.montant_credit,
            taux_credit: tempCredit.taux_credit,
            credit_duree: tempCredit.credit_duree,
            credit_date_debut: tempCredit.credit_date_debut || null,
            credit_date_fin: dateFin,
            credit_mensualite: mensualite,
            credit_reste_a_payer: tempCredit.montant_credit,
        };

        try {
            if (editingCredit) {
                await api.put(`/api/employees/${selectedEmployee.id}/credits/${editingCredit.id}`, creditData);
                showNotification(" Crédit modifié", "success");
            } else {
                await api.post(`/api/employees/${selectedEmployee.id}/credits`, creditData);
                showNotification(" Crédit ajouté", "success");
            }
            fetchEmployeeCredits(selectedEmployee.id);
            resetCreditForm();
        } catch { showNotification(" Erreur lors de l'enregistrement", "error"); }
    };

    const deleteCredit = async (creditId) => {
        try {
            await api.delete(`/api/employees/${selectedEmployee.id}/credits/${creditId}`);
            showNotification("Crédit supprimé", "success");
            fetchEmployeeCredits(selectedEmployee.id);
        } catch { showNotification(" Erreur lors de la suppression", "error"); }
    };

    const editCredit = (credit) => {
        setTempCredit({
            credit_type_id: credit.credit_type_id,
            montant_credit: credit.montant_credit,
            taux_credit: credit.taux_credit,
            credit_duree: credit.credit_duree,
            credit_date_debut: credit.credit_date_debut || '',
            credit_date_fin: credit.credit_date_fin || '',
        });
        setEditingCredit(credit);
        setShowCreditForm(true);
    };

    const resetCreditForm = () => {
        setTempCredit({ credit_type_id: '', montant_credit: '', taux_credit: '', credit_duree: '', credit_date_debut: '', credit_date_fin: '' });
        setEditingCredit(null);
        setShowCreditForm(false);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/credit-types/${deleteModal.id}`);
            fetchTypes();
            showNotification(" Type supprimé", "success");
        } catch { showNotification(" Erreur", "error"); }
        setDeleteModal({ isOpen: false, type: null, id: null, name: '' });
    };

    const selectEmployee = (emp) => { setSelectedEmployee(emp); setShowEmployeeSelector(false); fetchEmployeeCredits(emp.id); };

    const filteredEmployees = employeesList.filter(emp =>
        emp.prenom?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.nom?.toLowerCase().includes(employeeSearch.toLowerCase()) ||
        emp.email?.toLowerCase().includes(employeeSearch.toLowerCase())
    );

    const filteredTypes = types.filter(t => t.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    const formatMoney = (amount) => new Intl.NumberFormat('fr-MA', { minimumFractionDigits: 0 }).format(amount || 0) + ' MAD';

    const mensualitePreview = tempCredit.montant_credit && tempCredit.taux_credit !== '' && tempCredit.credit_duree
        ? calculerMensualite(tempCredit.montant_credit, tempCredit.taux_credit, tempCredit.credit_duree)
        : null;

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${bg}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-500" size={28} />
                    </div>
                </div>
                <p className={`text-sm font-medium ${textSub}`}>Chargement des données…</p>
            </div>
        </div>
    );

    return (
        <div className={`min-h-screen ${bg} font-sans`}>

            {/* ── Subtle top accent line ── */}
            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-60" />

            <div className="max-w-6xl mx-auto  py-5 space-y-6">

                {/* ══════════════════════════════════════
                    HEADER
                ══════════════════════════════════════ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border ${borderC} ${card} shadow-sm hover:border-indigo-500/40 transition-all cursor-pointer`}
                        >
                            <ArrowLeft size={18} className={textSub} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2.5 mb-0.5">
                                <h1 className={`text-2xl font-bold tracking-tight ${text}`}>Gestion des Crédits</h1>
                            </div>
                            <p className={`text-sm ${textSub}`}>Gérez les types de crédit et les crédits des employés</p>
                        </div>
                    </div>
                    <button onClick={() => setShowNewTypeForm(true)} className={btnPrimary}>
                        <Plus size={15} /> Nouveau type
                    </button>
                </div>

                {/* ══════════════════════════════════════
                    STATS ROW (visual enhancement)
                ══════════════════════════════════════ */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Types de crédit', value: types.length, icon: Tag, color: 'indigo' },
                        { label: 'Crédits actifs', value: employeeCredits.length, icon: CreditCard, color: 'emerald' },
                        { label: 'Employés', value: employeesList.length, icon: Users, color: 'violet' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className={`${card} border ${cardBorder} rounded-2xl p-4 flex items-center gap-4 shadow-sm`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-${color}-500/10`}>
                                <Icon size={18} className={`text-${color}-500`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-bold ${text}`}>{value}</p>
                                <p className={`text-xs ${textMuted} font-medium`}>{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ══════════════════════════════════════
                    EMPLOYEE SELECTOR
                ══════════════════════════════════════ */}
                <div className={`${card} border ${cardBorder} rounded-2xl shadow-sm overflow-visible`}>
                    <div className="p-5 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Users size={18} className="text-white" />
                            </div>
                            <div>
                                <p className={`text-xs font-semibold uppercase tracking-widest ${textMuted} mb-0.5`}>Employé sélectionné</p>
                                {selectedEmployee ? (
                                    <p className={`font-semibold ${text}`}>
                                        {selectedEmployee.prenom} {selectedEmployee.nom}
                                        <span className={`ml-2 text-xs font-normal ${textSub}`}>{selectedEmployee.email}</span>
                                    </p>
                                ) : (
                                    <p className={`text-sm ${textSub}`}>Aucun employé sélectionné</p>
                                )}
                            </div>
                        </div>

                        <div className="relative">
                            <button
                                onClick={() => setShowEmployeeSelector(!showEmployeeSelector)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border ${borderC} ${text} text-sm font-medium transition-all cursor-pointer hover:border-indigo-500/50 ${dm ? 'hover:bg-[#252525]' : 'hover:bg-slate-50'}`}
                            >
                                <Users size={15} className="text-indigo-400" />
                                {selectedEmployee ? "Changer d'employé" : 'Sélectionner un employé'}
                                <ChevronDown size={14} className={`transition-transform duration-200 ${showEmployeeSelector ? 'rotate-180' : ''} ${textSub}`} />
                            </button>

                            {showEmployeeSelector && (
                                <div className={`absolute top-full right-0 mt-2 w-80 rounded-2xl border ${borderC} ${card} z-50 shadow-2xl overflow-hidden`}
                                     style={{ boxShadow: dm ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.12)' }}>
                                    <div className={`p-3 border-b ${borderC} ${surface}`}>
                                        <div className="relative">
                                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                            <input
                                                type="text"
                                                placeholder="Rechercher un employé…"
                                                value={employeeSearch}
                                                onChange={(e) => setEmployeeSearch(e.target.value)}
                                                className={inputCls + ' pl-9'}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {loadingEmployees ? (
                                            <div className="p-6 text-center">
                                                <Loader2 className="animate-spin mx-auto text-indigo-500" size={22} />
                                            </div>
                                        ) : filteredEmployees.length === 0 ? (
                                            <div className={`p-6 text-center text-sm ${textSub}`}>Aucun employé trouvé</div>
                                        ) : (
                                            filteredEmployees.map(emp => (
                                                <div
                                                    key={emp.id}
                                                    onClick={() => selectEmployee(emp)}
                                                    className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${selectedEmployee?.id === emp.id ? (dm ? 'bg-indigo-600/20' : 'bg-indigo-50') : ''} ${dm ? 'hover:bg-[#252525]' : 'hover:bg-slate-50'}`}
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white text-xs font-bold">{emp.prenom?.[0]}{emp.nom?.[0]}</span>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={`font-medium text-sm ${text} truncate`}>{emp.prenom} {emp.nom}</p>
                                                        <p className={`text-xs ${textMuted} truncate`}>{emp.email}</p>
                                                    </div>
                                                    {selectedEmployee?.id === emp.id && (
                                                        <CheckCircle size={14} className="text-indigo-500 ml-auto flex-shrink-0" />
                                                    )}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════
                    EMPLOYEE CREDITS SECTION
                ══════════════════════════════════════ */}
                {selectedEmployee && (
                    <div className={`${card} border ${cardBorder} rounded-2xl shadow-sm overflow-hidden`}>
                        {/* Section header */}
                        <div className={`px-5 py-4 border-b ${borderC} flex justify-between items-center flex-wrap gap-3 ${surface}`}>
                            <div className="flex items-center gap-3">
                                <CreditCard size={16} className="text-indigo-400" />
                                <h2 className={`font-semibold ${text}`}>
                                    Crédits de <span className="text-indigo-400">{selectedEmployee.prenom} {selectedEmployee.nom}</span>
                                </h2>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${dm ? 'bg-[#2A2A2A] text-gray-400' : 'bg-slate-200 text-slate-500'}`}>
                                    {employeeCredits.length}
                                </span>
                            </div>
                            <button
                                onClick={() => { resetCreditForm(); setShowCreditForm(!showCreditForm); }}
                                className={btnPrimary}
                            >
                                <Plus size={14} /> Ajouter un crédit
                            </button>
                        </div>

                        {/* Credit form */}
                        {showCreditForm && (
                            <div className={`p-5 border-b ${borderC} ${dm ? 'bg-indigo-950/20' : 'bg-indigo-50/50'}`}>
                                <div className="flex justify-between items-center mb-5">
                                    <div>
                                        <h3 className={`font-semibold ${text}`}>{editingCredit ? 'Modifier le crédit' : 'Nouveau crédit'}</h3>
                                        <p className={`text-xs ${textSub} mt-0.5`}>Remplissez les informations ci-dessous</p>
                                    </div>
                                    {editingCredit && (
                                        <button onClick={resetCreditForm} className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer">
                                            <X size={12} /> Annuler la modification
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Type */}
                                    <div className="space-y-1.5">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Type de crédit <span className="text-rose-500">*</span></label>
                                        <select
                                            value={tempCredit.credit_type_id}
                                            onChange={(e) => setTempCredit({...tempCredit, credit_type_id: e.target.value})}
                                            className={inputCls}
                                        >
                                            <option value="">— Sélectionner —</option>
                                            {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    {/* Montant */}
                                    <div className="space-y-1.5">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Montant (MAD) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <DollarSign size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                            <input type="number" placeholder="100 000" className={inputCls + ' pl-9'}
                                                value={tempCredit.montant_credit}
                                                onChange={(e) => setTempCredit({...tempCredit, montant_credit: e.target.value})} />
                                        </div>
                                    </div>
                                    {/* Taux */}
                                    <div className="space-y-1.5">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Taux annuel (%) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Percent size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                            <input type="number" step="0.1" placeholder="6" className={inputCls + ' pl-9'}
                                                value={tempCredit.taux_credit}
                                                onChange={(e) => setTempCredit({...tempCredit, taux_credit: e.target.value})} />
                                        </div>
                                    </div>
                                    {/* Durée */}
                                    <div className="space-y-1.5">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Durée (mois) <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Clock size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                            <input type="number" placeholder="60" className={inputCls + ' pl-9'}
                                                value={tempCredit.credit_duree}
                                                onChange={(e) => setTempCredit({...tempCredit, credit_duree: e.target.value})} />
                                        </div>
                                    </div>
                                    {/* Date début */}
                                    <div className="space-y-1.5">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Date de début</label>
                                        <div className="relative">
                                            <Calendar size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                            <input type="date" className={inputCls + ' pl-9'}
                                                value={tempCredit.credit_date_debut}
                                                onChange={(e) => {
                                                    const v = e.target.value;
                                                    setTempCredit(prev => ({
                                                        ...prev,
                                                        credit_date_debut: v,
                                                        credit_date_fin: (v && prev.credit_duree) ? calculerDateFin(v, prev.credit_duree) : prev.credit_date_fin
                                                    }));
                                                }} />
                                        </div>
                                    </div>
                                    {/* Date fin */}
                                    <div className="space-y-1.5">
                                        <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>Date de fin <span className={`text-[10px] ${textMuted}`}>(auto)</span></label>
                                        <div className="relative">
                                            <Calendar size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${textMuted}`} />
                                            <input type="date" readOnly className={inputCls + ` pl-9 ${dm ? 'opacity-50' : 'opacity-60'} cursor-not-allowed`}
                                                value={tempCredit.credit_date_fin} />
                                        </div>
                                    </div>
                                </div>

                                {/* Mensualité preview */}
                                {mensualitePreview && (
                                    <div className={`mt-5 p-4 rounded-xl border ${dm ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'} flex items-center justify-between`}>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                                                <TrendingUp size={14} className="text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className={`text-xs font-semibold uppercase tracking-wide ${dm ? 'text-indigo-400' : 'text-indigo-600'}`}>Mensualité estimée</p>
                                                <p className={`text-xs ${textSub}`}>Basée sur les informations saisies</p>
                                            </div>
                                        </div>
                                        <p className={`text-lg font-bold ${dm ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                            {parseFloat(mensualitePreview).toLocaleString('fr-MA')} MAD
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-dashed ${borderC}">
                                    <button onClick={() => { resetCreditForm(); setShowCreditForm(false); }} className={btnGhost}>
                                        <X size={14} /> Annuler
                                    </button>
                                    <button onClick={addCreditToEmployee} className={btnPrimary}>
                                        <Save size={14} /> {editingCredit ? 'Mettre à jour' : 'Enregistrer'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Credits list */}
                        <div className={`divide-y ${divider}`}>
                            {loadingCredits ? (
                                <div className="py-12 text-center">
                                    <Loader2 className="animate-spin mx-auto text-indigo-500" size={24} />
                                </div>
                            ) : employeeCredits.length === 0 ? (
                                <div className="py-16 text-center flex flex-col items-center gap-3">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dm ? 'bg-[#252525]' : 'bg-slate-100'}`}>
                                        <CreditCard size={28} className={textMuted} />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${textSub}`}>Aucun crédit pour cet employé</p>
                                        <p className={`text-xs ${textMuted} mt-1`}>Cliquez sur "Ajouter un crédit" pour commencer</p>
                                    </div>
                                    <button onClick={() => { resetCreditForm(); setShowCreditForm(true); }} className={btnPrimary}>
                                        <Plus size={14} /> Ajouter un crédit
                                    </button>
                                </div>
                            ) : (
                                employeeCredits.map((credit) => {
                                    const creditType = types.find(t => t.id === credit.credit_type_id);
                                    return (
                                        <div key={credit.id} className={`px-5 py-4 transition-colors ${dm ? 'hover:bg-[#252525]/60' : 'hover:bg-slate-50'} group`}>
                                            <div className="flex items-center gap-4 flex-wrap">
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/10">
                                                    <CreditCard size={16} className="text-indigo-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <p className={`font-semibold ${text}`}>{creditType?.name || 'Crédit'}</p>
                                                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${dm ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                                            {formatMoney(credit.montant_credit)}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-3">
                                                        <span className={`text-xs flex items-center gap-1 ${textSub}`}>
                                                            <Percent size={10} /> {credit.taux_credit}% / an
                                                        </span>
                                                        <span className={`text-xs flex items-center gap-1 ${textSub}`}>
                                                            <Clock size={10} /> {credit.credit_duree} mois
                                                        </span>
                                                        <span className="text-xs flex items-center gap-1 font-semibold text-indigo-400">
                                                            <TrendingUp size={10} /> {formatMoney(credit.credit_mensualite)} / mois
                                                        </span>
                                                        {credit.credit_date_debut && (
                                                            <span className={`text-xs flex items-center gap-1 ${textMuted}`}>
                                                                <Calendar size={10} /> {new Date(credit.credit_date_debut).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => editCredit(credit)} className={`${btnIcon} text-indigo-400 hover:text-indigo-300`} title="Modifier">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => deleteCredit(credit.id)} className={`${btnIcon} text-rose-400 hover:text-rose-300`} title="Supprimer">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    NEW TYPE FORM
                ══════════════════════════════════════ */}
                {showNewTypeForm && (
                    <div className={`${card} border ${cardBorder} rounded-2xl shadow-sm overflow-hidden`}>
                        <div className={`px-5 py-4 border-b ${borderC} ${surface} flex items-center gap-2`}>
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <Plus size={14} className="text-emerald-500" />
                            </div>
                            <h2 className={`font-semibold ${text}`}>Nouveau type de crédit</h2>
                        </div>
                        <div className="p-5">
                            <div className="space-y-1.5 mb-5">
                                <label className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}>
                                    Nom du type <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ex: Crédit Standard, Crédit Immobilier…"
                                    value={newTypeName}
                                    onChange={e => setNewTypeName(e.target.value)}
                                    className={inputCls}
                                    onKeyPress={(e) => e.key === 'Enter' && addType()}
                                    autoFocus
                                />
                                {newTypeName && (
                                    <p className={`text-xs ${textMuted}`}>
                                        Code généré : <code className={`px-1.5 py-0.5 rounded text-xs ${dm ? 'bg-[#252525] text-gray-400' : 'bg-slate-100 text-slate-500'}`}>
                                            {newTypeName.toUpperCase().replace(/\s/g, '_')}
                                        </code>
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <button onClick={addType} className={btnSuccess}>
                                    <CheckCircle size={15} /> Enregistrer
                                </button>
                                <button onClick={() => { setShowNewTypeForm(false); setNewTypeName(''); }} className={btnGhost}>
                                    <X size={15} /> Annuler
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════
                    CREDIT TYPES LIST
                ══════════════════════════════════════ */}
                <div className={`${card} border ${cardBorder} rounded-2xl shadow-sm overflow-hidden`}>
                    <div className={`px-5 py-4 border-b ${borderC} ${surface} flex items-center justify-between flex-wrap gap-3`}>
                        <div className="flex items-center gap-2.5">
                            <Tag size={16} className="text-indigo-400" />
                            <h2 className={`font-semibold ${text}`}>Types de crédit disponibles</h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${dm ? 'bg-[#2A2A2A] text-gray-400' : 'bg-slate-200 text-slate-500'} font-semibold`}>
                                {filteredTypes.length}
                            </span>
                        </div>
                        <div className="relative">
                            <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMuted}`} />
                            <input
                                type="text"
                                placeholder="Rechercher un type…"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={inputCls + ' pl-9 w-52'}
                            />
                        </div>
                    </div>

                    <div className={`divide-y ${divider}`}>
                        {filteredTypes.length === 0 ? (
                            <div className="py-16 text-center flex flex-col items-center gap-3">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${dm ? 'bg-[#252525]' : 'bg-slate-100'}`}>
                                    <Tag size={28} className={textMuted} />
                                </div>
                                <div>
                                    <p className={`font-medium ${textSub}`}>Aucun type de crédit trouvé</p>
                                    <p className={`text-xs ${textMuted} mt-1`}>Créez un premier type pour commencer</p>
                                </div>
                                <button onClick={() => setShowNewTypeForm(true)} className={btnPrimary}>
                                    <Plus size={14} /> Ajouter un type
                                </button>
                            </div>
                        ) : (
                            filteredTypes.map((type) => (
                                <div key={type.id} className={`px-5 py-4 transition-colors ${dm ? 'hover:bg-[#252525]/60' : 'hover:bg-slate-50'} group`}>
                                    <div className="flex items-center justify-between gap-4">
                                        {editingType === type.id ? (
                                            <div className="flex-1 flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    defaultValue={type.name}
                                                    className={inputCls + ' flex-1'}
                                                    onBlur={(e) => updateType(type.id, e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && updateType(type.id, e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => setEditingType(null)} className={`${btnIcon} text-rose-400`}>
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${dm ? 'bg-[#252525]' : 'bg-slate-100'}`}>
                                                        <Shield size={14} className="text-indigo-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <p className={`font-semibold ${text}`}>{type.name}</p>
                                                            {type.code && (
                                                                <code className={`text-[10px] px-2 py-0.5 rounded-lg ${dm ? 'bg-[#252525] text-gray-500' : 'bg-slate-100 text-slate-500'} font-mono`}>
                                                                    {type.code}
                                                                </code>
                                                            )}
                                                        </div>
                                                        <p className={`text-xs ${textMuted} mt-0.5`}>ID #{type.id}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingType(type.id)} className={`${btnIcon} text-indigo-400 hover:text-indigo-300`} title="Modifier">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => deleteType(type.id, type.name)} className={`${btnIcon} text-rose-400 hover:text-rose-300`} title="Supprimer">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, type: null, id: null, name: '' })}
                onConfirm={confirmDelete}
                title="Confirmer la suppression"
                message={`Êtes-vous sûr de vouloir supprimer le type "${deleteModal.name}" ?`}
                darkMode={darkMode}
            />
        </div>
    );
};

export default GestionCredit;