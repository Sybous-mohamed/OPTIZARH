import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Trash2, Edit2, Search, Download, UserPlus, 
    Briefcase, Star, Loader, AlertCircle, 
    Calendar, Mail, Phone, Users, Filter, Plus, X, Lock, User,
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
    
    // Configurations globales
    const [assurancesConfig, setAssurancesConfig] = useState([]);
    const [creditsConfig, setCreditsConfig] = useState([]);
    const [sntlConfig, setSntlConfig] = useState([]);
    const [rcarTypesList, setRcarTypesList] = useState([]);
    
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

    // Form data (supprimé rcar_type_id)
    const [formData, setFormData] = useState({
        prenom: "", nom: "", email: "", telephone: "",
        date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
        departement: "", date_embauche: "",
        type_contrat: "", annee_id: "", role_id: "", grade_id: "", echelle_id: "", echelon_id: "",
        grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
        cotisation_id: ""
    });

    // ==================== RÈGLE ====================
    const currentYear = new Date().getFullYear();
    const isYearEditable = parseInt(selectedAnnee) === currentYear;
    const showForm = isYearEditable;

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
    
    // Fetch RCAR Types
    const fetchRcarTypes = async () => {
        if (!selectedAnnee) return;
        try {
            const res = await axiosClient.get(`/api/rcar/config/${selectedAnnee}`);
            const types = res.data?.rcar_types || [];
            setRcarTypesList(types);
        } catch (err) {
            console.error(err);
            setRcarTypesList([]);
        }
    };

    // ==================== CALCUL IR ====================
    const calculateIR = (salaireBrut, situationFamiliale, nombreEnfants) => {
        if (!irSettings.length) return 0;
        
        const sortedSettings = [...irSettings].sort((a, b) => a.min - b.min);
        
        // 1. IR Brut
        let irBrut = 0;
        let remaining = salaireBrut;
        
        for (let i = 0; i < sortedSettings.length; i++) {
            const tranche = sortedSettings[i];
            const min = tranche.min;
            const max = tranche.max === 0 ? Infinity : tranche.max;
            const taux = tranche.taux;
            
            if (remaining <= 0) break;
            
            let trancheMontant = Math.min(remaining, max - min);
            if (trancheMontant > 0) {
                irBrut += (trancheMontant * taux) / 100;
                remaining -= trancheMontant;
            }
        }
        
        // 2. Déductions
        let deductionTotale = 0;
        const trancheActuelle = sortedSettings.find(t => {
            const max = t.max === 0 ? Infinity : t.max;
            return salaireBrut >= t.min && salaireBrut <= max;
        });
        
        if (trancheActuelle) {
            // Déduction conjoint
            if (situationFamiliale === 'Marié(e)' && trancheActuelle.marie) {
                deductionTotale += trancheActuelle.marie;
            }
            
            // Déduction enfants (MAX 2 ENFANTS)
            if (nombreEnfants > 0 && trancheActuelle.enfant1) {
                deductionTotale += trancheActuelle.enfant1; // 1er enfant
                if (nombreEnfants >= 2 && trancheActuelle.enfant2) {
                    deductionTotale += trancheActuelle.enfant2; // 2ème enfant maximum
                }
                // Pas de déduction pour les enfants >= 3
            }
        }
        
        // 3. IR Net
        let irNet = irBrut - deductionTotale;
        if (irNet < 0) irNet = 0;
        
        return Math.round(irNet);
    };

    // ==================== CALCUL INDEMNITÉS ====================
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
            total += montant;
            appliedIndemnites.push({
                libelle: ind.libelle,
                type: ind.type,
                valeur: ind.valeur,
                montant: montant
            });
        });
        
        return { total, appliedIndemnites };
    };
    
    // ==================== CALCUL RCAR (AUTOMATIQUE - TOUS LES TYPES) ====================
    const calculateRCAR = (salaireBrut, rcarTypesList) => {
        if (!rcarTypesList || rcarTypesList.length === 0) {
            return { totalSalariale: 0, totalPatronale: 0, detailsSalariale: [], detailsPatronale: [] };
        }
        
        let totalSalariale = 0;
        let totalPatronale = 0;
        const detailsSalariale = [];
        const detailsPatronale = [];
        
        // Parcourir TOUS les types RCAR
        rcarTypesList.forEach(type => {
            if (!type.details || type.details.length === 0) return;
            
            type.details.forEach(detail => {
                const taux = detail.percentage || 0;
                const plafond = detail.plafond || 0;
                const typeDetail = detail.type || 'salariale';
                
                let baseCalcul = plafond > 0 ? Math.min(salaireBrut, plafond) : salaireBrut;
                const montant = (baseCalcul * taux) / 100;
                
                if (typeDetail === 'salariale') {
                    totalSalariale += montant;
                    detailsSalariale.push({
                        designation: detail.designation,
                        type: type.label,
                        taux: taux,
                        plafond: plafond,
                        baseCalcul: baseCalcul,
                        montant: montant
                    });
                } else {
                    totalPatronale += montant;
                    detailsPatronale.push({
                        designation: detail.designation,
                        type: type.label,
                        taux: taux,
                        plafond: plafond,
                        baseCalcul: baseCalcul,
                        montant: montant
                    });
                }
            });
        });
        
        return {
            totalSalariale: totalSalariale,
            totalPatronale: totalPatronale,
            detailsSalariale: detailsSalariale,
            detailsPatronale: detailsPatronale
        };
    };
    
    // ==================== CALCUL COTISATIONS ====================
    const calculateAllCotisations = (brutSalary, organismeId, cotisationsList) => {
        let totalCotisations = 0;
        const appliedCotisations = [];

        // Si pas de cotisationsList ou vide
        if (!cotisationsList || cotisationsList.length === 0) {
            return { total: 0, details: [] };
        }

        // Chercher l'organisme sélectionné
        let selectedOrganisme = null;
        if (organismeId) {
            selectedOrganisme = cotisationsList.find(c => c.id === parseInt(organismeId));
        }
        
        // Si l'organisme sélectionné n'existe pas mais qu'il y en a dans la liste, prendre le premier
        if (!selectedOrganisme && cotisationsList.length > 0) {
            selectedOrganisme = cotisationsList[0];
            // Optionnel: sauvegarder automatiquement cette cotisation pour l'employé
            // Mais on ne le fait pas ici pour ne pas modifier la base
        }
        
        if (!selectedOrganisme || !selectedOrganisme.rubriques || selectedOrganisme.rubriques.length === 0) {
            return { total: 0, details: [] };
        }
        
        selectedOrganisme.rubriques.forEach(rubrique => {
            const taux = rubrique.taux || 0;
            const plafond = rubrique.plafond || 0;
            let baseCalcul = brutSalary;

            if (plafond > 0) {
                baseCalcul = Math.min(brutSalary, plafond);
            }
            
            const montant = (baseCalcul * taux) / 100;
            totalCotisations += montant;
            
            appliedCotisations.push({
                name: rubrique.label,
                organisme: selectedOrganisme.name,
                taux: taux,
                plafond: plafond,
                baseCalcul: baseCalcul,
                montant: montant
            });
        });
        
        return { total: totalCotisations, details: appliedCotisations };
    };
    
    // ==================== CALCUL SALAIRE COMPLET ====================
    const calculateSalaryDetails = (employee, cotisationsList, rcarTypesList) => {
        const baseSalary = parseFloat(employee.salaire) || 0;
        
        const indemnitesResult = calculateIndemnitesForEmployee(
            baseSalary,
            employee.role_id,
            employee.grade_id,
            employee.echelle_id,
            employee.echelon_id
        );
        
        const brutSalary = baseSalary + indemnitesResult.total;
        
        // Cotisations
        const cotisationsResult = calculateAllCotisations(
            brutSalary, 
            employee.cotisation_id,
            cotisationsList
        );
        
        // RCAR - Calcul automatique (sans ID, tous les types)
        const rcarResult = calculateRCAR(brutSalary, rcarTypesList);
        
        // IR
        const ir = calculateIR(
            brutSalary, 
            employee.situation_familiale, 
            parseInt(employee.nombre_enfants) || 0
        );
        
        // Total déductions = Cotisations + IR + RCAR Part Salariale
        const totalDeductions = cotisationsResult.total + ir + rcarResult.totalSalariale;
        const netSalary = brutSalary - totalDeductions;
        
        return {
            baseSalary,
            totalIndemnites: indemnitesResult.total,
            appliedIndemnites: indemnitesResult.appliedIndemnites,
            brutSalary,
            cotisations: cotisationsResult,
            rcarSalariale: rcarResult.totalSalariale,
            rcarPatronale: rcarResult.totalPatronale,
            rcarDetailsSalariale: rcarResult.detailsSalariale,
            rcarDetailsPatronale: rcarResult.detailsPatronale,
            ir,
            totalDeductions,
            netSalary
        };
    };

    // ==================== FETCH DATA ====================
    
    useEffect(() => {
        if (selectedAnneeId) {
            fetchIndemnites();
        }
    }, [selectedAnneeId]);

    useEffect(() => {
        if (selectedAnnee) {
            fetchConfig(selectedAnnee);
            fetchIrSettings();
            fetchEmployees();
            fetchRcarTypes(); // Charger les types RCAR
        }
    }, [selectedAnnee]);

    useEffect(() => {
        const loadConfigs = async () => {
            if (!selectedAnnee) return;
            
            try {
                const [assurancesRes, creditsRes, sntlRes] = await Promise.all([
                    axiosClient.get(`/api/assurances/get-by-year/${selectedAnnee}`),
                    axiosClient.get(`/api/credits/active/${selectedAnnee}`),
                    axiosClient.get(`/api/sntl/configs/${selectedAnnee}`)
                ]);
                
                setAssurancesConfig(assurancesRes.data.assurances || []);
                setCreditsConfig(creditsRes.data || []);
                setSntlConfig(sntlRes.data || []);
                
            } catch (err) {
                console.error("Erreur chargement configurations:", err);
            }
        };
        
        loadConfigs();
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

    const employeesWithDetails = React.useMemo(() => {
        // Attendre que cotisationsList soit chargé
        if (!employeesList.length || !cotisationsList.length) return [];
        
        return employeesList.map(emp => {
            const details = calculateSalaryDetails(emp, cotisationsList, rcarTypesList);
            return { ...emp, details };
        });
    }, [employeesList, cotisationsList, rcarTypesList]);

    // View 
    const handleViewEmployee = (emp) => {
        setSelectedEmployeeDetails(emp);
        setShowDetailsModal(true);
    };
    
    // Edit 
    const handleEdit = (emp) => {
        if (!isYearEditable) {
            showNotification(` L'année ${selectedAnnee} est passée. Vous ne pouvez plus modifier les employés.`, "warning");
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
        
        if (emp.cotisation_id && cotisationsList.length) {
            setSelectedCotisation(cotisationsList.find(c => c.id === emp.cotisation_id));
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Delete
    const handleDelete = async (id) => {
        if (!isYearEditable) {
            showNotification(` L'année ${selectedAnnee} est passée. Vous ne pouvez plus supprimer des employés.`, "warning");
            return;
        }
        if (window.confirm(" Êtes-vous sûr de vouloir supprimer cet employé ?")) {
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

    // Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isYearEditable) {
            showNotification(` L'année ${selectedAnnee} est passée. Vous ne pouvez plus ajouter/modifier des employés.`, "error");
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
                cotisation_id: formData.cotisation_id ? parseInt(formData.cotisation_id) : null
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

    // Reset Form 
    const resetForm = () => {
        setFormData({
            prenom: "", nom: "", email: "", telephone: "",
            date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
            departement: "", date_embauche: "",
            type_contrat: "", annee_id: "", role_id: "", grade_id: "", echelle_id: "", echelon_id: "",
            grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
            cotisation_id: ""
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
            const res = await axiosClient.get('/api/cotisations', {
                params: { year: selectedAnnee }
            });
            setCotisationsList(res.data || []);
        } catch (err) {
            console.error(err);
            setCotisationsList([]);
        }
    };

    const handleCotisationChange = (cotisationId) => {
        if (!isYearEditable) return;
        const cotisation = cotisationsList.find(c => c.id === parseInt(cotisationId));
        setSelectedCotisation(cotisation);
        setFormData({
            ...formData,
            cotisation_id: cotisationId
        });
    };

    useEffect(() => {
        if (selectedAnnee) {
            fetchCotisations();
        }
    }, [selectedAnnee]);

    // Exporter PDF
    const handleExportPDF = async () => {
        if (employeesList.length === 0) {
            showNotification(" Aucun employé à exporter", "warning");
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
    
    // Years change 
    const handleYearChange = (yearValue, yearId) => {
        setSelectedAnnee(yearValue);
        setSelectedAnneeId(yearId);
        localStorage.setItem('employee_selected_year', yearValue);
        resetForm();
        showNotification(` Année ${yearValue} sélectionnée`, "success");
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
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';

    // Modal détails employé
    const EmployeeDetailsModal = ({ employee, onClose }) => {
        const details = employee.details;
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`${cardClass} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInUp`}>
                    
                    {/* Header */}
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
                        <button 
                            onClick={onClose} 
                            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-[#252525] transition-all cursor-pointer"
                        >
                            <X size={20} className={textMutedClass} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        
                        {/* Section: Informations personnelles */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                    <User size={14} className="text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className={`text-sm font-semibold ${textClass}`}>Informations personnelles</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-[#252525] rounded-xl p-4">
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Nom complet</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.prenom} {employee.nom}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Email</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.email}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Téléphone</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.telephone || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Statut</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        employee.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700' : 
                                        employee.statut === 'CONGÉ' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {employee.statut}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Situation familiale</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.situation_familiale || '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Enfants à charge</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.nombre_enfants || '0'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Date de naissance</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.date_naissance ? new Date(employee.date_naissance).toLocaleDateString('fr-FR') : '-'}</span>
                                </div>
                                <div className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                    <span className={`text-xs ${textMutedClass}`}>Date d'embauche</span>
                                    <span className={`text-sm font-medium ${textClass}`}>{employee.date_embauche ? new Date(employee.date_embauche).toLocaleDateString('fr-FR') : '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section: Classification */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                    <Briefcase size={14} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h3 className={`text-sm font-semibold ${textClass}`}>Classification</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#252525] rounded-xl p-4">
                                <div className="text-center">
                                    <p className={`text-[10px] ${textMutedClass}`}>Poste</p>
                                    <p className={`text-sm font-semibold ${textClass} mt-1`}>{employee.poste || employee.grade || '-'}</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] ${textMutedClass}`}>Grade</p>
                                    <p className={`text-sm font-semibold ${textClass} mt-1`}>{employee.grade || '-'}</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] ${textMutedClass}`}>Échelle</p>
                                    <p className={`text-sm font-semibold ${textClass} mt-1`}>{employee.echelle || '-'}</p>
                                </div>
                                <div className="text-center">
                                    <p className={`text-[10px] ${textMutedClass}`}>Échelon</p>
                                    <p className={`text-sm font-semibold ${textClass} mt-1`}>{employee.echelon || '-'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Section: Indemnités */}
                        {details.appliedIndemnites.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                        <TrendingUp size={14} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className={`text-sm font-semibold ${textClass}`}>Indemnités</h3>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-4 space-y-2">
                                    {details.appliedIndemnites.map((ind, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b last:border-0 dark:border-gray-700">
                                            <span className="text-sm">{ind.libelle}</span>
                                            <span className="text-sm font-semibold text-blue-600">
                                                {ind.type === 'Fixe' ? `${ind.montant.toLocaleString()} MAD` : `${ind.valeur}% (${ind.montant.toLocaleString()} MAD)`}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 mt-1 border-t dark:border-gray-700">
                                        <span className="text-sm font-semibold">Total indemnités</span>
                                        <span className="text-sm font-bold text-blue-600">{details.totalIndemnites.toLocaleString()} MAD</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section: Calcul du salaire */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                    <DollarSign size={14} className="text-purple-600 dark:text-purple-400" />
                                </div>
                                <h3 className={`text-sm font-semibold ${textClass}`}>Détail du salaire</h3>
                            </div>
                            
                            {/* Salaire brut */}
                            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Salaire de base</span>
                                    <span className="text-sm font-semibold text-emerald-600">{details.baseSalary.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm">Total indemnités</span>
                                    <span className="text-sm font-semibold text-blue-600">{details.totalIndemnites.toLocaleString()} MAD</span>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                                    <span className="text-base font-bold">Salaire brut</span>
                                    <span className="text-lg font-bold text-purple-600">{details.brutSalary.toLocaleString()} MAD</span>
                                </div>
                            </div>
                            
                            {/* Déductions */}
                            <div className="bg-gray-50 dark:bg-[#252525] rounded-xl p-4 space-y-3">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400">Déductions</h4>
                                
                                {/* Cotisations */}
                                {details.cotisations?.details?.length > 0 && (
                                    <div className="space-y-2">
                                        {details.cotisations.details.map((cot, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span className="text-sm">{cot.organisme} - {cot.name} ({cot.taux}%)</span>
                                                <span className="text-sm text-rose-600">- {cot.montant.toLocaleString()} MAD</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-1 border-t dark:border-gray-700">
                                            <span className="text-sm font-medium">Total cotisations</span>
                                            <span className="text-sm font-semibold text-rose-600">- {details.cotisations.total.toLocaleString()} MAD</span>
                                        </div>
                                    </div>
                                )}
                                
                                {/* IR */}
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">IR (Impôt sur le revenu)</span>
                                    <span className="text-sm text-rose-600">- {details.ir.toLocaleString()} MAD</span>
                                </div>
                                
                                {/* RCAR */}
                                {details.rcarSalariale > 0 && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">RCAR - Part salariale</span>
                                        <span className="text-sm text-rose-600">- {details.rcarSalariale.toLocaleString()} MAD</span>
                                    </div>
                                )}
                                
                                {/* Total déductions */}
                                <div className="flex justify-between items-center pt-2 mt-2 border-t dark:border-gray-700">
                                    <span className="text-sm font-bold">Total déductions</span>
                                    <span className="text-sm font-bold text-rose-600">- {details.totalDeductions.toLocaleString()} MAD</span>
                                </div>
                            </div>
                            
                            {/* Salaire Net */}
                            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-semibold">💵 Salaire net</span>
                                    <span className="text-2xl font-bold">{details.netSalary.toLocaleString()} MAD</span>
                                </div>
                            </div>
                            
                            {/* Part patronale (info) */}
                            {details.rcarPatronale > 0 && (
                                <div className="mt-3 p-3 rounded-xl bg-gray-100 dark:bg-[#252525] text-center">
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        ℹ️ Part patronale RCAR: {details.rcarPatronale.toLocaleString()} MAD (prise en charge par l'employeur)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Footer buttons */}
                        <div className="flex gap-3 pt-4 border-t ${borderClass}">
                            <button 
                                onClick={onClose} 
                                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer"
                            >
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
                            <button onClick={() => setIsYearOpen(!isYearOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cardClass} ${textClass} cursor-pointer`}>
                                <Calendar size={16} className={textMutedClass} />
                                <span>{selectedAnnee || 'Sélectionner'}</span>
                                <ChevronDown size={14} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && (
                                <div className={`absolute top-full right-0 mt-1 rounded-lg border ${cardClass} z-50 min-w-[160px] overflow-y-auto max-h-64 shadow-lg`}>
                                    {annees.map(y => (
                                        <div key={y.id} onClick={() => { handleYearChange(y.year, y.id); setIsYearOpen(false); }} className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm flex justify-between items-center ${selectedAnnee == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : textClass}`}>
                                            <span>{y.year}</span>
                                            {y.year < currentYear && (<span className="text-xs text-gray-400 flex items-center gap-1"><Lock size={10} /> Lecture</span>)}
                                            {y.year === currentYear && (<span className="text-xs text-green-500 flex items-center gap-1"><Edit2 size={10} /> Modifiable</span>)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button onClick={handleExportPDF} disabled={loading || employeesList.length === 0} className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20 text-sm">
                            <Download size={16} /> PDF
                        </button>
                    </div>
                </div>

                {/* Formulaire */}
                {showForm && (
                    <div className={`${cardClass} rounded-xl p-5 mb-6 border shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
                                {isEdit ? <Edit2 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                                {isEdit ? `Modifier l'employé - ${selectedAnnee}` : `Ajouter un employé - ${selectedAnnee}`}
                            </h2>
                            {isEdit && (<button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"><X size={14} /> Annuler</button>)}
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Information Personnelle */}
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                    <User size={16} className="text-emerald-500" />
                                    Information Personnelle
                                </h3>
                                <div className="h-px bg-gradient-to-r from-emerald-500 to-transparent mt-2"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Prénom *</label><input name="prenom" required value={formData.prenom} onChange={handleChange} placeholder="Prénom" className={errors.prenom ? inputErrorClass : inputClass} />{errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nom *</label><input name="nom" required value={formData.nom} onChange={handleChange} placeholder="Nom" className={errors.nom ? inputErrorClass : inputClass} />{errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Email *</label><input name="email" required type="email" value={formData.email} onChange={handleChange} placeholder="Email" className={errors.email ? inputErrorClass : inputClass} />{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Téléphone</label><input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Téléphone" className={errors.telephone ? inputErrorClass : inputClass} />{errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de naissance *</label><input type="date" name="date_naissance" value={formData.date_naissance || ''} onChange={handleChange} className={errors.date_naissance ? inputErrorClass : inputClass} required />{errors.date_naissance && <p className="text-red-500 text-xs mt-1">{errors.date_naissance}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date d'embauche *</label><input type="date" name="date_embauche" value={formData.date_embauche || ''} onChange={handleChange} className={errors.date_embauche ? inputErrorClass : inputClass} required />{errors.date_embauche && <p className="text-red-500 text-xs mt-1">{errors.date_embauche}</p>}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Situation familiale *</label>
                                    <select name="situation_familiale" value={formData.situation_familiale} onChange={(e) => { handleChange(e); if (e.target.value !== 'Marié(e)') setFormData(prev => ({ ...prev, nombre_enfants: '' })); }} className={inputClass}>
                                        <option value="">Sélectionner</option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nombre d'enfants</label>
                                    <input type="number" name="nombre_enfants" value={formData.nombre_enfants || ''} onChange={handleChange} className={errors.nombre_enfants ? inputErrorClass : inputClass} min="0" max="20" step="1" placeholder="0" disabled={formData.situation_familiale !== 'Marié(e)'}/>
                                    {errors.nombre_enfants && <p className="text-red-500 text-xs mt-1">{errors.nombre_enfants}</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Statut</label>
                                    <select name="statut" value={formData.statut} onChange={handleChange} className={inputClass}>
                                        <option value="ACTIF">Actif</option>
                                        <option value="CONGÉ">Congé</option>
                                        <option value="DÉPART">Départ</option>
                                    </select>
                                </div>
                            </div>

                            {/* Information Professionnelle */}
                            <div className="pt-4 mb-4">
                                <div className="mb-3">
                                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                                        <Briefcase size={16} className="text-indigo-500" />
                                        Information Professionnelle
                                    </h3>
                                    <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent mt-2"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Poste *</label><select value={formData.role_id || ""} onChange={(e) => handleRoleChange(e.target.value)} className={inputClass} required><option value="">Sélectionner un poste</option>{roles.map(role => (<option key={role.id} value={role.id}>{role.name} {role.is_starred && '⭐'}</option>))}</select></div>
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Grade *</label><select value={formData.grade_id || ""} onChange={(e) => handleGradeChange(e.target.value)} className={inputClass} disabled={!selectedRole} required><option value="">Sélectionner un grade</option>{grades.map(grade => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></div>
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Échelle *</label><select value={formData.echelle_id || ""} onChange={(e) => handleEchelleChange(e.target.value)} className={inputClass} disabled={!selectedGrade} required><option value="">Sélectionner une échelle</option>{echelles.map(echelle => <option key={echelle.id} value={echelle.id}>Échelle {echelle.level}</option>)}</select></div>
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Échelon *</label><select value={formData.echelon_id || ""} onChange={(e) => handleEchelonChange(e.target.value)} className={inputClass} disabled={!selectedEchelle} required><option value="">Sélectionner un échelon</option>{echelons.map(echelon => (<option key={echelon.id} value={echelon.id}>Éch. {echelon.order} - {Number(echelon.salary).toLocaleString()} MAD</option>))}</select></div>
                                </div>

                                {formData.salaire > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 rounded-lg">
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>💰 Salaire de base</label>
                                            <input type="text" name="salaire" value={formData.salaire ? Number(formData.salaire).toLocaleString() : '0'} readOnly className={`w-full p-2 rounded-lg border ${cardClass} ${textClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed font-bold`} />
                                        </div>
                                        <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-lg">
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>📊 Indice</label>
                                            <input type="text" name="indice" value={formData.indice || '0'} readOnly className={`w-full p-2 rounded-lg border ${cardClass} ${textClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} />
                                        </div>
                                    </div>
                                )}
                                
                                {/* Cotisations uniquement (plus de RCAR à sélectionner) */}
                                <div className="pt-4">
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>🏢 Organisme (Cotisation)</label>
                                        <select value={formData.cotisation_id || ""} onChange={(e) => handleCotisationChange(e.target.value)} className={inputClass}>
                                            <option value="">-- Sélectionner un organisme --</option>
                                            {cotisationsList.map(org => (<option key={org.id} value={org.id}>{org.name} {org.is_favorite && '⭐'}</option>))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="cursor-pointer w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                                {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {loading ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Enregistrer"}
                            </button>
                        </form>
                    </div>
                )}



                {/* Filtres + Tableau */}
                <div className={`${cardClass} rounded-xl border overflow-hidden shadow-sm`}>
                    {/* Filtres */}
                    <div className="p-4 border-b dark:border-gray-700">
                        <div className="flex gap-3 flex-wrap items-center">
                            <Filter size={16} className={textMutedClass} />
                            <span className={`text-xs font-medium ${textMutedClass}`}>Filtrer:</span>
                            
                            <select 
                                onChange={(e) => setFilters({ ...filters, statut: e.target.value })} 
                                className={`cursor-pointer px-3 py-1.5 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`}
                            >
                                <option value="Tous">Tous statuts</option>
                                <option value="ACTIF">Actif</option>
                                <option value="CONGÉ">Congé</option>
                                <option value="DÉPART">Départ</option>
                            </select>
                            
                            <div className="relative flex-1 min-w-[200px]">
                                <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMutedClass}`} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher..." 
                                    className={`w-full pl-9 pr-3 py-1.5 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`} 
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                                />
                            </div>
                            
                            {(filters.statut !== "Tous" || filters.search) && (
                                <button 
                                    onClick={() => setFilters({ statut: "Tous", search: "" })} 
                                    className="text-xs text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tableau */}
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={darkMode ? 'bg-[#252525]' : 'bg-gray-50'}>
                                <tr className={`text-left text-xs font-medium uppercase ${textMutedClass}`}>
                                    <th className="p-3">Employé</th>
                                    <th className="p-3">Poste</th>
                                    <th className="p-3">Grade</th>
                                    <th className="p-3">Échelle</th>
                                    <th className="p-3">Échelon</th>
                                    <th className="p-3">Brut</th>
                                    <th className="p-3">Net</th>
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
                                            Aucun employé
                                        </td>
                                    </tr>
                                ) : (
                                    employeesWithDetails.map((emp) => (
                                        <tr key={emp.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} hover:bg-gray-50 dark:hover:bg-[#252525] transition-colors`}>
                                            <td className="p-3">
                                                <div className={`font-medium ${textClass}`}>{emp.prenom} {emp.nom}</div>
                                                <div className={`text-xs ${textMutedClass}`}>{emp.email}</div>
                                            </td>
                                            <td className={`p-3 text-sm ${textClass}`}>{emp.poste || '-'}</td>
                                            <td className={`p-3 text-sm ${textClass}`}>{emp.grade || '-'}</td>
                                            <td className={`p-3 text-sm ${textClass}`}>{emp.echelle || '-'}</td>
                                            <td className={`p-3 text-sm ${textClass}`}>{emp.echelon || '-'}</td>
                                            <td className={`p-3 font-medium text-purple-600 dark:text-purple-400 text-sm`}>
                                                {Math.round(emp.details.brutSalary).toLocaleString()} MAD
                                            </td>
                                            <td className={`p-3 font-medium text-emerald-600 dark:text-emerald-400 text-sm`}>
                                                {Math.round(emp.details.netSalary).toLocaleString()} MAD
                                            </td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    emp.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700' :
                                                    emp.statut === 'CONGÉ' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {emp.statut || 'ACTIF'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button 
                                                        onClick={() => handleViewEmployee(emp)} 
                                                        className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer" 
                                                        title="Voir détails"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(emp)} 
                                                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                                                        disabled={!isYearEditable} 
                                                        title="Modifier"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(emp.id)} 
                                                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}
                                                        disabled={!isYearEditable} 
                                                        title="Supprimer"
                                                    >
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
                        <div className={`flex justify-between items-center p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <span className={`text-sm ${textMutedClass}`}>
                                {paginationData.from || 0} - {paginationData.to || 0} sur {paginationData.total || 0}
                            </span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(p-1,1))} 
                                    disabled={currentPage===1}
                                    className="px-3 py-1 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer"
                                >
                                    ←
                                </button>
                                <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm min-w-[40px] text-center">
                                    {currentPage}
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(p+1, paginationData.last_page))} 
                                    disabled={currentPage===paginationData.last_page}
                                    className="px-3 py-1 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer"
                                >
                                    →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal détails employé */}
            {showDetailsModal && selectedEmployeeDetails && (
                <EmployeeDetailsModal employee={selectedEmployeeDetails} onClose={() => setShowDetailsModal(false)} />
            )}
        </div>
    );
}