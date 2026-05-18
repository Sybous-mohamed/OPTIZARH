import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Save, Trash2, Edit2, Search, Download, UserPlus, 
    Briefcase, Loader, AlertCircle, 
    Calendar, Mail, Users, Plus, X, Lock, User,
    ChevronDown, Eye, TrendingUp, DollarSign, Percent, Shield,
    Grid3x3, List, RefreshCw, CheckCircle 
} from 'lucide-react';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';
import axiosClient from "../../lib/apis/axiosConfig";
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function EmployeeManagement() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    // ============================================================
    // ETATS PRINCIPAUX
    // ============================================================
    const [loading, setLoading] = useState(false);
    const [employeesList, setEmployeesList] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    const [filters, setFilters] = useState({ statut: "Tous", search: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState({});
    const [errors, setErrors] = useState({});
    
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
    const [viewMode, setViewMode] = useState('table');
    
    // Configurations
    const [annees, setAnnees] = useState([]);
    const [selectedAnnee, setSelectedAnnee] = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const yearRef = useRef(null);
    
    const [configData, setConfigData] = useState(null);
    const [selectedPost, setSelectedPost] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedEchelle, setSelectedEchelle] = useState(null);
    
    const [cotisationsList, setCotisationsList] = useState([]);
    const [selectedCotisation, setSelectedCotisation] = useState(null);
    
    // États pour l'email
    const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);
    const [regeneratePassword, setRegeneratePassword] = useState(false);
    
    const [formData, setFormData] = useState({
        prenom: "", nom: "", email: "", telephone: "", role: "", password: "",
        date_naissance: "", situation_familiale: "", nombre_enfants: "",
        date_embauche: "", annee_id: "", Post_id: "", grade_id: "", 
        echelle_id: "", echelon_id: "", grade: "", echelle: "", echelon: "", 
        salaire: "", indice: "", statut: "ACTIF", cotisation_id: ""
    });
    
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false, employeeId: null, employeeName: ""
    });
    
    const [retraiteSettings, setRetraiteSettings] = useState(null);
    const [isRcarDisabled, setIsRcarDisabled] = useState(false);
    const [ageMessage, setAgeMessage] = useState('');

    const currentYear = new Date().getFullYear();
    const isYearEditable = parseInt(selectedAnnee) === currentYear;
    const showForm = isYearEditable;

    // ============================================================
    // CLASSES CSS
    // ============================================================
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-white' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = `p-2.5 rounded-lg border ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${!isYearEditable ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70' : ''}`;
    const inputErrorClass = `p-2.5 rounded-lg border-2 border-red-500 ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-red-500 text-sm`;

    // ============================================================
    // FETCH API
    // ============================================================
    const fetchRetraiteSettings = async () => {
        if (!selectedAnnee) return;
        try {
            const res = await axiosClient.get(`/api/retraite/settings/${selectedAnnee}`);
            setRetraiteSettings(res.data);
        } catch (err) {
            console.error("Erreur chargement retraite settings:", err);
            setRetraiteSettings(null);
        }
    };

    useEffect(() => {
        if (selectedAnnee) fetchRetraiteSettings();
    }, [selectedAnnee]);

    const verifierAgeRetraite = (dateNaissance) => {
        if (!dateNaissance || !retraiteSettings) {
            setIsRcarDisabled(false);
            setAgeMessage('');
            return;
        }
        const aujourdhui = new Date();
        const dateNaiss = new Date(dateNaissance);
        let age = aujourdhui.getFullYear() - dateNaiss.getFullYear();
        const m = aujourdhui.getMonth() - dateNaiss.getMonth();
        if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaiss.getDate())) age--;
        const ageLegal = parseInt(retraiteSettings.age_legal) || 60;
        if (age >= ageLegal) {
            setIsRcarDisabled(true);
            setAgeMessage(`⚠️ L'employé a ${age} ans (≥ ${ageLegal} ans). RCAR désactivé car age de retraite atteint.`);
        } else {
            setIsRcarDisabled(false);
            setAgeMessage(`✓ Âge: ${age} ans (retraite à ${ageLegal} ans)`);
        }
    };

    const fetchConfig = async (year) => {
        if (!year) return;
        try {
            const res = await axiosClient.get(`/api/gestionEtat/get-by-year/${year}`);
            setConfigData(res.data);
        } catch (err) {
            console.error(err);
            setConfigData({ roles: [] });
        }
    };

    const fetchAnnees = async () => {
        try {
            const res = await axiosClient.get('/api/gestionEtat/years');
            const anneesData = res.data || [];
            const currentYearVal = new Date().getFullYear();
            const startYear = 2024;
            const filteredAnnees = anneesData
                .filter(a => a.year >= startYear && a.year <= currentYearVal)
                .sort((a, b) => a.year - b.year);
            setAnnees(filteredAnnees);
            const currentYearObj = filteredAnnees.find(a => a.year === currentYearVal);
            if (currentYearObj) {
                setSelectedAnnee(currentYearVal);
                setSelectedAnneeId(currentYearObj.id);
                localStorage.setItem('employee_selected_year', currentYearVal);
            } else if (filteredAnnees.length > 0) {
                const lastYear = filteredAnnees[filteredAnnees.length - 1];
                setSelectedAnnee(lastYear.year);
                setSelectedAnneeId(lastYear.id);
            } else {
                setSelectedAnnee(2024);
                setSelectedAnneeId(null);
            }
        } catch (err) {
            console.error(err);
            showNotification("Erreur chargement des annees", "error");
        }
    };

    const fetchEmployees = useCallback(async (page = 1) => {
        if (!selectedAnneeId) return;
        setLoading(true);
        try {
            const res = await axiosClient.get(`/api/employees`, { 
                params: { ...filters, page, annee_id: selectedAnneeId } 
            });
            const employeesWithDetails = await Promise.all(
                (res.data.data || []).map(async (emp) => {
                    try {
                        const salaryRes = await axiosClient.get(`/api/employees/${emp.id}/salary-dashboard`);
                        return { ...emp, details: salaryRes.data.salary_details };
                    } catch (err) {
                        return { ...emp, details: null };
                    }
                })
            );
            setEmployeesList(employeesWithDetails);
            setPaginationData({ ...res.data, data: employeesWithDetails });
        } catch (err) { 
            console.error(err);
            showNotification("Erreur chargement des employes", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedAnneeId, filters]);

    const fetchCotisations = async () => {
        if (!selectedAnnee) return;
        setLoading(true);
        try {
            const res = await axiosClient.get('/api/cotisations', {
                params: { year: selectedAnnee }
            });
            const organismesList = res.data || [];
            setCotisationsList(organismesList);
        } catch (err) {
            console.error(err);
            setCotisationsList([]);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // useEffectS
    // ============================================================
    useEffect(() => {
        if (selectedAnnee) {
            fetchConfig(selectedAnnee);
            fetchEmployees();
        }
    }, [selectedAnnee]);

    useEffect(() => {
        if (selectedAnnee) {
            fetchCotisations();
        }
    }, [selectedAnnee]);

    useEffect(() => {
        fetchAnnees();
    }, []);

    useEffect(() => {
        if (selectedAnneeId) fetchEmployees(currentPage);
    }, [filters, currentPage, selectedAnneeId]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearRef.current && !yearRef.current.contains(event.target)) setIsYearOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================================
    // FONCTIONS CRUD
    // ============================================================
    
    const handleViewEmployee = (emp) => {
        if (emp.details) {
            setSelectedEmployeeDetails(emp);
            setShowDetailsModal(true);
        } else {
            axiosClient.get(`/api/employees/${emp.id}/salary-dashboard`).then(res => {
                setSelectedEmployeeDetails({ ...emp, details: res.data.salary_details });
                setShowDetailsModal(true);
            }).catch(() => showNotification("Erreur chargement des détails salaire", "error"));
        }
    };

    const handleEdit = (emp) => {
        if (!isYearEditable) {
            showNotification(`L'annee ${selectedAnnee} est passee.`, "warning");
            return;
        }
        const formatDateForInput = (dateString) => {
            if (!dateString) return '';
            if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) return dateString;
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        };
        setFormData({
            prenom: emp.prenom || "", nom: emp.nom || "", email: emp.email || "",
            telephone: emp.telephone || "",
            date_naissance: formatDateForInput(emp.date_naissance),
            situation_familiale: emp.situation_familiale || "",
            nombre_enfants: emp.nombre_enfants || 0,
            date_embauche: formatDateForInput(emp.date_embauche),
            annee_id: emp.annee_id || "", Post_id: emp.Post_id || "",
            grade_id: emp.grade_id || "", echelle_id: emp.echelle_id || "",
            echelon_id: emp.echelon_id || "",
            grade: emp.grade || "", echelle: emp.echelle || "",
            echelon: emp.echelon || "", salaire: emp.salaire || "",
            indice: emp.indice || "", statut: emp.statut || "ACTIF",
            cotisation_id: emp.cotisation_id || "", role: emp.role || "", password: ""
        });
        setCurrentId(emp.id);
        setIsEdit(true);
        setErrors({});
        setRegeneratePassword(false);
        setSendCredentialsEmail(true);
        
        if (emp.Post_id && configData?.Post) {
            const post = configData.Post.find(p => p.id === emp.Post_id);
            if (post) {
                setSelectedPost(post);
                if (emp.grade_id) {
                    const grade = post.grades?.find(g => g.id === emp.grade_id);
                    if (grade) {
                        setSelectedGrade(grade);
                        if (emp.echelle_id) {
                            const echelle = grade.echelles?.find(e => e.id === emp.echelle_id);
                            if (echelle) setSelectedEchelle(echelle);
                        }
                    }
                }
            }
        }
        
        if (emp.cotisation_id) {
            const restoreOrganisme = () => {
                if (cotisationsList.length > 0) {
                    const cotisation = cotisationsList.find(c => c.id === parseInt(emp.cotisation_id));
                    if (cotisation) {
                        setSelectedCotisation(cotisation);
                        setFormData(prev => ({ ...prev, cotisation_id: emp.cotisation_id }));
                    }
                } else {
                    setTimeout(restoreOrganisme, 100);
                }
            };
            restoreOrganisme();
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = (id, name) => {
        if (!isYearEditable) {
            showNotification(`L'annee ${selectedAnnee} est passee.`, "warning");
            return;
        }
        setDeleteModal({ isOpen: true, employeeId: id, employeeName: name });
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            await axiosClient.delete(`/api/employees/${deleteModal.employeeId}`);
            fetchEmployees(currentPage);
            showNotification("Employe supprime avec succes", "success");
            setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" });
        } catch (err) { 
            console.error(err);
            showNotification("Erreur lors de la suppression", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        if (!isYearEditable) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (name === 'date_naissance') verifierAgeRetraite(value);
    };

    const handlePostChange = (postId) => {
        if (!isYearEditable) return;
        const post = configData?.Post?.find(p => p.id === parseInt(postId));
        setSelectedPost(post);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setFormData({
            ...formData, Post_id: postId,
            grade_id: '', grade: '', echelle_id: '', echelle: '',
            echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleGradeChange = (gradeId) => {
        if (!isYearEditable) return;
        const grade = selectedPost?.grades?.find(g => g.id === parseInt(gradeId));
        setSelectedGrade(grade);
        setSelectedEchelle(null);
        setFormData({
            ...formData, grade_id: gradeId, grade: grade?.name || '',
            echelle_id: '', echelle: '', echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleEchelleChange = (echelleId) => {
        if (!isYearEditable) return;
        const echelle = selectedGrade?.echelles?.find(e => e.id === parseInt(echelleId));
        setSelectedEchelle(echelle);
        setFormData({
            ...formData, echelle_id: echelleId, echelle: echelle?.level || '',
            echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleEchelonChange = (echelonId) => {
        if (!isYearEditable) return;
        const echelon = selectedEchelle?.echelons?.find(e => e.id === parseInt(echelonId));
        setFormData({
            ...formData, echelon_id: echelonId, echelon: echelon?.order || '',
            salaire: echelon?.salary || '', indice: echelon?.index_val || ''
        });
    };

    const handleCotisationChange = (cotisationId) => {
        if (!isYearEditable) return;
        const cotisation = cotisationsList.find(c => c.id === parseInt(cotisationId));
        setSelectedCotisation(cotisation);
        setFormData({ ...formData, cotisation_id: cotisationId });
    };

    const generateRandomPassword = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let password = '';
        for (let i = 0; i < 10; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    // validation 
    const verifierAge = (dateNaissance) => {
        if (!dateNaissance) return false;
        const aujourdhui = new Date();
        const dateNaiss = new Date(dateNaissance);
        let age = aujourdhui.getFullYear() - dateNaiss.getFullYear();
        const m = aujourdhui.getMonth() - dateNaiss.getMonth();
        if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaiss.getDate())) age--;
        return age >= 18;
    };

    const verifierDateEmbauche = (dateEmbauche) => {
        if (!dateEmbauche || !selectedAnnee) return false;
        const anneeEmbauche = new Date(dateEmbauche).getFullYear();
        return anneeEmbauche === parseInt(selectedAnnee);
    };

    const scrollToError = (fieldName) => {
        const element = document.querySelector(`[name="${fieldName}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('border-red-500', 'ring-2', 'ring-red-500');
            setTimeout(() => element.classList.remove('border-red-500', 'ring-2', 'ring-red-500'), 3000);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.prenom?.trim())
             newErrors.prenom = "Prenom requis";


        if (!formData.cotisation_id) {
            newErrors.cotisation_id = "Veuillez sélectionner un organisme de cotisation";
        }
        if (!formData.nom?.trim()) 
            newErrors.nom = "Nom requis";
        if (!formData.email?.trim()) {
            newErrors.email = "Email requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email invalide";
        }
        if (!formData.role) 
            newErrors.role = "Role requis";
        if (formData.telephone && !/^[0-9+\-\s]{8,15}$/.test(formData.telephone)) {
            newErrors.telephone = "Telephone invalide";
        }
        if (!formData.date_naissance) {
            newErrors.date_naissance = "Date de naissance requise";
        } else if (!verifierAge(formData.date_naissance)) {
            newErrors.date_naissance = "L'employe doit avoir au moins 18 ans";
        }
        if (!formData.date_embauche) {
            newErrors.date_embauche = "Date d'embauche requise";
        } else if (!verifierDateEmbauche(formData.date_embauche)) {
            newErrors.date_embauche = `La date d'embauche doit etre dans l'annee ${selectedAnnee}`;
        }
        if (formData.nombre_enfants && (parseInt(formData.nombre_enfants) < 0 || parseInt(formData.nombre_enfants) > 20)) {
            newErrors.nombre_enfants = "Nombre d'enfants invalide (0-20)";
        }
        if (!formData.Post_id) newErrors.Post_id = "Veuillez selectionner un poste";
        if (!formData.grade_id) newErrors.grade_id = "Veuillez selectionner un grade";
        if (!formData.echelle_id) newErrors.echelle_id = "Veuillez selectionner une echelle";
        if (!formData.echelon_id) newErrors.echelon_id = "Veuillez selectionner un echelon";
        if (!formData.cotisation_id) newErrors.cotisation_id = "Veuillez selectionner un organisme de cotisation";
        
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            scrollToError(firstErrorField);
            showNotification(`${newErrors[firstErrorField]}`, "error");
            return false;
        }
        return true;
    };

    // Submit DATA
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isYearEditable) {
            showNotification(`L'annee ${selectedAnnee} est passee.`, "error");
            return;
        }
        if (!validateForm()) {
            showNotification("Veuillez corriger les erreurs", "error");
            return;
        }
        if (!selectedAnneeId) {
            showNotification("Aucune annee selectionnee", "error");
            return;
        }
        setLoading(true);
        try {
            let finalPassword = formData.password;
            if (!isEdit && (!finalPassword || finalPassword.trim() === '')) {
                finalPassword = generateRandomPassword();
            }
            const submitData = {
                prenom: formData.prenom, nom: formData.nom, email: formData.email,
                telephone: formData.telephone || null,
                date_naissance: formData.date_naissance || null,
                situation_familiale: formData.situation_familiale || null,
                nombre_enfants: formData.nombre_enfants ? parseInt(formData.nombre_enfants) : 0,
                date_embauche: formData.date_embauche || null,
                annee_id: selectedAnneeId,
                Post_id: formData.Post_id ? parseInt(formData.Post_id) : null,
                grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
                echelle_id: formData.echelle_id ? parseInt(formData.echelle_id) : null,
                echelon_id: formData.echelon_id ? parseInt(formData.echelon_id) : null,
                grade: formData.grade || null, echelle: formData.echelle || null,
                echelon: formData.echelon ? String(formData.echelon) : null,
                salaire: formData.salaire ? parseFloat(formData.salaire) : null,
                indice: formData.indice ? parseFloat(formData.indice) : null,
                statut: formData.statut,
                cotisation_id: formData.cotisation_id ? parseInt(formData.cotisation_id) : null,
                password: finalPassword, role: formData.role,
                send_credentials_email: sendCredentialsEmail,
            };
            
            if (isEdit) {
                if (regeneratePassword) {
                    submitData.regenerate_password = true;
                    submitData.send_email = sendCredentialsEmail;
                }
                const res = await axiosClient.put(`/api/employees/${currentId}`, submitData);
                showNotification(res.data.message || "Employe modifie avec succes", "success");
            } else {
                const res = await axiosClient.post('/api/employees', submitData);
                showNotification(res.data.message || "Employe ajoute avec succes", "success");
            }
            resetForm();
            fetchEmployees(currentPage);
        } catch (error) {
            console.error("Error:", error.response?.data);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(key => showNotification(`${key}: ${errors[key][0]}`, "error"));
                setErrors(errors);
            } else {
                showNotification(error.response?.data?.message || "Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Reset FORM
    const resetForm = () => {
        setFormData({
            prenom: "", nom: "", email: "", telephone: "", role: "", password: "",
            date_naissance: "", situation_familiale: "", nombre_enfants: "",
            date_embauche: "", annee_id: "", Post_id: "", grade_id: "", echelle_id: "", echelon_id: "",
            grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
            cotisation_id: ""
        });
        setSelectedPost(null);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setSelectedCotisation(null);
        setErrors({});
        setIsEdit(false);
        setCurrentId(null);
        setSendCredentialsEmail(true);
        setRegeneratePassword(false);
    };

    const handleYearChange = (yearValue, yearId) => {
        setSelectedAnnee(yearValue);
        setSelectedAnneeId(yearId);
        localStorage.setItem('employee_selected_year', yearValue);
        resetForm();
        showNotification(`Annee ${yearValue} selectionnee`, "success");
    };

    const handleExportPDF = async () => {
        if (employeesList.length === 0) {
            showNotification("Aucun employe a exporter", "warning");
            return;
        }
        setLoading(true);
        try {
            const response = await axiosClient.get('/api/employees/export-pdf', {
                params: { ...filters, annee_id: selectedAnneeId },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `employes_${selectedAnnee}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showNotification("PDF exporte avec succes", "success");
        } catch (error) {
            console.error(error);
            showNotification("Erreur lors de l'export PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    const posts = configData?.Post || [];
    const grades = selectedPost?.grades || [];
    const echelles = selectedGrade?.echelles || [];
    const echelons = selectedEchelle?.echelons || [];

    // ============================================================
    // EMPLOYEE DETAILS MODAL
    // ============================================================
    const EmployeeDetailsModal = ({ employee, onClose }) => {
        const details = employee.details;
        
        const formatMoney = (amount) => {
            return (amount || 0).toLocaleString() + ' MAD';
        };
        
        const getRoleBadge = (role) => {
            switch(role) {
                case 'rh': 
                    return { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '', label: 'RH' };
                default: 
                    return { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: '', label: 'Employé' };
            }
        };
        
        const roleBadge = getRoleBadge(employee.role);
        
        if (!details) {
            return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className={`${cardClass} rounded-2xl p-8 shadow-2xl`}>
                        <Loader size={40} className="animate-spin mx-auto text-indigo-500" />
                        <p className={`mt-4 text-center ${textClass} font-medium`}>Chargement des détails...</p>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`${cardClass} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInUp`}>
                    <div className={`sticky top-0 z-10 ${cardClass} px-6 py-4 border-b ${borderClass} flex justify-between items-center bg-opacity-95 backdrop-blur-sm`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                                <Users size={18} className="text-white" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${textClass}`}>Fiche employé</h2>
                                <p className={`text-xs ${textMutedClass}`}>Informations détaillées et calcul du salaire</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition-all cursor-pointer">
                            <X size={20} className={textMutedClass} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                    <User size={16} className="text-emerald-500" /> Informations personnelles
                                </h3>
                                <div className="h-px bg-gradient-to-r from-emerald-500 to-transparent mt-2"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Nom complet</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.prenom} {employee.nom}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Email</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1 truncate`}>{employee.email}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Téléphone</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.telephone || '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Statut</p>
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                        employee.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                                        employee.statut === 'CONGE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                                        'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                    }`}>{employee.statut}</span>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Situation familiale</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.situation_familiale || '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Enfants à charge</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.nombre_enfants || '0'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Date de naissance</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.date_naissance ? new Date(employee.date_naissance).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Date d'embauche</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString('fr-FR') : '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Rôle système</p>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${roleBadge.bg}`}>
                                        <span>{roleBadge.icon}</span> {roleBadge.label}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                                    <Briefcase size={16} className="text-indigo-500" /> Classification
                                </h3>
                                <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent mt-2"></div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Poste</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.post?.name || employee.grade || '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Grade</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.grade || '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Echelle</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.echelle || '-'}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <p className={`text-xs ${textMutedClass}`}>Echelon</p>
                                    <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.echelon || '-'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                                    <TrendingUp size={16} className="text-blue-500" /> Salaire de base et indemnités
                                </h3>
                                <div className="h-px bg-gradient-to-r from-blue-500 to-transparent mt-2"></div>
                            </div>
                            <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                <div className="flex justify-between items-center pb-2 border-b ${borderClass}">
                                    <span className={`text-sm font-medium ${textClass}`}>Salaire de base</span>
                                    <span className="text-sm font-semibold text-emerald-600">{formatMoney(details.base_salary)}</span>
                                </div>
                                {details.indemnites?.details?.length > 0 && (
                                    <div className="mt-3">
                                        <p className={`text-xs ${textMutedClass} mb-2`}>Indemnités appliquées :</p>
                                        {details.indemnites.details.map((ind, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1">
                                                <div>
                                                    <span className={`text-sm ${textClass}`}>{ind.libelle}</span>
                                                    <span className={`text-xs ml-2 ${textMutedClass}`}>
                                                        ({ind.type === 'Fixe' ? 'Fixe' : `${ind.valeur}%`})
                                                    </span>
                                                </div>
                                                <span className="text-sm text-blue-600">+{formatMoney(ind.montant)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                            <span className={`text-sm font-semibold ${textClass}`}>Total indemnités</span>
                                            <span className="text-sm font-bold text-blue-600">+{formatMoney(details.indemnites.total)}</span>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between items-center mt-3 pt-2 border-t ${borderClass}">
                                    <span className={`text-base font-bold ${textClass}`}>Salaire brut</span>
                                    <span className="text-base font-bold text-purple-600">{formatMoney(details.brut_salary)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
                                    <Shield size={16} className="text-rose-500" /> Déductions
                                </h3>
                                <div className="h-px bg-gradient-to-r from-rose-500 to-transparent mt-2"></div>
                            </div>
                            <div className="space-y-4">
                                {details.cotisations?.details?.length > 0 && (
                                    <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                                                <Percent size={14} className="text-gray-600" />
                                            </div>
                                            <h4 className={`text-sm font-semibold ${textClass}`}>Cotisations sociales</h4>
                                        </div>
                                        {details.cotisations.details.map((cot, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b ${borderClass} last:border-0">
                                                <div>
                                                    <span className={`text-sm ${textClass}`}>{cot.name}</span>
                                                    <span className={`text-xs ml-2 ${textMutedClass}`}>({cot.taux}%)</span>
                                                    {cot.organisme && <span className={`text-xs ml-2 ${textMutedClass}`}>- {cot.organisme}</span>}
                                                </div>
                                                <span className="text-sm text-rose-600">- {formatMoney(cot.montant)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                            <span className={`text-sm font-semibold ${textClass}`}>Total cotisations</span>
                                            <span className="text-sm font-bold text-rose-600">- {formatMoney(details.cotisations.total)}</span>
                                        </div>
                                    </div>
                                )}
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <span className={`text-sm font-medium ${textClass}`}>IR (Impôt sur le revenu)</span>
                                            <p className={`text-xs ${textMutedClass} mt-0.5`}>Taux: {details.ir?.taux || 0}%</p>
                                        </div>
                                        <span className="text-sm font-semibold text-rose-600">- {formatMoney(details.ir?.total || 0)}</span>
                                    </div>
                                </div>
                                {details.rcar?.details?.length > 0 && (
                                    <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                                <Shield size={14} className="text-orange-600" />
                                            </div>
                                            <h4 className={`text-sm font-semibold ${textClass}`}>RCAR (Retraite)</h4>
                                        </div>
                                        {details.rcar.details.map((detail, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b ${borderClass} last:border-0">
                                                <div>
                                                    <span className={`text-sm ${textClass}`}>{detail.name}</span>
                                                    <span className={`text-xs ml-2 ${textMutedClass}`}>({detail.taux}%)</span>
                                                    {detail.plafond > 0 && (
                                                        <span className={`text-xs ml-2 ${textMutedClass}`}>Plafond: {formatMoney(detail.plafond)}</span>
                                                    )}
                                                </div>
                                                <span className="text-sm text-rose-600">- {formatMoney(detail.montant)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                            <span className={`text-sm font-semibold ${textClass}`}>Total RCAR</span>
                                            <span className="text-sm font-bold text-rose-600">- {formatMoney(details.rcar.total)}</span>
                                        </div>
                                    </div>
                                )}
                                {details.sntl?.details?.length > 0 && (
                                    <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                                <Shield size={14} className="text-amber-600" />
                                            </div>
                                            <h4 className={`text-sm font-semibold ${textClass}`}>SNTL</h4>
                                        </div>
                                        {details.sntl.details.map((sntlItem, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b ${borderClass} last:border-0">
                                                <div>
                                                    <span className={`text-sm ${textClass}`}>{sntlItem.label}</span>
                                                    <span className={`text-xs ml-2 ${textMutedClass}`}>
                                                        ({sntlItem.type === 'fixe' ? `${sntlItem.valeur} MAD` : `${sntlItem.valeur}%`})
                                                    </span>
                                                </div>
                                                <span className="text-sm text-rose-600">- {formatMoney(sntlItem.montant)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                            <span className={`text-sm font-semibold ${textClass}`}>Total SNTL</span>
                                            <span className="text-sm font-bold text-rose-600">- {formatMoney(details.sntl.total)}</span>
                                        </div>
                                    </div>
                                )}
                                {details.assurances?.details?.length > 0 && (
                                    <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                                <Shield size={14} className="text-blue-600" />
                                            </div>
                                            <h4 className={`text-sm font-semibold ${textClass}`}>Assurances sociales</h4>
                                        </div>
                                        {details.assurances.details.map((ass, idx) => (
                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b last:border-0">
                                                <div>
                                                    <span className={`text-sm ${textClass}`}>{ass.name}</span>
                                                    <span className={`text-xs ml-2 ${textMutedClass}`}>({ass.taux_salarie}%)</span>
                                                </div>
                                                <span className="text-sm text-rose-600">- {formatMoney(ass.montant_salarie)}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                            <span className={`text-sm font-semibold ${textClass}`}>Total assurances</span>
                                            <span className="text-sm font-bold text-rose-600">- {formatMoney(details.assurances.salarie)}</span>
                                        </div>
                                    </div>
                                )}
                                {details.credits?.details?.length > 0 && (
                                    <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                                <DollarSign size={14} className="text-purple-600" />
                                            </div>
                                            <h4 className={`text-sm font-semibold ${textClass}`}>Crédits en cours</h4>
                                        </div>
                                        {details.credits.details.map((credit, idx) => (
                                            <div key={idx} className="py-2 border-b ${borderClass} last:border-0">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <span className={`text-sm font-medium ${textClass}`}>{credit.name}</span>
                                                        <p className={`text-xs ${textMutedClass} mt-1`}>Mensualité: {formatMoney(credit.mensualite)}</p>
                                                        {credit.reste && <p className={`text-xs ${textMutedClass}`}>Reste: {formatMoney(credit.reste)}</p>}
                                                    </div>
                                                    <span className="text-sm font-semibold text-rose-600">- {formatMoney(credit.mensualite)}</span>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center mt-3 pt-2 border-t ${borderClass}">
                                            <span className={`text-sm font-semibold ${textClass}`}>Total crédits</span>
                                            <span className="text-sm font-bold text-rose-600">- {formatMoney(details.credits.total)}</span>
                                        </div>
                                    </div>
                                )}
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass} bg-gray-50 dark:bg-gray-800`}>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-base font-bold ${textClass}`}>Total des déductions</span>
                                        <span className="text-base font-bold text-rose-600">- {formatMoney(details.total_deductions)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <div className={`p-5 rounded-xl border-2 ${darkMode ? 'border-indigo-800 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50'}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className={`text-lg font-bold ${textClass}`}>Salaire net à payer</span>
                                        <p className={`text-xs ${textMutedClass} mt-0.5`}>Après toutes déductions</p>
                                    </div>
                                    <span className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{formatMoney(details.net_salary)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4 border-t ${borderClass}">
                            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ============================================================
    // RENDU PRINCIPAL
    // ============================================================
    return (
        <div className={`min-h-screen transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-7xl mx-auto p-1 md:p-2">
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className={`text-2xl md:text-3xl font-bold ${textClass} flex items-center gap-3`}>
                                <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                                    <Users size={22} className="text-white" />
                                </div>
                                Gestion des Employés
                            </h1>
                            <p className={`text-sm ${textMutedClass} mt-2`}>
                                Année: <span className={`font-semibold ${textClass} bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md`}>{selectedAnnee}</span>
                                {' '}• Total: <span className={`font-semibold ${textClass}`}>{paginationData.total || 0}</span> employés
                            </p>
                        </div>
                        <div className="flex gap-2 items-center">
                            <div className="relative" ref={yearRef}>
                                <button onClick={() => setIsYearOpen(!isYearOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${cardClass} ${textClass} cursor-pointer text-sm`}>
                                    <Calendar size={16} className={textMutedClass} />
                                    <span>{selectedAnnee || 'Sélectionner'}</span>
                                    <ChevronDown size={14} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isYearOpen && (
                                    <div className={`absolute top-full right-0 mt-2 rounded-xl border ${cardClass} z-50 min-w-[160px] shadow-xl`}>
                                        {annees.map(y => (
                                            <div key={y.id} onClick={() => { handleYearChange(y.year, y.id); setIsYearOpen(false); }} 
                                                className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm flex justify-between items-center ${selectedAnnee == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600' : textClass}`}>
                                                <span>{y.year}</span>
                                                {y.year < currentYear && (<span className="text-xs text-gray-400 flex items-center gap-1"><Lock size={10} /> Lecture</span>)}
                                                {y.year === currentYear && (<span className="text-xs text-green-500 flex items-center gap-1"><Edit2 size={10} /> Modifiable</span>)}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button onClick={handleExportPDF} disabled={loading || employeesList.length === 0} 
                                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-lg text-sm font-medium">
                                <Download size={16} /> <span className="hidden sm:inline">Exporter PDF</span>
                            </button>
                        </div>
                    </div>
                </div>

                {showForm && (
                    <div className={`${cardClass} rounded-xl p-4 md:p-5 mb-6 border shadow-xl`}>
                        <div className="flex justify-between items-center mb-5">
                            <h2 className={`text-lg md:text-xl font-bold ${textClass} flex items-center gap-2`}>
                                {isEdit ? <Edit2 size={18} className="text-indigo-500" /> : <UserPlus size={18} className="text-indigo-500" />}
                                {isEdit ? `Modifier l'employé — ${selectedAnnee}` : `Ajouter un employé — ${selectedAnnee}`}
                            </h2>
                            {isEdit && (<button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"><X size={14} /> Annuler</button>)}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <div className="mb-3">
                                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                        <div className="w-1 h-5 bg-gradient-to-b from-emerald-500 to-green-600 rounded-full"></div>
                                        <User size={16} className="text-emerald-500" /> Information Personnelle
                                    </h3>
                                    <div className="h-px bg-gradient-to-r from-emerald-500 to-transparent mt-2"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Prénom</label>
                                        <input placeholder="Mohamed" name="prenom" required value={formData.prenom} onChange={handleChange} className={`w-full ${errors.prenom ? inputErrorClass : inputClass}`} />
                                        {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nom</label>
                                        <input placeholder="Nom" name="nom" required value={formData.nom} onChange={handleChange} className={`w-full ${errors.nom ? inputErrorClass : inputClass}`} />
                                        {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Email</label>
                                        <input placeholder="optizarh@exemple.com" name="email" required type="email" value={formData.email} onChange={handleChange} className={`w-full ${errors.email ? inputErrorClass : inputClass}`} />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Téléphone</label>
                                        <input placeholder="0611111212" name="telephone" value={formData.telephone} onChange={handleChange} className={`w-full ${errors.telephone ? inputErrorClass : inputClass}`} />
                                        {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de naissance</label>
                                        <input type="date" name="date_naissance" value={formData.date_naissance || ''} onChange={handleChange} className={`w-full ${errors.date_naissance ? inputErrorClass : inputClass}`} required />
                                        {errors.date_naissance && (<p className="text-red-500 text-xs mt-1"><AlertCircle size={12} /> {errors.date_naissance}</p>)}
                                        {ageMessage && (<p className={`text-xs mt-1 ${isRcarDisabled ? 'text-amber-600' : 'text-emerald-600'}`}>{ageMessage}</p>)}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date d'embauche</label>
                                        <input type="date" name="date_embauche" value={formData.date_embauche || ''} onChange={handleChange} className={`w-full ${errors.date_embauche ? inputErrorClass : inputClass}`} required />
                                        {errors.date_embauche && <p className="text-red-500 text-xs mt-1">{errors.date_embauche}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Situation familiale</label>
                                        <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} className={`w-full ${inputClass}`}>
                                            <option value="">Sélectionner</option>
                                            <option value="Celibataire">Célibataire</option>
                                            <option value="Marie(e)">Marié(e)</option>
                                        </select>
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nombre d'enfants</label>
                                        <input placeholder="0" type="number" name="nombre_enfants" value={formData.nombre_enfants || ''} onChange={handleChange} min="0" max="20" step="1" className={`w-full ${errors.nombre_enfants ? inputErrorClass : inputClass}`} disabled={formData.situation_familiale !== 'Marie(e)'}/>
                                        {errors.nombre_enfants && <p className="text-red-500 text-xs mt-1">{errors.nombre_enfants}</p>}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="mb-3">
                                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                        <div className="w-1 h-5 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                                        <Briefcase size={16} className="text-indigo-500" /> Information Professionnelle
                                    </h3>
                                    <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent mt-2"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Poste</label>
                                        <select value={formData.Post_id || ""} onChange={(e) => handlePostChange(e.target.value)} className={`w-full ${errors.Post_id ? inputErrorClass : inputClass}`} required>
                                            <option value="">Sélectionner un poste</option>
                                            {posts.map(post => (<option key={post.id} value={post.id}>{post.name} {post.is_starred && '⭐'}</option>))}
                                        </select>
                                        {errors.Post_id && <p className="text-red-500 text-xs mt-1">{errors.Post_id}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Grade</label>
                                        <select value={formData.grade_id || ""} onChange={(e) => handleGradeChange(e.target.value)} className={`w-full ${inputClass}`} disabled={!selectedPost} required>
                                            <option value="">Sélectionner un grade</option>
                                            {grades.map(grade => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                                        </select>
                                        {errors.grade_id && <p className="text-red-500 text-xs mt-1">{errors.grade_id}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Échelle</label>
                                        <select value={formData.echelle_id || ""} onChange={(e) => handleEchelleChange(e.target.value)} className={`w-full ${inputClass}`} disabled={!selectedGrade} required>
                                            <option value="">Sélectionner une échelle</option>
                                            {echelles.map(echelle => <option key={echelle.id} value={echelle.id}>Échelle {echelle.level}</option>)}
                                        </select>
                                        {errors.echelle_id && <p className="text-red-500 text-xs mt-1">{errors.echelle_id}</p>}
                                    </div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Échelon</label>
                                        <select value={formData.echelon_id || ""} onChange={(e) => handleEchelonChange(e.target.value)} className={`w-full ${inputClass}`} disabled={!selectedEchelle} required>
                                            <option value="">Sélectionner un échelon</option>
                                            {echelons.map(echelon => (<option key={echelon.id} value={echelon.id}>Éch. {echelon.order} - {Number(echelon.salary).toLocaleString()} MAD</option>))}
                                        </select>
                                        {errors.echelon_id && <p className="text-red-500 text-xs mt-1">{errors.echelon_id}</p>}
                                    </div>
                                </div>
                                
                                {formData.salaire > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div className={`p-4 rounded-xl border ${borderClass} ${darkMode ? 'bg-emerald-950/20' : 'bg-emerald-50'}`}>
                                            <label className={`text-xs font-medium ${textMutedClass} flex items-center gap-1`}>
                                                <DollarSign size={12} className="text-emerald-500" /> Salaire de base
                                            </label>
                                            <p className={`text-lg md:text-xl font-bold mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                                {Number(formData.salaire).toLocaleString()} MAD
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-xl border ${borderClass} ${darkMode ? 'bg-blue-950/20' : 'bg-blue-50'}`}>
                                            <label className={`text-xs font-medium ${textMutedClass} flex items-center gap-1`}>
                                                <TrendingUp size={12} className="text-blue-500" /> Indice
                                            </label>
                                            <p className={`text-lg md:text-xl font-bold mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                                                {formData.indice || '0'}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {/* Dans le formulaire - Section Information Professionnelle */}
<div className="w-full">
    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>
        Organisme de cotisation <span className="text-red-500">*</span>
    </label>
    <select 
        value={formData.cotisation_id || ""} 
        onChange={(e) => handleCotisationChange(e.target.value)} 
        className={`w-full ${errors.cotisation_id ? inputErrorClass : inputClass}`}
        required
    >
        <option value="">-- Sélectionner un organisme --</option>
        {cotisationsList.map(org => (
            <option key={org.id} value={org.id}>
                {org.name} {org.is_favorite && '⭐'}
            </option>
        ))}
    </select>
    {errors.cotisation_id && <p className="text-red-500 text-xs mt-1">{errors.cotisation_id}</p>}
</div>
                                    <div className="w-full">
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Statut</label>
                                        <select name="statut" value={formData.statut} onChange={handleChange} className={`w-full ${inputClass}`}>
                                            <option value="ACTIF">Actif</option>
                                            <option value="CONGE">Congé</option>
                                            <option value="DEPART">Départ</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <div className="mb-3">
                                        <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                            <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-cyan-600 rounded-full"></div>
                                            <Lock size={16} className="text-blue-500" /> Sécurité & Accès
                                        </h3>
                                        <div className="h-px bg-gradient-to-r from-blue-500 to-transparent mt-2"></div>
                                    </div>
                                    <div className={`p-5 rounded-xl ${cardClass} border ${borderClass} space-y-4`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                                            <label className={`text-sm font-medium ${textClass}`}>Rôle Système</label>
                                            <select name="role" value={formData.role || ""} onChange={handleChange} disabled={isEdit} className={`w-full p-2.5 rounded-xl border transition-all duration-200 ${isEdit ? `bg-gray-100 dark:bg-gray-800 ${borderClass} ${textClass} opacity-70 cursor-not-allowed` : `${inputClass}`}`}>
                                                <option value="">Sélectionner un rôle</option>
                                                <option value="employee"> Employé</option>
                                                <option value="rh"> RH</option>
                                            </select>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div>
                                                <label className={`block text-xs mb-1 ${textMutedClass}`}>Email professionnelle</label>
                                                <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full p-2.5 rounded-lg border bg-transparent ${borderClass} ${textClass} transition-all`} required />
                                            </div>
                                        </div>
                                        {!isEdit && (
                                            <div className="flex items-center gap-3 pt-2">
                                                <input type="checkbox" id="send_credentials_email" checked={sendCredentialsEmail} onChange={(e) => setSendCredentialsEmail(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                <label htmlFor="send_credentials_email" className={`text-sm font-medium cursor-pointer ${textClass}`}><Mail size={16} className="inline mr-2 text-indigo-500" /> Envoyer les identifiants par email à l'employé</label>
                                            </div>
                                        )}
                                        {isEdit && (
                                            <div className={`p-3 rounded-lg border ${darkMode ? 'border-amber-800 bg-amber-950/20' : 'border-amber-200 bg-amber-50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" id="regenerate_password" checked={regeneratePassword} onChange={(e) => setRegeneratePassword(e.target.checked)} className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500 cursor-pointer" />
                                                    <label htmlFor="regenerate_password" className={`text-sm font-medium cursor-pointer ${textClass}`}><RefreshCw size={16} className="inline mr-2 text-amber-500" /> Régénérer le mot de passe</label>
                                                </div>
                                                {regeneratePassword && (
                                                    <div className="mt-3">
                                                        <div className="flex items-center gap-3 ml-7">
                                                            <input type="checkbox" id="send_email_on_regenerate" checked={sendCredentialsEmail} onChange={(e) => setSendCredentialsEmail(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                                                            <label htmlFor="send_email_on_regenerate" className={`text-xs cursor-pointer ${textClass}`}><Mail size={12} className="inline mr-1" /> Envoyer le nouveau mot de passe par email</label>
                                                        </div>
                                                        <p className={`text-xs ${textMutedClass} mt-2 ml-7`}>Un nouveau mot de passe sera généré. L'employé devra le changer à la première connexion.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <button type="submit" disabled={loading} className={`cursor-pointer w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25`}>
                                {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Enregistrer"}
                            </button>
                        </form>
                    </div>
                )}
                
                <div className={`${cardClass} rounded-xl p-4 mb-4 border flex flex-wrap gap-3 items-center`}>
                    <div className="relative flex-1 min-w-[180px]">
                        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${textMutedClass}`} />
                        <input type="text" placeholder="Rechercher..." className={`w-full pl-9 pr-3 py-2 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} />
                    </div>
                    <select value={filters.statut} onChange={e => setFilters(f => ({ ...f, statut: e.target.value }))} className={`px-3 py-2 rounded-lg border ${cardClass} ${textClass} outline-none text-sm cursor-pointer`}>
                        <option value="Tous">Tous statuts</option>
                        <option value="ACTIF">Actif</option>
                        <option value="CONGE">Congé</option>
                        <option value="DEPART">Départ</option>
                    </select>
                    {(filters.statut !== 'Tous' || filters.search) && (<button onClick={() => setFilters({ statut: 'Tous', search: '' })} className="text-xs text-red-500 hover:text-red-700">Réinitialiser</button>)}
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setViewMode('table')} className={`cursor-pointer p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-indigo-600 text-white' : cardClass + ' ' + textClass}`}><List size={18} /></button>
                        <button onClick={() => setViewMode('grid')} className={`cursor-pointer p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : cardClass + ' ' + textClass}`}><Grid3x3 size={18} /></button>
                    </div>
                </div>

                {viewMode === 'table' ? (
                    <div className={`${cardClass} rounded-xl border overflow-hidden shadow-xl`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[900px]">
                                <thead className={darkMode ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-gradient-to-r from-gray-100 to-gray-200'}>
                                    <tr className={`text-left text-xs font-semibold uppercase tracking-wider ${textMutedClass}`}>
                                        {['Employé', 'Poste', 'Grade', 'Rôle', 'Brut', 'Net', 'Statut', 'Actions'].map(h => (<th key={h} className="p-4">{h}</th>))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading && !employeesList.length ? (
                                        <tr><td colSpan="8" className="p-12 text-center"><Loader size={32} className="animate-spin mx-auto text-indigo-500" /></td></tr>
                                    ) : !employeesList.length ? (
                                        <tr><td colSpan="8" className={`p-12 text-center ${textMutedClass}`}><Users size={48} className="mx-auto mb-3 opacity-30" /><p>Aucun employé trouvé</p></td></tr>
                                    ) : (
                                        employeesList.map((emp, idx) => (
                                            <tr key={emp.id} className={`border-t ${borderClass} hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all duration-150 ${idx % 2 === 0 ? (darkMode ? 'bg-black/20' : 'bg-gray-50/30') : ''}`}>
                                                <td className="p-4"><div className={`font-semibold text-sm ${textClass}`}>{emp.prenom} {emp.nom}</div><div className={`text-xs ${textMutedClass} truncate max-w-[180px]`}>{emp.email}</div></td>
                                                <td className={`p-4 text-sm ${textClass}`}>{emp.post?.name || '-'}</td>
                                                <td className={`p-4 text-sm ${textClass}`}>{emp.grade || '-'}</td>
                                                <td className="p-4"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${emp.role === 'rh' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>{emp.role === 'rh' ? ' RH' : ' Employé'}</span></td>
                                                <td className="p-4 font-semibold text-purple-600 dark:text-purple-400 text-sm whitespace-nowrap">{emp.details ? Math.round(emp.details.brut_salary).toLocaleString() + ' MAD' : '…'}</td>
                                                <td className="p-4 font-semibold text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap">{emp.details ? Math.round(emp.details.net_salary).toLocaleString() + ' MAD' : '…'}</td>
                                                <td className="p-4"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${emp.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : emp.statut === 'CONGE' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}><CheckCircle size={10} /> {emp.statut}</span></td>
                                                <td className="p-4"><div className="flex items-center gap-1"><button onClick={() => handleViewEmployee(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer" title="Voir"><Eye size={16} /></button><button onClick={() => handleEdit(emp)} disabled={!isYearEditable} className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`} title="Modifier"><Edit2 size={16} /></button><button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)} disabled={!isYearEditable} className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`} title="Supprimer"><Trash2 size={16} /></button></div></td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {paginationData.last_page > 1 && (
                            <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 p-4 border-t ${borderClass}`}>
                                <span className={`text-sm ${textMutedClass}`}>{paginationData.from || 0} – {paginationData.to || 0} sur {paginationData.total || 0}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1.5 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">←</button>
                                    <span className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm min-w-[40px] text-center">{currentPage}</span>
                                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, paginationData.last_page))} disabled={currentPage === paginationData.last_page} className="px-3 py-1.5 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer">→</button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {employeesList.map(emp => {
                            const getRoleBadge = (role) => {
                                switch(role) {
                                    case 'rh': return { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: '' };
                                    default: return { bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400', icon: '' };
                                }
                            };
                            const roleBadge = getRoleBadge(emp.role);
                            return (
                                <div key={emp.id} className={`${cardClass} rounded-xl border p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md"><User size={16} className="text-white" /></div>
                                            <div><h3 className={`font-semibold ${textClass}`}>{emp.prenom} {emp.nom}</h3><p className={`text-xs ${textMutedClass}`}>{emp.email}</p></div>
                                        </div>
                                        <div className="flex gap-1"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleBadge.bg}`}>{roleBadge.icon} {emp.role === 'superadmin' ? 'Super Admin' : emp.role === 'admin' ? 'Admin' : emp.role === 'rh' ? 'RH' : 'Employé'}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 rounded-lg bg-gray-50/50 dark:bg-gray-800/30">
                                        <div><p className={`text-xs ${textMutedClass}`}>Poste</p><p className={`text-sm font-medium ${textClass}`}>{emp.post?.name || '-'}</p></div>
                                        <div><p className={`text-xs ${textMutedClass}`}>Grade</p><p className={`text-sm font-medium ${textClass}`}>{emp.grade || '-'}</p></div>
                                        <div><p className={`text-xs ${textMutedClass}`}>Brut</p><p className="text-sm font-semibold text-purple-600">{emp.details ? Math.round(emp.details.brut_salary).toLocaleString() + ' MAD' : '…'}</p></div>
                                        <div><p className={`text-xs ${textMutedClass}`}>Net</p><p className="text-sm font-semibold text-emerald-600">{emp.details ? Math.round(emp.details.net_salary).toLocaleString() + ' MAD' : '…'}</p></div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2 border-t">
                                        <button onClick={() => handleViewEmployee(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg cursor-pointer"><Eye size={14} /></button>
                                        <button onClick={() => handleEdit(emp)} disabled={!isYearEditable} className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}><Edit2 size={14} /></button>
                                        <button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)} disabled={!isYearEditable} className={`p-1.5 rounded-lg cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {showDetailsModal && selectedEmployeeDetails && (<EmployeeDetailsModal employee={selectedEmployeeDetails} onClose={() => setShowDetailsModal(false)} />)}
                <DeleteConfirmModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" })} onConfirm={confirmDelete} title="Confirmation de suppression" message={`Êtes-vous sûr de vouloir supprimer l'employé "${deleteModal.employeeName}" ? Cette action est irréversible.`} darkMode={darkMode} />
            </div>
        </div>
    );
}