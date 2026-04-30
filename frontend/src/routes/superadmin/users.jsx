import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Trash2, Edit2, Search, Download, UserPlus, 
    Briefcase, Star, Loader, AlertCircle, 
    Calendar, Mail, Phone, Users, Filter, Plus, X, Lock,
    ChevronDown, Eye, EyeOff, TrendingUp, DollarSign, Percent, Shield
} from 'lucide-react';
import axiosClient from "../../lib/apis/axiosConfig";
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

export default function EmployeeManagement() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
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
    
    // Annees
    const [annees, setAnnees] = useState([]);
    const [selectedAnnee, setSelectedAnnee] = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const yearRef = useRef(null);
    
    // Classification data from GestionEtat
    const [configData, setConfigData] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedEchelle, setSelectedEchelle] = useState(null);
    
    // Cotisations
    const [cotisationsList, setCotisationsList] = useState([]);
    const [selectedCotisation, setSelectedCotisation] = useState(null);
    
    // Indemnites
    const [indemnitesList, setIndemnitesList] = useState([]);
    
    // IR Settings
    const [irSettings, setIrSettings] = useState([]);

    // Form data
    const [formData, setFormData] = useState({
        prenom: "", nom: "", email: "", telephone: "",
        date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
        departement: "", date_embauche: "",
        type_contrat: "", annee_id: "", role_id: "", grade_id: "", echelle_id: "", echelon_id: "",
        grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
        cotisation_type: "", cotisation_id: "", cotisation_rubrique_id: "", cotisation_label: "", cotisation_taux: ""
    });

    // ==================== RÈGLE ====================
    const currentYear = new Date().getFullYear();
    const isYearEditable = parseInt(selectedAnnee) === currentYear;
    const showForm = isYearEditable;

    // Fetch IR Settings
    const fetchIrSettings = async () => {
        if (!selectedAnnee) return;
        try {
            const res = await axiosClient.get(`/api/ir/settings/${selectedAnnee}`);
            setIrSettings(res.data.data_rows || []);
        } catch (err) {
            console.error(err);
            setIrSettings([]);
        }
    };

    // Fetch indemnites
    const fetchIndemnites = async () => {
        if (!selectedAnneeId) return;
        try {
            const res = await axiosClient.get(`/api/gestionEtat/gestionindemnites/${selectedAnneeId}`);
            setIndemnitesList(res.data || []);
        } catch (err) {
            console.error(err);
            setIndemnitesList([]);
        }
    };

    // Calculer IR selon le barème
    const calculateIR = (salaireBrut, situationFamiliale, nombreEnfants) => {
        if (!irSettings.length) return 0;
        
        let salaireImposable = salaireBrut;
        
        // Déductions selon situation familiale
        if (situationFamiliale === 'Marié(e)') {
            // Déduction pour conjoint
            const deductionConjoint = irSettings.find(row => row.max === 0 || salaireImposable <= row.max);
            if (deductionConjoint) {
                salaireImposable -= deductionConjoint.marie || 0;
            }
        }
        
        // Déduction pour enfants
        if (nombreEnfants > 0) {
            const deductionEnfant = irSettings.find(row => row.max === 0 || salaireImposable <= row.max);
            if (deductionEnfant) {
                if (nombreEnfants === 1) {
                    salaireImposable -= deductionEnfant.enfant1 || 0;
                } else if (nombreEnfants >= 2) {
                    salaireImposable -= (deductionEnfant.enfant1 || 0) + (deductionEnfant.enfant2 || 0) * (nombreEnfants - 1);
                }
            }
        }
        
        if (salaireImposable <= 0) return 0;
        
        // Calcul IR par tranche
        let irTotal = 0;
        let remaining = salaireImposable;
        
        for (let i = 0; i < irSettings.length; i++) {
            const tranche = irSettings[i];
            const min = tranche.min;
            const max = tranche.max === 0 ? Infinity : tranche.max;
            const taux = tranche.taux;
            
            if (remaining <= 0) break;
            
            const trancheMontant = Math.min(remaining, max - min);
            if (trancheMontant > 0) {
                irTotal += (trancheMontant * taux) / 100;
                remaining -= trancheMontant;
            }
        }
        
        return Math.round(irTotal);
    };

    // Calculer les indemnités pour un employé
    const calculateIndemnitesForEmployee = (salaireBase, roleId, gradeId, echelleId, echelonId) => {
        let total = 0;
        const appliedIndemnites = [];
        
        const applicableIndemnites = indemnitesList.filter(ind => {
            if (ind.is_for_all) return true;
            if (ind.role_id && ind.role_id !== roleId) return false;
            if (ind.grade_id && ind.grade_id !== gradeId) return false;
            if (ind.echelle_id && ind.echelle_id !== echelleId) return false;
            if (ind.echelon_id && ind.echelon_id !== echelonId) return false;
            return true;
        });

        applicableIndemnites.forEach(ind => {
            let montant = 0;
            if (ind.type === 'Fixe') {
                montant = parseFloat(ind.valeur);
            } else if (ind.type === 'Pourcentage') {
                montant = (salaireBase * parseFloat(ind.valeur)) / 100;
            }
            total = total + montant;
            appliedIndemnites.push({
                libelle: ind.libelle,
                type: ind.type,
                valeur: ind.valeur,
                montant: montant
            });
        });
        
        return { total, appliedIndemnites };
    };

    // Calculer les cotisations RCAR
    const calculateRCAR = (salaireBrut) => {
        // Récupérer le taux RCAR depuis la config (par défaut 2%)
        let rcarTaux = 0.02;
        // Ici tu peux charger les taux RCAR depuis l'API si besoin
        return salaireBrut * rcarTaux;
    };

    // Calculer les cotisations CNSS
    const calculateCNSS = (salaireBrut) => {
        const plafondCNSS = 6000; // Plafond CNSS mensuel par défaut
        const tauxCNSS = 0.045; // 4.5%
        const baseCNSS = Math.min(salaireBrut, plafondCNSS);
        return baseCNSS * tauxCNSS;
    };

    // Calculer le salaire brut et les détails
    const calculateSalaryDetails = (employee) => {
        const baseSalary = parseFloat(employee.salaire) || 0;
        const indemnitesResult = calculateIndemnitesForEmployee(
            baseSalary,
            employee.role_id,
            employee.grade_id,
            employee.echelle_id,
            employee.echelon_id
        );
        const totalIndemnites = indemnitesResult.total;
        const appliedIndemnites = indemnitesResult.appliedIndemnites;
        
        const brutSalary = baseSalary + totalIndemnites;
        
        // Calcul des cotisations
        const cnss = calculateCNSS(brutSalary);
        const ir = calculateIR(brutSalary, employee.situation_familiale, parseInt(employee.nombre_enfants) || 0);
        const rcar = calculateRCAR(brutSalary);
        const totalCotisations = cnss + ir + rcar;
        const netSalary = brutSalary - totalCotisations;
        
        return {
            baseSalary,
            totalIndemnites,
            appliedIndemnites,
            brutSalary,
            cnss,
            ir,
            rcar,
            totalCotisations,
            netSalary
        };
    };

    useEffect(() => {
        if (selectedAnneeId) {
            fetchIndemnites();
        }
    }, [selectedAnneeId]);

    useEffect(() => {
        if (selectedAnnee) {
            fetchIrSettings();
        }
    }, [selectedAnnee]);

    // Close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearRef.current && !yearRef.current.contains(event.target)) {
                setIsYearOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Validation helper
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.prenom?.trim()) newErrors.prenom = "Prénom requis";
        if (!formData.nom?.trim()) newErrors.nom = "Nom requis";
        if (!formData.email?.trim()) {
            newErrors.email = "Email requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email invalide";
        }
        if (formData.telephone && !/^[0-9+\-\s]{8,15}$/.test(formData.telephone)) {
            newErrors.telephone = "Téléphone invalide";
        }
        if (!formData.date_naissance) newErrors.date_naissance = "Date de naissance requise";
        if (!formData.date_embauche) newErrors.date_embauche = "Date d'embauche requise";
        if (formData.nombre_enfants && (parseInt(formData.nombre_enfants) < 0 || parseInt(formData.nombre_enfants) > 20)) {
            newErrors.nombre_enfants = "Nombre d'enfants invalide (0-20)";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Fetch annees
    const fetchAnnees = async () => {
        try {
            const res = await axiosClient.get('/api/gestionEtat/years');
            const anneesData = res.data || [];
            
            const currentYearVal = new Date().getFullYear();
            const startYear = 2026;
            
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
                setSelectedAnnee(2026);
                setSelectedAnneeId(null);
            }
        } catch (err) {
            console.error(err);
            showNotification("Erreur chargement des années", "error");
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

    useEffect(() => {
        fetchAnnees();
    }, []);

    useEffect(() => {
        if (selectedAnnee) {
            fetchConfig(selectedAnnee);
            fetchEmployees();
        }
    }, [selectedAnnee]);

    const fetchEmployees = async (page = 1) => {
        if (!selectedAnneeId) return;
        setLoading(true);
        try {
            const res = await axiosClient.get(`/api/employees`, { 
                params: { ...filters, page, annee_id: selectedAnneeId } 
            });
            setEmployeesList(res.data.data || []);
            setPaginationData(res.data);
        } catch (err) { 
            console.error(err);
            showNotification("Erreur chargement des employés", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedAnneeId) {
            fetchEmployees(currentPage);
        }
    }, [filters, currentPage, selectedAnneeId]);

    const handleViewEmployee = (emp) => {
        const details = calculateSalaryDetails(emp);
        setSelectedEmployeeDetails({ ...emp, salaryDetails: details });
        setShowDetailsModal(true);
    };

    const handleEdit = (emp) => {
        if (!isYearEditable) {
            showNotification(`⚠️ L'année ${selectedAnnee} est passée. Vous ne pouvez plus modifier les employés.`, "warning");
            return;
        }
        setFormData(emp);
        setCurrentId(emp.id);
        setIsEdit(true);
        setErrors({});
        
        if (emp.role_id && configData?.roles) {
            const role = configData.roles.find(r => r.id === emp.role_id);
            if (role) {
                setSelectedRole(role);
                if (emp.grade_id) {
                    const grade = role.grades?.find(g => g.id === emp.grade_id);
                    if (grade) {
                        setSelectedGrade(grade);
                        if (emp.echelle_id) {
                            const echelle = grade.echelles?.find(e => e.id === emp.echelle_id);
                            setSelectedEchelle(echelle);
                        }
                    }
                }
            }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        if (!isYearEditable) {
            showNotification(`⚠️ L'année ${selectedAnnee} est passée. Vous ne pouvez plus supprimer des employés.`, "warning");
            return;
        }
        if (window.confirm("⚠️ Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            setLoading(true);
            try {
                await axiosClient.delete(`/api/employees/${id}`);
                fetchEmployees(currentPage);
                showNotification("✅ Employé supprimé avec succès", "success");
            } catch (err) { 
                console.error(err);
                showNotification("❌ Erreur lors de la suppression", "error");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleChange = (e) => {
        if (!isYearEditable) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleRoleChange = (roleId) => {
        if (!isYearEditable) return;
        const role = configData?.roles?.find(r => r.id === parseInt(roleId));
        setSelectedRole(role);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setFormData({
            ...formData,
            role_id: roleId,
            grade_id: '', grade: '',
            echelle_id: '', echelle: '',
            echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleGradeChange = (gradeId) => {
        if (!isYearEditable) return;
        const grade = selectedRole?.grades?.find(g => g.id === parseInt(gradeId));
        setSelectedGrade(grade);
        setSelectedEchelle(null);
        setFormData({
            ...formData,
            grade_id: gradeId,
            grade: grade?.name || '',
            echelle_id: '', echelle: '',
            echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleEchelleChange = (echelleId) => {
        if (!isYearEditable) return;
        const echelle = selectedGrade?.echelles?.find(e => e.id === parseInt(echelleId));
        setSelectedEchelle(echelle);
        setFormData({
            ...formData,
            echelle_id: echelleId,
            echelle: echelle?.level || '',
            echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleEchelonChange = (echelonId) => {
        if (!isYearEditable) return;
        const echelon = selectedEchelle?.echelons?.find(e => e.id === parseInt(echelonId));
        setFormData({
            ...formData,
            echelon_id: echelonId,
            echelon: echelon?.order || '',
            salaire: echelon?.salary || '',
            indice: echelon?.index_val || ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isYearEditable) {
            showNotification(`⚠️ L'année ${selectedAnnee} est passée. Vous ne pouvez plus ajouter/modifier des employés.`, "error");
            return;
        }
        
        if (!validateForm()) {
            showNotification("❌ Veuillez corriger les erreurs", "error");
            return;
        }
        
        if (!selectedAnneeId) {
            showNotification("❌ Aucune année sélectionnée", "error");
            return;
        }
        
        setLoading(true);
        try {
            const submitData = {
                prenom: formData.prenom,
                nom: formData.nom,
                email: formData.email,
                telephone: formData.telephone || null,
                date_naissance: formData.date_naissance || null,
                adresse: formData.adresse || null,
                situation_familiale: formData.situation_familiale || null,
                nombre_enfants: formData.nombre_enfants ? parseInt(formData.nombre_enfants) : 0,
                departement: formData.departement || null,
                date_embauche: formData.date_embauche || null,
                poste: selectedRole?.name || null,
                type_contrat: formData.type_contrat || null,
                annee_id: selectedAnneeId,
                role_id: formData.role_id ? parseInt(formData.role_id) : null,
                grade_id: formData.grade_id ? parseInt(formData.grade_id) : null,
                echelle_id: formData.echelle_id ? parseInt(formData.echelle_id) : null,
                echelon_id: formData.echelon_id ? parseInt(formData.echelon_id) : null,
                grade: formData.grade || null,
                echelle: formData.echelle || null,
                echelon: formData.echelon ? String(formData.echelon) : null,
                salaire: formData.salaire ? parseFloat(formData.salaire) : null,
                indice: formData.indice ? parseFloat(formData.indice) : null,
                statut: formData.statut || "ACTIF",
                cotisation_type: formData.cotisation_type || null,
                cotisation_id: formData.cotisation_id ? parseInt(formData.cotisation_id) : null,
                cotisation_rubrique_id: formData.cotisation_rubrique_id ? parseInt(formData.cotisation_rubrique_id) : null,
                cotisation_label: formData.cotisation_label || null,
                cotisation_taux: formData.cotisation_taux ? parseFloat(formData.cotisation_taux) : null
            };
            
            if (isEdit) {
                await axiosClient.put(`/api/employees/${currentId}`, submitData);
                showNotification("✅ Employé modifié avec succès", "success");
            } else {
                await axiosClient.post('/api/employees', submitData);
                showNotification("✅ Employé ajouté avec succès", "success");
            }
            
            resetForm();
            fetchEmployees(currentPage);
        } catch (error) {
            console.error("Error:", error.response?.data);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(key => {
                    showNotification(`❌ ${key}: ${errors[key][0]}`, "error");
                });
                setErrors(errors);
            } else {
                showNotification(error.response?.data?.message || "❌ Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            prenom: "", nom: "", email: "", telephone: "",
            date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
            departement: "", date_embauche: "",
            type_contrat: "", annee_id: "", role_id: "", grade_id: "", echelle_id: "", echelon_id: "",
            grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
            cotisation_type: "", cotisation_id: "", cotisation_rubrique_id: "", cotisation_label: "", cotisation_taux: ""
        });
        setSelectedRole(null);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setSelectedCotisation(null);
        setErrors({});
        setIsEdit(false);
        setCurrentId(null);
    };

    // Fetch cotisations
    const fetchCotisations = async () => {
        try {
            const res = await axiosClient.get('/api/get-cotisations', {
                params: { year: selectedAnnee }
            });
            setCotisationsList(res.data || []);
        } catch (err) {
            console.error(err);
            setCotisationsList([]);
        }
    };

    const handleCotisationChange = (cotisationId) => {
        if (!isYearEditable) {
            showNotification(`⚠️ L'année ${selectedAnnee} est passée. Vous ne pouvez plus modifier les données.`, "warning");
            return;
        }
        const cotisation = cotisationsList.find(c => c.id === parseInt(cotisationId));
        setSelectedCotisation(cotisation);
        setFormData({
            ...formData,
            cotisation_id: cotisationId,
            cotisation_type: '',
            cotisation_rubrique_id: '',
            cotisation_label: '',
            cotisation_taux: ''
        });
    };

    useEffect(() => {
        if (selectedAnnee) {
            fetchCotisations();
        }
    }, [selectedAnnee]);

    const handleExportPDF = async () => {
        if (employeesList.length === 0) {
            showNotification("⚠️ Aucun employé à exporter", "warning");
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
            showNotification("📄 PDF exporté avec succès", "success");
        } catch (error) {
            console.error(error);
            showNotification("❌ Erreur lors de l'export PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (yearValue, yearId) => {
        setSelectedAnnee(yearValue);
        setSelectedAnneeId(yearId);
        localStorage.setItem('employee_selected_year', yearValue);
        resetForm();
        showNotification(`📅 Année ${yearValue} sélectionnée`, "success");
    };

    const roles = configData?.roles || [];
    const grades = selectedRole?.grades || [];
    const echelles = selectedGrade?.echelles || [];
    const echelons = selectedEchelle?.echelons || [];

    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-white' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const inputClass = `p-2.5 rounded-lg border ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${!isYearEditable ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70' : ''}`;
    const inputErrorClass = `p-2.5 rounded-lg border-2 border-red-500 ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-red-500 text-sm`;

    // Modal détails employé
    const EmployeeDetailsModal = ({ employee, onClose }) => {
        const details = employee.salaryDetails;
        
        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`${cardClass} rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl`}>
                    <div className={`sticky top-0 ${cardClass} p-4 border-b dark:border-[#2A2A2A] flex justify-between items-center`}>
                        <h2 className={`text-xl font-bold ${textClass}`}>Détails de l'employé</h2>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525]">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-4">
                        {/* Informations personnelles */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Nom complet</p>
                                <p className={`text-lg font-semibold ${textClass}`}>{employee.prenom} {employee.nom}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Email</p>
                                <p className={`text-sm ${textClass}`}>{employee.email}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Téléphone</p>
                                <p className={`text-sm ${textClass}`}>{employee.telephone || '-'}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Statut</p>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                    employee.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 
                                    employee.statut === 'CONGÉ' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                }`}>
                                    {employee.statut}
                                </span>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Situation familiale</p>
                                <p className={`text-sm ${textClass}`}>{employee.situation_familiale || '-'}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Nombre d'enfants</p>
                                <p className={`text-sm ${textClass}`}>{employee.nombre_enfants || '0'}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Date de naissance</p>
                                <p className={`text-sm ${textClass}`}>{employee.date_naissance || '-'}</p>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${textMutedClass}`}>Date d'embauche</p>
                                <p className={`text-sm ${textClass}`}>{employee.date_embauche || '-'}</p>
                            </div>
                        </div>

                        {/* Classification */}
                        <div className="border-t pt-4 dark:border-[#2A2A2A]">
                            <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>📊 Classification</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={`text-xs font-medium ${textMutedClass}`}>Poste</p>
                                    <p className={`text-sm ${textClass}`}>{employee.poste || employee.grade || '-'}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-medium ${textMutedClass}`}>Grade</p>
                                    <p className={`text-sm ${textClass}`}>{employee.grade || '-'}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-medium ${textMutedClass}`}>Échelle</p>
                                    <p className={`text-sm ${textClass}`}>{employee.echelle || '-'}</p>
                                </div>
                                <div>
                                    <p className={`text-xs font-medium ${textMutedClass}`}>Échelon</p>
                                    <p className={`text-sm ${textClass}`}>{employee.echelon || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Détail des indemnités */}
                        <div className="border-t pt-4 dark:border-[#2A2A2A]">
                            <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>💰 Détail des indemnités</h3>
                            {details.appliedIndemnites.length > 0 ? (
                                <div className="space-y-2">
                                    {details.appliedIndemnites.map((ind, idx) => (
                                        <div key={idx} className="flex justify-between py-1 border-b dark:border-[#2A2A2A]">
                                            <span className="text-sm">{ind.libelle}</span>
                                            <span className="text-sm font-medium text-blue-600">
                                                {ind.type === 'Fixe' ? `${ind.montant.toLocaleString()} MAD` : `${ind.valeur}% (${ind.montant.toLocaleString()} MAD)`}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between pt-2 font-semibold">
                                        <span>Total indemnités</span>
                                        <span className="text-blue-600">{details.totalIndemnites.toLocaleString()} MAD</span>
                                    </div>
                                </div>
                            ) : (
                                <p className={`text-sm ${textMutedClass}`}>Aucune indemnité configurée</p>
                            )}
                        </div>

                        {/* Calcul du salaire */}
                        <div className="border-t pt-4 dark:border-[#2A2A2A]">
                            <h3 className={`text-sm font-semibold mb-3 ${textClass}`}>📈 Calcul du salaire</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1">
                                    <span className="text-sm">Salaire de base</span>
                                    <span className="text-sm font-medium text-emerald-600">{details.baseSalary.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-sm">Total indemnités</span>
                                    <span className="text-sm font-medium text-blue-600">{details.totalIndemnites.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between py-1 border-t dark:border-[#2A2A2A]">
                                    <span className="text-sm font-bold">Salaire brut</span>
                                    <span className="text-sm font-bold text-purple-600">{details.brutSalary.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-sm">CNSS ({((details.cnss / details.brutSalary) * 100).toFixed(1)}%)</span>
                                    <span className="text-sm text-red-600">- {details.cnss.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-sm">IR</span>
                                    <span className="text-sm text-red-600">- {details.ir.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-sm">RCAR (2%)</span>
                                    <span className="text-sm text-red-600">- {details.rcar.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between py-2 border-t dark:border-[#2A2A2A] bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 rounded-lg p-3 mt-2">
                                    <span className="text-sm font-bold">💵 Salaire net</span>
                                    <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{details.netSalary.toLocaleString()} MAD</span>
                                </div>
                            </div>
                        </div>

                        {/* Cotisations personnalisées */}
                        {(employee.cotisation_type || employee.cotisation_label) && (
                            <div className="border-t pt-4 dark:border-[#2A2A2A]">
                                <h3 className={`text-sm font-semibold mb-2 ${textClass}`}>🏦 Cotisations personnalisées</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {employee.cotisation_type && (
                                        <div>
                                            <p className={`text-xs ${textMutedClass}`}>Type</p>
                                            <p className={`text-sm ${textClass}`}>{employee.cotisation_type}</p>
                                        </div>
                                    )}
                                    {employee.cotisation_label && (
                                        <div>
                                            <p className={`text-xs ${textMutedClass}`}>Rubrique</p>
                                            <p className={`text-sm ${textClass}`}>{employee.cotisation_label}</p>
                                        </div>
                                    )}
                                    {employee.cotisation_taux && (
                                        <div>
                                            <p className={`text-xs ${textMutedClass}`}>Taux</p>
                                            <p className={`text-sm ${textClass}`}>{employee.cotisation_taux}%</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t dark:border-[#2A2A2A]">
                            <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">
                                Fermer
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={`min-h-screen p-4 transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className={`text-2xl font-bold ${textClass} flex items-center gap-2`}>
                            <Users size={24} className="text-indigo-500" />
                            Gestion des Employés
                        </h1>
                        <p className={`text-sm ${textMutedClass} mt-1`}>
                            Année: <strong className={textClass}>{selectedAnnee}</strong> • Total: {paginationData.total || 0} employés
                        </p>
                    </div>
                    <div className="flex gap-3 items-center">
                        <div className="relative" ref={yearRef}>
                            <button 
                                onClick={() => setIsYearOpen(!isYearOpen)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cardClass} ${textClass} cursor-pointer`}
                            >
                                <Calendar size={16} className={textMutedClass} />
                                <span>{selectedAnnee || 'Sélectionner'}</span>
                                <ChevronDown size={14} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && (
                                <div className={`absolute top-full right-0 mt-1 rounded-lg border ${cardClass} z-50 min-w-[160px] overflow-y-auto max-h-64 shadow-lg`}>
                                    {annees.map(y => (
                                        <div
                                            key={y.id}
                                            onClick={() => {
                                                handleYearChange(y.year, y.id);
                                                setIsYearOpen(false);
                                            }}
                                            className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm flex justify-between items-center ${selectedAnnee == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : textClass}`}
                                        >
                                            <span>{y.year}</span>
                                            {y.year < currentYear && (
                                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Lock size={10} /> Lecture
                                                </span>
                                            )}
                                            {y.year === currentYear && (
                                                <span className="text-xs text-green-500 flex items-center gap-1">
                                                    <Edit2 size={10} /> Modifiable
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {annees.length === 0 && (
                                        <div className={`px-3 py-2 text-sm ${textMutedClass} text-center`}>
                                            Aucune année disponible
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <button onClick={handleExportPDF}
                            disabled={loading || employeesList.length === 0}
                            className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 text-sm">
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                {/* Formulaire - Visible seulement pour l'année courante */}
                {showForm && (
                    <div className={`${cardClass} rounded-xl p-5 mb-6 border shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
                                {isEdit ? <Edit2 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                                {isEdit ? `Modifier l'employé - ${selectedAnnee}` : `Ajouter un employé - ${selectedAnnee}`}
                            </h2>
                            {isEdit && (
                                <button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <X size={14} /> Annuler
                                </button>
                            )}
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Infos personnelles */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Prénom *</label>
                                    <input name="prenom" required value={formData.prenom} onChange={handleChange} placeholder="Prénom"
                                        className={errors.prenom ? inputErrorClass : inputClass} />
                                    {errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nom *</label>
                                    <input name="nom" required value={formData.nom} onChange={handleChange} placeholder="Nom"
                                        className={errors.nom ? inputErrorClass : inputClass} />
                                    {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Email *</label>
                                    <input name="email" required type="email" value={formData.email} onChange={handleChange} placeholder="Email"
                                        className={errors.email ? inputErrorClass : inputClass} />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Téléphone</label>
                                    <input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Téléphone"
                                        className={errors.telephone ? inputErrorClass : inputClass} />
                                    {errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de naissance *</label>
                                    <input type="date" name="date_naissance" value={formData.date_naissance || ''} onChange={handleChange} 
                                        className={errors.date_naissance ? inputErrorClass : inputClass} required />
                                    {errors.date_naissance && <p className="text-red-500 text-xs mt-1">{errors.date_naissance}</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date d'embauche *</label>
                                    <input type="date" name="date_embauche" value={formData.date_embauche || ''} onChange={handleChange}
                                        className={errors.date_embauche ? inputErrorClass : inputClass} required />
                                    {errors.date_embauche && <p className="text-red-500 text-xs mt-1">{errors.date_embauche}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>👨‍👩‍👧 Situation familiale</label>
                                    <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} className={inputClass}>
                                        <option value="">Sélectionner</option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                        <option value="Divorcé(e)">Divorcé(e)</option>
                                        <option value="Veuf/Veuve">Veuf/Veuve</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>👶 Nombre d'enfants</label>
                                    <input type="number" name="nombre_enfants" value={formData.nombre_enfants} onChange={handleChange} 
                                        className={errors.nombre_enfants ? inputErrorClass : inputClass} min="0" max="20" step="1"
                                        placeholder="0" />
                                    {errors.nombre_enfants && <p className="text-red-500 text-xs mt-1">{errors.nombre_enfants}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Statut</label>
                                    <select name="statut" value={formData.statut} onChange={handleChange} className={inputClass}>
                                        <option value="ACTIF">Actif</option>
                                        <option value="CONGÉ">Congé</option>
                                        <option value="DÉPART">Départ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Type contrat</label>
                                    <select name="type_contrat" value={formData.type_contrat} onChange={handleChange} className={inputClass}>
                                        <option value="">Sélectionner</option>
                                        <option value="CDI">CDI</option>
                                        <option value="CDD">CDD</option>
                                        <option value="Stage">Stage</option>
                                        <option value="Freelance">Freelance</option>
                                    </select>
                                </div>
                            </div>

                            {/* Cotisations */}
                            <div className="border-t pt-4 mb-4 dark:border-[#2A2A2A]">
                                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textClass}`}>
                                    <Briefcase size={16} className="text-purple-500" />
                                    Cotisations
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>🏢 Organisme</label>
                                        <select value={formData.cotisation_id || ""} onChange={(e) => handleCotisationChange(e.target.value)} className={inputClass}>
                                            <option value="">-- Sélectionner un organisme --</option>
                                            {cotisationsList.map(org => (
                                                <option key={org.id} value={org.id}>{org.name} {org.is_favorite && '⭐'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {selectedCotisation && (
                                        <div>
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>📋 Rubriques</label>
                                            <select value={formData.cotisation_rubrique_id || ""} onChange={(e) => {
                                                const rubrique = selectedCotisation.rubriques?.find(r => r.id === parseInt(e.target.value));
                                                setFormData({
                                                    ...formData,
                                                    cotisation_rubrique_id: rubrique?.id,
                                                    cotisation_type: rubrique?.type,
                                                    cotisation_label: rubrique?.label,
                                                    cotisation_taux: rubrique?.taux
                                                });
                                            }} className={inputClass}>
                                                <option value="">-- Sélectionner une rubrique --</option>
                                                {selectedCotisation.rubriques?.map(rub => (
                                                    <option key={rub.id} value={rub.id}>{rub.label} - {rub.type} ({rub.taux}%)</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                {formData.cotisation_type && (
                                    <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium">📌 {formData.cotisation_type}</span>
                                            <span className="text-sm text-purple-600 dark:text-purple-400">Taux: {formData.cotisation_taux}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Classification salariale */}
                            <div className="border-t pt-4 mb-4 dark:border-[#2A2A2A]">
                                <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${textClass}`}>
                                    <Star size={16} className="text-yellow-500" />
                                    Classification salariale
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Poste *</label>
                                        <select value={formData.role_id || ""} onChange={(e) => handleRoleChange(e.target.value)} className={inputClass} required>
                                            <option value="">Sélectionner un poste</option>
                                            {roles.map(role => (
                                                <option key={role.id} value={role.id}>{role.name} {role.is_starred && '⭐'}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Grade *</label>
                                        <select value={formData.grade_id || ""} onChange={(e) => handleGradeChange(e.target.value)} className={inputClass} disabled={!selectedRole} required>
                                            <option value="">Sélectionner un grade</option>
                                            {grades.map(grade => <option key={grade.id} value={grade.id}>{grade.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Échelle *</label>
                                        <select value={formData.echelle_id || ""} onChange={(e) => handleEchelleChange(e.target.value)} className={inputClass} disabled={!selectedGrade} required>
                                            <option value="">Sélectionner une échelle</option>
                                            {echelles.map(echelle => <option key={echelle.id} value={echelle.id}>Échelle {echelle.level}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Échelon *</label>
                                        <select value={formData.echelon_id || ""} onChange={(e) => handleEchelonChange(e.target.value)} className={inputClass} disabled={!selectedEchelle} required>
                                            <option value="">Sélectionner un échelon</option>
                                            {echelons.map(echelon => (
                                                <option key={echelon.id} value={echelon.id}>Éch. {echelon.order} - {Number(echelon.salary).toLocaleString()} MAD</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {formData.salaire > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 rounded-lg">
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>💰 Salaire de base</label>
                                            <input type="text" name="salaire" value={formData.salaire ? Number(formData.salaire).toLocaleString() : '0'} readOnly
                                                className={`w-full p-2 rounded-lg border ${cardClass} ${textClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed font-bold`} />
                                        </div>
                                        <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-lg">
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>📊 Indice</label>
                                            <input type="text" name="indice" value={formData.indice || '0'} readOnly
                                                className={`w-full p-2 rounded-lg border ${cardClass} ${textClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button type="submit" disabled={loading}
                                className="cursor-pointer w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                                {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Enregistrer"}
                            </button>
                        </form>
                    </div>
                )}

                {/* Filtres + Tableau */}
                <div className={`${cardClass} rounded-xl border overflow-hidden shadow-lg`}>
                    {/* Filtres */}
                    <div className="p-4 border-b dark:border-[#2A2A2A] bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20">
                        <div className="flex gap-3 flex-wrap items-center">
                            <Filter size={16} className={textMutedClass} />
                            <span className={`text-xs font-medium ${textMutedClass}`}>Filtrer par:</span>
                            <select onChange={(e) => setFilters({ ...filters, statut: e.target.value })}
                                className={`cursor-pointer px-3 py-1.5 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`}>
                                <option value="Tous">🔄 Tous statuts</option>
                                <option value="ACTIF">🟢 Actif</option>
                                <option value="CONGÉ">🟡 Congé</option>
                                <option value="DÉPART">🔴 Départ</option>
                            </select>
                            <div className="flex-1 relative min-w-[200px]">
                                <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMutedClass}`} />
                                <input type="text" placeholder="Rechercher par nom, prénom ou email..." 
                                    className={`w-full pl-9 pr-3 py-1.5 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                            </div>
                            {(filters.statut !== "Tous" || filters.search) && (
                                <button onClick={() => setFilters({ statut: "Tous", search: "" })}
                                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
                                    <X size={12} /> Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={darkMode ? 'bg-[#252525]' : 'bg-gray-50'}>
                                <tr className={`text-left text-xs font-bold uppercase ${textMutedClass}`}>
                                    <th className="p-3">Employé</th>
                                    <th className="p-3">Poste</th>
                                    <th className="p-3">Grade</th>
                                    <th className="p-3">Échelle</th>
                                    <th className="p-3">Échelon</th>
                                    <th className="p-3">Salaire brut</th>
                                    <th className="p-3">Salaire net</th>
                                    <th className="p-3">Statut</th>
                                    <th className="p-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && employeesList.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className="p-8 text-center">
                                            <Loader size={24} className="animate-spin mx-auto text-indigo-500" />
                                            <p className={`mt-2 text-sm ${textMutedClass}`}>Chargement...</p>
                                        </td>
                                    </tr>
                                ) : employeesList.length === 0 ? (
                                    <tr>
                                        <td colSpan="9" className={`p-8 text-center ${textMutedClass}`}>
                                            <Users size={48} className="mx-auto mb-2 opacity-30" />
                                            Aucun employé pour {selectedAnnee}
                                        </td>
                                    </tr>
                                ) : (
                                    employeesList.map((emp) => {
                                        const details = calculateSalaryDetails(emp);
                                        return (
                                            <tr key={emp.id} className={`border-t ${darkMode ? 'border-[#2A2A2A]' : 'border-gray-100'} hover:bg-opacity-50 ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'} transition-colors`}>
                                                <td className="p-3">
                                                    <div className={`font-semibold ${textClass}`}>{emp.prenom} {emp.nom}</div>
                                                    <div className={`text-xs ${textMutedClass} flex items-center gap-1`}><Mail size={10}/> {emp.email}</div>
                                                    {emp.telephone && <div className={`text-xs ${textMutedClass} flex items-center gap-1 mt-0.5`}><Phone size={10}/> {emp.telephone}</div>}
                                                </td>
                                                <td className={`p-3 text-sm ${textClass}`}>
                                                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-700 dark:text-indigo-400 text-xs">
                                                        {emp.poste || '-'}
                                                    </span>
                                                </td>
                                                <td className={`p-3 text-sm ${textClass}`}>{emp.grade || '-'}</td>
                                                <td className={`p-3 text-sm ${textClass}`}>{emp.echelle || '-'}</td>
                                                <td className={`p-3 text-sm ${textClass}`}>{emp.echelon || '-'}</td>
                                                <td className={`p-3 font-bold text-purple-600 dark:text-purple-400 text-sm`}>
                                                    {Math.round(details.brutSalary).toLocaleString()} MAD
                                                </td>
                                                <td className={`p-3 font-bold text-emerald-600 dark:text-emerald-400 text-sm`}>
                                                    {Math.round(details.netSalary).toLocaleString()} MAD
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs flex items-center gap-1 w-fit ${
                                                        emp.statut === 'ACTIF' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                        emp.statut === 'CONGÉ' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            emp.statut === 'ACTIF' ? 'bg-green-500' :
                                                            emp.statut === 'CONGÉ' ? 'bg-yellow-500' : 'bg-red-500'
                                                        }`}></span>
                                                        {emp.statut || 'ACTIF'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleViewEmployee(emp)} 
                                                            className="p-1 text-blue-500 hover:text-blue-700 transition-colors" title="Voir détails">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleEdit(emp)} 
                                                            className={`p-1 transition-colors ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700'}`}
                                                            disabled={!isYearEditable} title="Modifier">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(emp.id)} 
                                                            className={`p-1 transition-colors ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                                            disabled={!isYearEditable} title="Supprimer">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    
                    {/* Pagination */}
                    {paginationData.last_page > 1 && (
                        <div className={`flex justify-between items-center p-3 border-t ${darkMode ? 'border-[#2A2A2A]' : 'border-gray-100'}`}>
                            <span className={`text-sm ${textMutedClass}`}>
                                {paginationData.from || 0} - {paginationData.to || 0} sur {paginationData.total || 0} employés
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1}
                                    className="px-3 py-1 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">← Précédent</button>
                                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm min-w-[40px] text-center">{currentPage}</span>
                                <button onClick={() => setCurrentPage(p => Math.min(p+1, paginationData.last_page))} disabled={currentPage===paginationData.last_page}
                                    className="px-3 py-1 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors">Suivant →</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal détails employé */}
            {showDetailsModal && selectedEmployeeDetails && (
                <EmployeeDetailsModal 
                    employee={selectedEmployeeDetails}
                    onClose={() => setShowDetailsModal(false)}
                />
            )}
        </div>
    );
}