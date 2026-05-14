import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Save, Trash2, Edit2, Search, Download, UserPlus,
    Briefcase, Loader, AlertCircle,
    Calendar, Users, Plus, X, Lock, User,
    ChevronDown, Eye, TrendingUp, DollarSign, Percent, Shield,
    Grid3x3, List, CheckCircle, Clock, Mail, RefreshCw,
} from 'lucide-react';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';
import axiosClient from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

// ─── API endpoints ─────────────────────────────────────────────
const API = {
    annees:           () => axiosClient.get('/api/rh/employees/annees'),
    employees:        (params) => axiosClient.get('/api/rh/employees', { params }),
    storeEmployee:    (data) => axiosClient.post('/api/rh/employees', data),
    updateEmployee:   (id, data) => axiosClient.put(`/api/rh/employees/${id}`, data),
    deleteEmployee:   (id) => axiosClient.delete(`/api/rh/employees/${id}`),
    salary:           (id) => axiosClient.get(`/api/rh/employees/${id}/salary-dashboard`),
    credits:          (id) => axiosClient.get(`/api/rh/employees/${id}/credits`),
    exportPDF:        (params) => axiosClient.get('/api/rh/employees/export-pdf', { params, responseType: 'blob' }),
    classification: (year) => axiosClient.get(`/api/rh/gestionEtat/get-by-year/${year}`),
    cotisations:      (year) => axiosClient.get('/api/rh/cotisations', { params: { year } }),
    creditTypes:      () => axiosClient.get('/api/rh/credit-types'),
};

// ─── Helpers ───────────────────────────────────────────────────
const fmtMoney = (v) =>
    Number(v || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' MAD';

const calculerMensualite = (montant, tauxAnnuel, dureeMois) => {
    const m = parseFloat(montant), t = parseFloat(tauxAnnuel), d = parseInt(dureeMois);
    if (isNaN(m) || isNaN(t) || isNaN(d) || m <= 0 || d <= 0) return 0;
    if (t === 0) return +(m / d).toFixed(2);
    const tm = (t / 100) / 12;
    const pw = Math.pow(1 + tm, d);
    return +(m * (tm * pw) / (pw - 1)).toFixed(2);
};

const calculerDateFin = (debut, mois) => {
    if (!debut || !mois) return '';
    const d = new Date(debut);
    d.setMonth(d.getMonth() + parseInt(mois));
    return d.toISOString().split('T')[0];
};

const verifierAge = (dn) => {
    if (!dn) return false;
    const today = new Date(), dob = new Date(dn);
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
};

// ═══════════════════════════════════════════════════════════════
export default function RHEmployeeManagement() {
    const { darkMode }         = useTheme();
    const { showNotification } = useNotification();

    // ── Core state ─────────────────────────────────────────────
    const [loading, setLoading]             = useState(false);
    const [employeesList, setEmployeesList] = useState([]);
    const [isEdit, setIsEdit]               = useState(false);
    const [currentId, setCurrentId]         = useState(null);
    const [filters, setFilters]             = useState({ statut: 'Tous', search: '' });
    const [currentPage, setCurrentPage]     = useState(1);
    const [paginationData, setPaginationData] = useState({});
    const [errors, setErrors]               = useState({});
    const [viewMode, setViewMode]           = useState('table');

    // ── Year ───────────────────────────────────────────────────
    const [annees, setAnnees]               = useState([]);
    const [selectedAnnee, setSelectedAnnee] = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [isYearOpen, setIsYearOpen]       = useState(false);
    const yearRef                           = useRef(null);

    // ── Config ─────────────────────────────────────────────────
    const [configData, setConfigData]       = useState(null);
    const [selectedPost, setSelectedPost]   = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedEchelle, setSelectedEchelle] = useState(null);
    const [cotisationsList, setCotisationsList] = useState([]);
    const [CreditList, setCreditList]       = useState([]);

    // ── Details modal ──────────────────────────────────────────
    const [showDetailsModal, setShowDetailsModal]           = useState(false);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);

    // ── Credits ────────────────────────────────────────────────
    const [employeeCredits, setEmployeeCredits] = useState([]);
    const [showCreditForm, setShowCreditForm]   = useState(false);
    const [tempCredit, setTempCredit]           = useState({
        credit_type_id: '', montant_credit: '', taux_credit: '',
        credit_duree: '', credit_date_debut: '', credit_date_fin: '',
    });

    // ── Form ───────────────────────────────────────────────────
    const [regeneratePassword, setRegeneratePassword] = useState(false);
    
    const emptyForm = {
        prenom: '', nom: '', email: '', telephone: '', 
        date_naissance: '', situation_familiale: '', nombre_enfants: '', date_embauche: '',
        Post_id: '', grade_id: '', echelle_id: '', echelon_id: '',
        grade: '', echelle: '', echelon: '', salaire: '', indice: '',
        statut: 'ACTIF', cotisation_id: '',
        password: '',
    };
    const [formData, setFormData] = useState(emptyForm);

    // ── Delete modal ───────────────────────────────────────────
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, employeeId: null, employeeName: '' });

    // ── Derived ────────────────────────────────────────────────
    const currentYear    = new Date().getFullYear();
    const isYearEditable = parseInt(selectedAnnee) === currentYear;
    const showForm       = isYearEditable;

    // ══════════════════════════════════════════════════════════
    // CSS TOKENS
    // ══════════════════════════════════════════════════════════
    const bg         = darkMode ? 'bg-gradient-to-br from-[#0D0D0D] to-[#1a1a2e]' : 'bg-gradient-to-br from-gray-50 to-gray-100';
    const card       = darkMode ? 'bg-[#1A1A1A]/80 backdrop-blur-sm border-[#2A2A2A]' : 'bg-white/80 backdrop-blur-sm border-gray-200';
    const txt        = darkMode ? 'text-white' : 'text-gray-800';
    const txtM       = darkMode ? 'text-gray-400' : 'text-gray-500';
    const bdr        = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputCls   = `w-full p-2.5 rounded-xl border ${card} ${txt} outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-sm ${!isYearEditable ? 'opacity-60 cursor-not-allowed' : ''}`;
    const inputErr   = `w-full p-2.5 rounded-xl border-2 border-red-500 ${card} ${txt} outline-none focus:ring-2 focus:ring-red-500 text-sm`;

    // ══════════════════════════════════════════════════════════
    // DATA FETCHING
    // ══════════════════════════════════════════════════════════
    const fetchAnnees = async () => {
        try {
            const res = await API.annees();
            const data = res.data || [];
            setAnnees(data);
            const curr = data.find(a => a.year === currentYear);
            if (curr) { setSelectedAnnee(curr.year); setSelectedAnneeId(curr.id); }
            else if (data.length) { setSelectedAnnee(data[data.length - 1].year); setSelectedAnneeId(data[data.length - 1].id); }
        } catch { showNotification('Erreur chargement des années', 'error'); }
    };

    const fetchEmployees = useCallback(async (page = 1) => {
        if (!selectedAnneeId) return;
        setLoading(true);
        try {
            const res = await API.employees({ ...filters, page, annee_id: selectedAnneeId });
            const withDetails = await Promise.all(
                (res.data.data || []).map(async (emp) => {
                    try {
                        const [credRes, salRes] = await Promise.all([
                            API.credits(emp.id),
                            API.salary(emp.id),
                        ]);
                        return { ...emp, credits: credRes.data || [], details: salRes.data.salary_details };
                    } catch { return { ...emp, credits: [], details: null }; }
                })
            );
            setEmployeesList(withDetails);
            setPaginationData({ ...res.data, data: withDetails });
        } catch { showNotification('Erreur chargement des employés', 'error'); }
        finally { setLoading(false); }
    }, [selectedAnneeId, filters]);



    const fetchCotisations = async (year) => {
        try {
            const res = await API.cotisations(year);
            const list = res.data || [];
            setCotisationsList(list);
            const def = list.find(o => o.is_default === 1);
            if (def && !formData.cotisation_id && !isEdit) {
                setFormData(prev => ({ ...prev, cotisation_id: def.id }));
            }
        } catch { setCotisationsList([]); }
    };

    const fetchCreditTypes = async () => {
        try {
            const res = await API.creditTypes();
            setCreditList(res.data || []);
        } catch { setCreditList([]); }
    };

    // ══════════════════════════════════════════════════════════
    // useEffects
    // ══════════════════════════════════════════════════════════
    useEffect(() => { fetchAnnees(); }, []);

    useEffect(() => {
        if (selectedAnnee) {
            fetchConfig(selectedAnnee);
            fetchCotisations(selectedAnnee);
            fetchCreditTypes();
        }
    }, [selectedAnnee]);

    useEffect(() => {
        if (selectedAnneeId) fetchEmployees(currentPage);
    }, [filters, currentPage, selectedAnneeId]);

    useEffect(() => {
        const handler = (e) => {
            if (yearRef.current && !yearRef.current.contains(e.target)) setIsYearOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [currentPage]);


const fetchConfig = async (year) => {
    if (!year) return;
    try {
        console.log('📡 Calling API:', `/api/rh/gestionEtat/get-by-year/${year}`);
        const res = await API.classification(year);
        console.log('✅ Response:', res.data);
        
        // 🔥 Vérifier la structure de la réponse
        if (res.data && res.data.Post) {
            console.log('📋 Posts trouvés:', res.data.Post.length);
            setConfigData(res.data);
        } else if (res.data && res.data.posts) {
            console.log('📋 Posts trouvés (posts):', res.data.posts.length);
            setConfigData({ Post: res.data.posts, ...res.data });
        } else {
            console.warn('⚠️ Aucun post trouvé dans la réponse');
            setConfigData({ Post: [] });
        }
    } catch (err) {
        console.error('❌ Error fetching config:', err);
        setConfigData({ Post: [] });
        showNotification('Erreur chargement de la classification', 'error');
    }
};
useEffect(() => {
    if (selectedAnnee) {
        console.log('🔄 Fetching config for year:', selectedAnnee);
        console.log('🔄 selectedAnneeId:', selectedAnneeId);
        fetchConfig(selectedAnnee);
        fetchCotisations(selectedAnnee);
        fetchCreditTypes();
    }
}, [selectedAnnee]);
    // ══════════════════════════════════════════════════════════
    // FORM HANDLERS
    // ══════════════════════════════════════════════════════════
    const handleChange = (e) => {
        if (!isYearEditable) return;
        const { name, value } = e.target;
        setFormData(p => ({ ...p, [name]: value }));
        if (errors[name]) setErrors(p => ({ ...p, [name]: null }));
    };

    const handlePostChange = (postId) => {
        if (!isYearEditable) return;
        const post = configData?.Post?.find(p => p.id === parseInt(postId));
        setSelectedPost(post);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setFormData(p => ({
            ...p, Post_id: postId,
            grade_id: '', grade: '', echelle_id: '', echelle: '',
            echelon_id: '', echelon: '', salaire: '', indice: '',
        }));
    };

    const handleGradeChange = (gradeId) => {
        if (!isYearEditable) return;
        const grade = selectedPost?.grades?.find(g => g.id === parseInt(gradeId));
        setSelectedGrade(grade);
        setSelectedEchelle(null);
        setFormData(p => ({
            ...p, grade_id: gradeId, grade: grade?.name || '',
            echelle_id: '', echelle: '', echelon_id: '', echelon: '', salaire: '', indice: '',
        }));
    };

    const handleEchelleChange = (echelleId) => {
        if (!isYearEditable) return;
        const echelle = selectedGrade?.echelles?.find(e => e.id === parseInt(echelleId));
        setSelectedEchelle(echelle);
        setFormData(p => ({
            ...p, echelle_id: echelleId, echelle: echelle?.level || '',
            echelon_id: '', echelon: '', salaire: '', indice: '',
        }));
    };

    const handleEchelonChange = (echelonId) => {
        if (!isYearEditable) return;
        const echelon = selectedEchelle?.echelons?.find(e => e.id === parseInt(echelonId));
        setFormData(p => ({
            ...p, echelon_id: echelonId, echelon: echelon?.order || '',
            salaire: echelon?.salary || '', indice: echelon?.index_val || '',
        }));
    };

    const generatePassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        const pwd = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        setFormData(p => ({ ...p, password: pwd }));
        showNotification('Mot de passe généré', 'success');
    };

    const validateForm = () => {
        const e = {};
        if (!formData.prenom?.trim())   e.prenom  = 'Prénom requis';
        if (!formData.nom?.trim())      e.nom     = 'Nom requis';
        if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            e.email = 'Email invalide';
        if (!formData.password && !isEdit) e.password = 'Mot de passe requis';
        if (!formData.date_naissance)   e.date_naissance = 'Date de naissance requise';
        else if (!verifierAge(formData.date_naissance))
            e.date_naissance = "L'employé doit avoir au moins 18 ans";
        if (!formData.date_embauche)    e.date_embauche = "Date d'embauche requise";
        else if (new Date(formData.date_embauche).getFullYear() !== parseInt(selectedAnnee))
            e.date_embauche = `La date d'embauche doit être dans l'année ${selectedAnnee}`;
        if (!formData.Post_id)          e.Post_id    = 'Poste requis';
        if (!formData.grade_id)         e.grade_id   = 'Grade requis';
        if (!formData.echelle_id)       e.echelle_id = 'Échelle requise';
        if (!formData.echelon_id)       e.echelon_id = 'Échelon requis';
        if (!formData.cotisation_id)    e.cotisation_id = 'Organisme requis';
        setErrors(e);
        if (Object.keys(e).length) {
            showNotification(Object.values(e)[0], 'error');
            return false;
        }
        return true;
    };

    const handleSubmit = async (ev) => {
        ev.preventDefault();
        if (!isYearEditable) { showNotification("L'année n'est pas modifiable", 'error'); return; }
        if (!validateForm()) return;

        setLoading(true);
        try {
            const payload = {
                ...formData,
                annee_id:      selectedAnneeId,
                Post_id:       formData.Post_id    ? parseInt(formData.Post_id)    : null,
                grade_id:      formData.grade_id   ? parseInt(formData.grade_id)   : null,
                echelle_id:    formData.echelle_id ? parseInt(formData.echelle_id) : null,
                echelon_id:    formData.echelon_id ? parseInt(formData.echelon_id) : null,
                echelon:       formData.echelon    ? String(formData.echelon)       : null,
                salaire:       formData.salaire    ? parseFloat(formData.salaire)   : null,
                indice:        formData.indice     ? parseFloat(formData.indice)    : null,
                nombre_enfants: formData.nombre_enfants ? parseInt(formData.nombre_enfants) : 0,
                cotisation_id: formData.cotisation_id ? parseInt(formData.cotisation_id) : null,
                role: 'employee',
                credits: employeeCredits.map(c => ({
                    ...(c.id ? { id: c.id } : {}),
                    credit_type_id: c.credit_type_id,
                    montant_credit: c.montant_credit,
                    taux_credit: c.taux_credit,
                    credit_duree: c.credit_duree,
                    credit_date_debut: c.credit_date_debut,
                    credit_date_fin: c.credit_date_fin,
                    credit_mensualite: c.credit_mensualite,
                    credit_reste_a_payer: c.credit_reste_a_payer,
                })),
            };

            if (isEdit) {
                // Ajouter l'option pour régénérer le mot de passe
                if (regeneratePassword) {
                    payload.regenerate_password = true;
                }
                const res = await API.updateEmployee(currentId, payload);
                showNotification(res.data.message || 'Employé modifié avec succès', 'success');
            } else {
                const res = await API.storeEmployee(payload);
                showNotification(res.data.message || 'Employé ajouté avec succès', 'success');
            }

            resetForm();
            fetchEmployees(currentPage);
        } catch (err) {
            if (err.response?.data?.errors) {
                const errs = err.response.data.errors;
                Object.values(errs).forEach(msg => showNotification(msg[0], 'error'));
                setErrors(errs);
            } else {
                showNotification(err.response?.data?.message || "Erreur lors de l'enregistrement", 'error');
            }
        } finally { setLoading(false); }
    };

    const resetForm = () => {
        setFormData(emptyForm);
        setEmployeeCredits([]);
        setShowCreditForm(false);
        setSelectedPost(null);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setErrors({});
        setIsEdit(false);
        setCurrentId(null);
        setRegeneratePassword(false);
        if (!isEdit) {
            generatePassword();
        }
    };

    const handleEdit = (emp) => {
        if (!isYearEditable) { showNotification("L'année n'est pas modifiable", 'warning'); return; }
        const fmt = (d) => {
            if (!d) return '';
            if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
            const dt = new Date(d);
            return isNaN(dt) ? '' : dt.toISOString().split('T')[0];
        };

        setFormData({
            prenom: emp.prenom || '', nom: emp.nom || '', email: emp.email || '',
            telephone: emp.telephone || '',
            date_naissance: fmt(emp.date_naissance), situation_familiale: emp.situation_familiale || '',
            nombre_enfants: emp.nombre_enfants || 0, date_embauche: fmt(emp.date_embauche),
            Post_id: emp.Post_id || '', grade_id: emp.grade_id || '',
            echelle_id: emp.echelle_id || '', echelon_id: emp.echelon_id || '',
            grade: emp.grade || '', echelle: emp.echelle || '', echelon: emp.echelon || '',
            salaire: emp.salaire || '', indice: emp.indice || '',
            statut: emp.statut || 'ACTIF', cotisation_id: emp.cotisation_id || '',
            password: '',
        });

        setCurrentId(emp.id);
        setIsEdit(true);
        setErrors({});
        setRegeneratePassword(false);

        if (emp.Post_id && configData?.Post) {
            const post = configData.Post.find(p => p.id === emp.Post_id);
            if (post) {
                setSelectedPost(post);
                const grade = post.grades?.find(g => g.id === emp.grade_id);
                if (grade) {
                    setSelectedGrade(grade);
                    const echelle = grade.echelles?.find(e => e.id === emp.echelle_id);
                    if (echelle) setSelectedEchelle(echelle);
                }
            }
        }

        setEmployeeCredits(
            (emp.credits || []).map(c => ({ ...c, temp_id: c.id || Date.now() + Math.random() }))
        );
        setShowCreditForm(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleViewEmployee = (emp) => {
        if (emp.details) {
            setSelectedEmployeeDetails(emp);
            setShowDetailsModal(true);
        } else {
            API.salary(emp.id).then(res => {
                setSelectedEmployeeDetails({ ...emp, details: res.data.salary_details });
                setShowDetailsModal(true);
            }).catch(() => showNotification('Erreur chargement du salaire', 'error'));
        }
    };

    const handleDeleteClick = (id, name) => {
        if (!isYearEditable) { showNotification("L'année n'est pas modifiable", 'warning'); return; }
        setDeleteModal({ isOpen: true, employeeId: id, employeeName: name });
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            await API.deleteEmployee(deleteModal.employeeId);
            fetchEmployees(currentPage);
            showNotification('Employé supprimé avec succès', 'success');
            setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' });
        } catch { showNotification('Erreur lors de la suppression', 'error'); }
        finally { setLoading(false); }
    };

    const handleYearChange = (year, id) => {
        setSelectedAnnee(year);
        setSelectedAnneeId(id);
        resetForm();
        setIsYearOpen(false);
        showNotification(`Année ${year} sélectionnée`, 'success');
    };

    const handleExportPDF = async () => {
        if (!employeesList.length) { showNotification('Aucun employé à exporter', 'warning'); return; }
        setLoading(true);
        try {
            const res = await API.exportPDF({ ...filters, annee_id: selectedAnneeId });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.setAttribute('download', `employes_rh_${selectedAnnee}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            showNotification('PDF exporté avec succès', 'success');
        } catch { showNotification("Erreur lors de l'export PDF", 'error'); }
        finally { setLoading(false); }
    };

    // ─── Credit helpers ────────────────────────────────────────
    const addTempCredit = () => {
        if (!tempCredit.credit_type_id) { showNotification('Sélectionnez un type de crédit', 'warning'); return; }
        if (!tempCredit.montant_credit || parseFloat(tempCredit.montant_credit) <= 0) { showNotification('Montant invalide', 'warning'); return; }
        if (parseFloat(tempCredit.taux_credit) < 0 || parseFloat(tempCredit.taux_credit) > 100) { showNotification('Taux invalide (0-100%)', 'warning'); return; }
        if (!tempCredit.credit_duree || parseInt(tempCredit.credit_duree) <= 0) { showNotification('Durée invalide', 'warning'); return; }

        const mensualite = calculerMensualite(tempCredit.montant_credit, tempCredit.taux_credit, tempCredit.credit_duree);
        const dateFin    = tempCredit.credit_date_debut ? calculerDateFin(tempCredit.credit_date_debut, tempCredit.credit_duree) : '';

        setEmployeeCredits(prev => [...prev, {
            ...tempCredit,
            credit_date_fin: dateFin,
            credit_mensualite: mensualite,
            credit_reste_a_payer: tempCredit.montant_credit,
            temp_id: Date.now(),
        }]);
        setTempCredit({ credit_type_id: '', montant_credit: '', taux_credit: '', credit_duree: '', credit_date_debut: '', credit_date_fin: '' });
        setShowCreditForm(false);
        showNotification('Crédit ajouté', 'success');
    };

    const removeTempCredit = (tempId) =>
        setEmployeeCredits(prev => prev.filter(c => c.temp_id !== tempId));

    // ══════════════════════════════════════════════════════════
    // SUB-COMPONENTS
    // ══════════════════════════════════════════════════════════

    const StatusBadge = ({ statut }) => {
        const map = {
            ACTIF:  { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', Icon: CheckCircle },
            CONGE:  { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',        Icon: Clock },
            DEPART: { cls: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',             Icon: X },
        };
        const { cls, Icon } = map[statut] || map.DEPART;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cls}`}>
                <Icon size={10} />{statut}
            </span>
        );
    };

    const SectionHeading = ({ from, to, Icon, label }) => (
        <div className="mb-3">
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${txt}`}>
                <div className={`w-1 h-5 bg-gradient-to-b ${from} ${to} rounded-full`} />
                <Icon size={16} />{label}
            </h3>
            <div className={`h-px bg-gradient-to-r ${from} to-transparent mt-2`} />
        </div>
    );

    // ── Employee Details Modal ─────────────────────────────────
    const EmployeeDetailsModal = ({ employee, onClose }) => {
        const d = employee.details;
        if (!d) return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className={`${card} rounded-2xl p-8 shadow-2xl`}>
                    <Loader size={40} className="animate-spin mx-auto text-indigo-500" />
                </div>
            </div>
        );

        const TotalRow = ({ label, value, color = 'text-emerald-600' }) => (
            <div className="flex justify-between items-center py-3 border-b last:border-0">
                <span className={`text-sm font-medium ${txt}`}>{label}</span>
                <span className={`text-base font-bold ${color}`}>{value}</span>
            </div>
        );

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className={`${card} rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl`}>
                    <div className={`sticky top-0 z-10 bg-gradient-to-r ${darkMode ? 'from-indigo-950/95 to-purple-950/95' : 'from-indigo-50/95 to-purple-50/95'} backdrop-blur-sm px-6 py-4 border-b ${bdr} flex justify-between items-center`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                <Users size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${txt}`}>Détails salaire</h2>
                                <p className={`text-xs ${txtM}`}>{employee.prenom} {employee.nom}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-200/50 dark:hover:bg-gray-700/50 cursor-pointer">
                            <X size={20} className={txtM} />
                        </button>
                    </div>

                    <div className="p-5 space-y-3">
                        <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-medium ${txt}`}>Salaire de base</span>
                                <span className="text-base font-bold text-emerald-600">{fmtMoney(d.base_salary)}</span>
                            </div>
                        </div>

                        <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                            <TotalRow label="Indemnités" value={`+ ${fmtMoney(d.indemnites?.total || 0)}`} color="text-blue-600" />
                        </div>

                        <div className={`p-4 rounded-xl bg-gradient-to-r ${darkMode ? 'from-indigo-950/40 to-purple-950/40' : 'from-indigo-50 to-purple-50'} border ${bdr}`}>
                            <TotalRow label="Salaire brut" value={fmtMoney(d.brut_salary)} color="text-purple-600" />
                        </div>

                        <div className="space-y-2">
                            <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                                <TotalRow label="Cotisations sociales" value={`- ${fmtMoney(d.cotisations?.total || 0)}`} color="text-rose-600" />
                            </div>
                            <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                                <TotalRow label="IR (Impôt sur le revenu)" value={`- ${fmtMoney(d.ir?.total || 0)}`} color="text-rose-600" />
                            </div>
                            {d.rcar?.total > 0 && (
                                <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                                    <TotalRow label="RCAR (Retraite)" value={`- ${fmtMoney(d.rcar?.total || 0)}`} color="text-rose-600" />
                                </div>
                            )}
                            {d.sntl?.total > 0 && (
                                <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                                    <TotalRow label="SNTL" value={`- ${fmtMoney(d.sntl?.total || 0)}`} color="text-rose-600" />
                                </div>
                            )}
                            {d.assurances?.salarie > 0 && (
                                <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                                    <TotalRow label="Assurances sociales" value={`- ${fmtMoney(d.assurances?.salarie || 0)}`} color="text-rose-600" />
                                </div>
                            )}
                            {d.credits?.total > 0 && (
                                <div className={`p-4 rounded-xl ${card} border ${bdr}`}>
                                    <TotalRow label="Crédits en cours" value={`- ${fmtMoney(d.credits?.total || 0)}`} color="text-rose-600" />
                                </div>
                            )}

                            <div className={`p-4 rounded-xl ${card} border ${bdr} ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <TotalRow label="Total déductions" value={`- ${fmtMoney(d.total_deductions)}`} color="text-rose-600" />
                            </div>
                        </div>

                        <div className={`p-5 rounded-xl border-2 ${darkMode ? 'from-emerald-950/40 to-green-950/40 border-emerald-800' : 'from-emerald-50 to-green-50 border-emerald-200'} bg-gradient-to-r`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className={`text-base font-bold ${txt}`}>Salaire net</span>
                                    <p className={`text-xs ${txtM}`}>À payer</p>
                                </div>
                                <span className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{fmtMoney(d.net_salary)}</span>
                            </div>
                        </div>

                        <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer">
                            Fermer
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // ══════════════════════════════════════════════════════════
    // DERIVED FORM DATA
    // ══════════════════════════════════════════════════════════
    const posts    = configData?.Post || [];
    const grades   = selectedPost?.grades || [];
    const echelles = selectedGrade?.echelles || [];
    const echelons = selectedEchelle?.echelons || [];

    useEffect(() => {
        if (showForm && !isEdit && !formData.password) {
            generatePassword();
        }
    }, [showForm, isEdit]);

    // ══════════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════════
    return (
        <div className={`min-h-screen transition-all duration-300 ${bg}`}>
            <div className="max-w-7xl mx-auto p-1 md:p-3">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-bold ${txt} flex items-center gap-3`}>
                                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                                    <Users size={22} className="text-white" />
                                </div>
                                Gestion des Employés <span className="text-sm font-normal text-indigo-400 ml-1">(RH)</span>
                            </h1>
                            <p className={`text-sm ${txtM} mt-2`}>
                                Année: <span className={`font-semibold ${txt} bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md`}>{selectedAnnee}</span>
                                {' '}• Total: <span className={`font-semibold ${txt}`}>{paginationData.total || 0}</span> employés
                            </p>
                        </div>

                        <div className="flex gap-2 items-center">
                            <div className="relative" ref={yearRef}>
                                <button onClick={() => setIsYearOpen(o => !o)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${card} ${txt} cursor-pointer text-sm`}>
                                    <Calendar size={16} className={txtM} />
                                    {selectedAnnee || 'Sélectionner'}
                                    <ChevronDown size={14} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isYearOpen && (
                                    <div className={`absolute top-full right-0 mt-2 rounded-xl border ${card} z-50 min-w-[160px] shadow-xl`}>
                                        {annees.map(y => (
                                            <div key={y.id} onClick={() => handleYearChange(y.year, y.id)}
                                                className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm flex justify-between items-center ${selectedAnnee == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : txt}`}>
                                                <span>{y.year}</span>
                                                {y.year < currentYear
                                                    ? <span className={`text-xs flex items-center gap-1 ${txtM}`}><Lock size={10} /> Lecture</span>
                                                    : <span className="text-xs text-green-500 flex items-center gap-1"><Edit2 size={10} /> Actif</span>
                                                }
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleExportPDF} disabled={loading || !employeesList.length}
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg text-sm font-medium cursor-pointer">
                                <Download size={16} /> <span className="hidden sm:inline">Exporter PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className={`${card} rounded-xl p-4 mb-4 border flex flex-wrap gap-3 items-center`}>
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${txtM}`} />
                        <input type="text" placeholder="Rechercher..."
                            className={`w-full pl-9 pr-3 py-2 rounded-lg border ${card} ${txt} outline-none text-sm`}
                            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                    </div>
                    <select value={filters.statut} onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))}
                        className={`px-3 py-2 rounded-lg border ${card} ${txt} outline-none text-sm cursor-pointer`}>
                        <option value="Tous">Tous statuts</option>
                        <option value="ACTIF">Actif</option>
                        <option value="CONGE">Congé</option>
                        <option value="DEPART">Départ</option>
                    </select>
                    {(filters.statut !== 'Tous' || filters.search) && (
                        <button onClick={() => setFilters({ statut: 'Tous', search: '' })}
                            className="text-xs text-red-500 hover:text-red-700">Réinitialiser</button>
                    )}
                </div>

                {/* Add/Edit form */}
                {showForm && (
                    <div className={`${card} rounded-xl p-5 mb-6 border shadow-xl`}>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className={`text-xl font-bold ${txt} flex items-center gap-2`}>
                                {isEdit ? <Edit2 size={20} className="text-indigo-500" /> : <UserPlus size={20} className="text-indigo-500" />}
                                {isEdit ? `Modifier l'employé — ${selectedAnnee}` : `Ajouter un employé — ${selectedAnnee}`}
                            </h2>
                            {isEdit && (
                                <button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer">
                                    <X size={14} /> Annuler
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* Personal Info */}
                            <div>
                                <SectionHeading from="from-emerald-500" to="to-green-600" Icon={User} label="Information Personnelle" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[
                                        { name: 'prenom', label: 'Prénom', type: 'text' },
                                        { name: 'nom', label: 'Nom', type: 'text' },
                                        { name: 'email', label: 'Email', type: 'email' },
                                        { name: 'telephone', label: 'Téléphone', type: 'text' },
                                        { name: 'date_naissance', label: 'Date de naissance', type: 'date' },
                                        { name: 'date_embauche', label: "Date d'embauche", type: 'date' },
                                    ].map(({ name, label, type }) => (
                                        <div key={name}>
                                            <label className={`text-xs font-medium ${txtM} mb-1 block`}>{label}</label>
                                            <input name={name} type={type} value={formData[name] || ''} onChange={handleChange}
                                                className={errors[name] ? inputErr : inputCls} disabled={!isYearEditable} />
                                            {errors[name] && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} />{errors[name]}</p>}
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Situation familiale</label>
                                        <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange}
                                            className={inputCls} disabled={!isYearEditable}>
                                            <option value="">Sélectionner</option>
                                            <option value="Celibataire">Célibataire</option>
                                            <option value="Marie(e)">Marié(e)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Nombre d'enfants</label>
                                        <input type="number" name="nombre_enfants" value={formData.nombre_enfants || ''}
                                            onChange={handleChange} min="0" max="20" step="1"
                                            className={inputCls}
                                            disabled={!isYearEditable || formData.situation_familiale !== 'Marie(e)'} />
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Statut</label>
                                        <select name="statut" value={formData.statut} onChange={handleChange}
                                            className={inputCls} disabled={!isYearEditable}>
                                            <option value="ACTIF">Actif</option>
                                            <option value="CONGE">Congé</option>
                                            <option value="DEPART">Départ</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Professional Info */}
                            <div>
                                <SectionHeading from="from-indigo-500" to="to-purple-600" Icon={Briefcase} label="Information Professionnelle" />

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Poste</label>
                                        <select value={formData.Post_id || ''} onChange={e => handlePostChange(e.target.value)}
                                            className={errors.Post_id ? inputErr : inputCls} disabled={!isYearEditable}>
                                            <option value="">Sélectionner un poste</option>
                                            {posts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                        {errors.Post_id && <p className="text-red-500 text-xs mt-1">{errors.Post_id}</p>}
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Grade</label>
                                        <select value={formData.grade_id || ''} onChange={e => handleGradeChange(e.target.value)}
                                            className={inputCls} disabled={!isYearEditable || !selectedPost}>
                                            <option value="">Sélectionner un grade</option>
                                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        {errors.grade_id && <p className="text-red-500 text-xs mt-1">{errors.grade_id}</p>}
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Échelle</label>
                                        <select value={formData.echelle_id || ''} onChange={e => handleEchelleChange(e.target.value)}
                                            className={inputCls} disabled={!isYearEditable || !selectedGrade}>
                                            <option value="">Sélectionner une échelle</option>
                                            {echelles.map(e => <option key={e.id} value={e.id}>Échelle {e.level}</option>)}
                                        </select>
                                        {errors.echelle_id && <p className="text-red-500 text-xs mt-1">{errors.echelle_id}</p>}
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Échelon</label>
                                        <select value={formData.echelon_id || ''} onChange={e => handleEchelonChange(e.target.value)}
                                            className={inputCls} disabled={!isYearEditable || !selectedEchelle}>
                                            <option value="">Sélectionner un échelon</option>
                                            {echelons.map(e => <option key={e.id} value={e.id}>Éch. {e.order} — {Number(e.salary).toLocaleString()} MAD</option>)}
                                        </select>
                                        {errors.echelon_id && <p className="text-red-500 text-xs mt-1">{errors.echelon_id}</p>}
                                    </div>
                                </div>

                                {formData.salaire > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                            <label className={`text-xs font-medium ${txtM} mb-1 block`}>Salaire de base</label>
                                            <input readOnly value={Number(formData.salaire).toLocaleString() + ' MAD'}
                                                className={`w-full p-2 rounded-lg border ${card} ${txt} bg-gray-100 dark:bg-gray-800 cursor-not-allowed font-bold`} />
                                        </div>
                                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                            <label className={`text-xs font-medium ${txtM} mb-1 block`}>Indice</label>
                                            <input readOnly value={formData.indice || '0'}
                                                className={`w-full p-2 rounded-lg border ${card} ${txt} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} />
                                        </div>
                                    </div>
                                )}

                                {/* Cotisation + Credits */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <div>
                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>Organisme (Cotisation)</label>
                                        <select value={formData.cotisation_id || ''} onChange={e => setFormData(p => ({ ...p, cotisation_id: e.target.value }))}
                                            className={errors.cotisation_id ? inputErr : inputCls} disabled={!isYearEditable}>
                                            <option value="">— Sélectionner —</option>
                                            {cotisationsList.map(o => <option key={o.id} value={o.id}>{o.nom || o.name}</option>)}
                                        </select>
                                        {errors.cotisation_id && <p className="text-red-500 text-xs mt-1">{errors.cotisation_id}</p>}
                                    </div>
                                    <div className="flex items-end">
                                        <button type="button" onClick={() => setShowCreditForm(s => !s)}
                                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer shadow-md">
                                            <Plus size={14} /> Ajouter un crédit
                                        </button>
                                    </div>
                                </div>

                                {/* Credit list */}
                                <div className="mt-3">
                                    {employeeCredits.length > 0 && (
                                        <div className="space-y-2 mb-3">
                                            <p className={`text-xs font-medium ${txtM}`}>Crédits en cours :</p>
                                            {employeeCredits.map(credit => (
                                                <div key={credit.temp_id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                    <div>
                                                        <p className="text-sm font-medium">{CreditList.find(c => c.id === parseInt(credit.credit_type_id))?.name || 'Crédit'}</p>
                                                        <p className={`text-xs ${txtM}`}>{Number(credit.montant_credit).toLocaleString()} MAD • {credit.taux_credit}% • {credit.credit_duree} mois</p>
                                                        <p className="text-xs text-indigo-600">Mensualité : {Number(credit.credit_mensualite).toLocaleString()} MAD</p>
                                                    </div>
                                                    <button type="button" onClick={() => removeTempCredit(credit.temp_id)}
                                                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all cursor-pointer">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {showCreditForm && (
                                        <div className="p-4 rounded-xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className={`text-xs font-medium ${txtM} mb-1 block`}>Type de crédit</label>
                                                    <select value={tempCredit.credit_type_id}
                                                        onChange={e => setTempCredit(p => ({ ...p, credit_type_id: e.target.value }))}
                                                        className={inputCls}>
                                                        <option value="">— Sélectionner —</option>
                                                        {CreditList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                {[
                                                    { field: 'montant_credit', label: 'Montant (MAD)', placeholder: '100000', type: 'number' },
                                                    { field: 'taux_credit', label: 'Taux (%)', placeholder: '6', type: 'number', step: '0.1' },
                                                    { field: 'credit_duree', label: 'Durée (mois)', placeholder: '60', type: 'number' },
                                                    { field: 'credit_date_debut', label: 'Date début', placeholder: '', type: 'date' },
                                                ].map(({ field, label, placeholder, type, step }) => (
                                                    <div key={field}>
                                                        <label className={`text-xs font-medium ${txtM} mb-1 block`}>{label}</label>
                                                        <input type={type} step={step} placeholder={placeholder}
                                                            className={inputCls} value={tempCredit[field]}
                                                            onChange={e => {
                                                                const val = e.target.value;
                                                                setTempCredit(p => {
                                                                    const next = { ...p, [field]: val };
                                                                    if (field === 'credit_date_debut' && p.credit_duree && val)
                                                                        next.credit_date_fin = calculerDateFin(val, p.credit_duree);
                                                                    return next;
                                                                });
                                                            }} />
                                                    </div>
                                                ))}
                                                <div>
                                                    <label className={`text-xs font-medium ${txtM} mb-1 block`}>Date fin</label>
                                                    <input type="date" readOnly value={tempCredit.credit_date_fin}
                                                        className={`${inputCls} cursor-not-allowed bg-gray-100 dark:bg-gray-800`} />
                                                </div>
                                            </div>

                                            {tempCredit.montant_credit && tempCredit.taux_credit && tempCredit.credit_duree && (
                                                <div className="mt-3 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                                        Mensualité estimée : <strong>
                                                            {calculerMensualite(tempCredit.montant_credit, tempCredit.taux_credit, tempCredit.credit_duree).toLocaleString()} MAD
                                                        </strong>
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex justify-end gap-3 mt-4">
                                                <button type="button" onClick={() => setShowCreditForm(false)}
                                                    className="px-4 py-1.5 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 cursor-pointer">Annuler</button>
                                                <button type="button" onClick={addTempCredit}
                                                    className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer">Ajouter</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 🔥 SECTION RÉGÉNÉRATION MOT DE PASSE (seulement en édition) */}
                            {isEdit && (
                                <div className={`p-4 rounded-xl border ${darkMode ? 'border-amber-800 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="regenerate_password"
                                            checked={regeneratePassword}
                                            onChange={(e) => setRegeneratePassword(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                                        />
                                        <label htmlFor="regenerate_password" className={`text-sm font-medium cursor-pointer ${txt}`}>
                                            <RefreshCw size={16} className="inline mr-2 text-amber-500" />
                                            Régénérer le mot de passe et envoyer par email
                                        </label>
                                    </div>
                                    {regeneratePassword && (
                                        <p className={`text-xs ${txtM} mt-2 ml-8`}>
                                            Un nouveau mot de passe sera généré et envoyé à l'employé par email.
                                            L'employé devra le changer à la première connexion.
                                        </p>
                                    )}
                                </div>
                            )}

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg cursor-pointer">
                                {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
                            </button>
                        </form>
                    </div>
                )}

                {/* View toggle */}
                <div className="flex justify-end mb-4 gap-2">
                    {[['table', List], ['grid', Grid3x3]].map(([mode, Icon]) => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            className={`p-2 rounded-lg transition-all ${viewMode === mode ? 'bg-indigo-600 text-white' : `${card} ${txt}`}`}>
                            <Icon size={18} />
                        </button>
                    ))}
                </div>

                {/* Table view */}
                {viewMode === 'table' ? (
                    <div className={`${card} rounded-xl border overflow-hidden shadow-xl`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className={darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-100 to-gray-200'}>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wider ${txtM}`}>
                                        {['Employé', 'Poste', 'Grade', 'Brut', 'Net', 'Statut', 'Actions'].map(h => (
                                            <th key={h} className="p-4">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && !employeesList.length ? (
                                        <tr>
                                            <td colSpan="7" className="p-12 text-center">
                                                <Loader size={32} className="animate-spin mx-auto text-indigo-500" />
                                            </td>
                                        </tr>
                                    ) : !employeesList.length ? (
                                        <tr>
                                            <td colSpan="7" className={`p-12 text-center ${txtM}`}>
                                                <Users size={48} className="mx-auto mb-3 opacity-30" />
                                                <p>Aucun employé trouvé</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        employeesList.map((emp, idx) => (
                                            <tr key={emp.id}
                                                className={`border-t ${bdr} hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-150 ${idx % 2 === 0 ? (darkMode ? 'bg-black/20' : 'bg-gray-50/30') : ''}`}>
                                                <td className="p-4">
                                                    <div className={`font-semibold text-sm ${txt}`}>{emp.prenom} {emp.nom}</div>
                                                    <div className={`text-xs ${txtM} truncate max-w-[180px]`}>{emp.email}</div>
                                                </td>
                                                <td className={`p-4 text-sm ${txt}`}>{emp.post?.name || '-'}</td>
                                                <td className={`p-4 text-sm ${txt}`}>{emp.grade || '-'}</td>
                                                <td className="p-4 font-semibold text-purple-600 text-sm whitespace-nowrap">
                                                    {emp.details ? Math.round(emp.details.brut_salary).toLocaleString() + ' MAD' : '…'}
                                                </td>
                                                <td className="p-4 font-semibold text-emerald-600 text-sm whitespace-nowrap">
                                                    {emp.details ? Math.round(emp.details.net_salary).toLocaleString() + ' MAD' : '…'}
                                                </td>
                                                <td className="p-4"><StatusBadge statut={emp.statut} /></td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => handleViewEmployee(emp)}
                                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer" title="Voir">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleEdit(emp)} disabled={!isYearEditable}
                                                            className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`} title="Modifier">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)} disabled={!isYearEditable}
                                                            className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`} title="Supprimer">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        {paginationData.last_page > 1 && (
                            <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t ${bdr}`}>
                                <span className={`text-sm ${txtM}`}>
                                    {paginationData.from || 0} – {paginationData.to || 0} sur {paginationData.total || 0}
                                </span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
                                        className="px-3 py-1.5 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">←</button>
                                    <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm min-w-[40px] text-center">{currentPage}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, paginationData.last_page))} disabled={currentPage === paginationData.last_page}
                                        className="px-3 py-1.5 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">→</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Card view
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {employeesList.map(emp => (
                            <div key={emp.id} className={`${card} rounded-xl border p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                                            <User size={16} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className={`font-semibold ${txt}`}>{emp.prenom} {emp.nom}</h3>
                                            <p className={`text-xs ${txtM}`}>{emp.email}</p>
                                        </div>
                                    </div>
                                    <StatusBadge statut={emp.statut} />
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                    <div><p className={`text-xs ${txtM}`}>Poste</p><p className={`text-sm font-medium ${txt}`}>{emp.post?.name || '-'}</p></div>
                                    <div><p className={`text-xs ${txtM}`}>Grade</p><p className={`text-sm font-medium ${txt}`}>{emp.grade || '-'}</p></div>
                                    <div><p className={`text-xs ${txtM}`}>Brut</p><p className="text-sm font-semibold text-purple-600">{emp.details ? Math.round(emp.details.brut_salary).toLocaleString() + ' MAD' : '…'}</p></div>
                                    <div><p className={`text-xs ${txtM}`}>Net</p><p className="text-sm font-semibold text-emerald-600">{emp.details ? Math.round(emp.details.net_salary).toLocaleString() + ' MAD' : '…'}</p></div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <button onClick={() => handleViewEmployee(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer"><Eye size={14} /></button>
                                    <button onClick={() => handleEdit(emp)} disabled={!isYearEditable} className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}><Edit2 size={14} /></button>
                                    <button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)} disabled={!isYearEditable} className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Modals */}
                {showDetailsModal && selectedEmployeeDetails && (
                    <EmployeeDetailsModal employee={selectedEmployeeDetails} onClose={() => setShowDetailsModal(false)} />
                )}
                <DeleteConfirmModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: '' })}
                    onConfirm={confirmDelete}
                    title="Confirmer la suppression"
                    message={`Supprimer l'employé "${deleteModal.employeeName}" ? Cette action est irréversible.`}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
}