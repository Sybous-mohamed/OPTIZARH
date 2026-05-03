import React, { useState, useEffect, useRef } from 'react';
import { 
    Save, Trash2, Edit2, Search, Download, UserPlus, 
    Briefcase, Star, Loader, AlertCircle, 
    Calendar, Mail, Phone, Users, Filter, Plus, X, Lock, User,
    ChevronDown, Eye, EyeOff, TrendingUp, DollarSign, Percent, Shield,
    Menu, Grid3x3, List
} from 'lucide-react';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';
import axiosClient from "../../lib/apis/axiosConfig";
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';


export default function EmployeeManagement() {
    // ============================================================
    // HOOKS ET ÉTATS PRINCIPAUX
    // ============================================================
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
    // États pour la gestion des employés
    const [loading, setLoading] = useState(false);
    const [employeesList, setEmployeesList] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    
    // États pour les filtres et pagination
    const [filters, setFilters] = useState({ statut: "Tous", search: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState({});
    const [errors, setErrors] = useState({});
    
    // États pour l'affichage modale et vue
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    
    // États pour les configurations globales (API)
    const [assurancesConfig, setAssurancesConfig] = useState([]);
    const [creditsConfig, setCreditsConfig] = useState([]);
    const [sntlConfig, setSntlConfig] = useState([]);
    const [rcarTypesList, setRcarTypesList] = useState([]);
    
    // États pour la gestion des années
    const [annees, setAnnees] = useState([]);
    const [selectedAnnee, setSelectedAnnee] = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const yearRef = useRef(null);
    
    // États pour la classification (postes, grades, échelles, échelons)
    const [configData, setConfigData] = useState(null);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedEchelle, setSelectedEchelle] = useState(null);
    
    // États pour les cotisations
    const [cotisationsList, setCotisationsList] = useState([]);
    const [selectedCotisation, setSelectedCotisation] = useState(null);
    
    // États pour les indemnités et IR
    const [indemnitesList, setIndemnitesList] = useState([]);
    const [irSettings, setIrSettings] = useState([]);

    // Formulaire des données employé
    const [formData, setFormData] = useState({
        prenom: "", nom: "", email: "", telephone: "",
        date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
        departement: "", date_embauche: "",
        type_contrat: "", annee_id: "", role_id: "", grade_id: "", echelle_id: "", echelon_id: "",
        grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
        cotisation_id: ""
    });
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        employeeId: null,
        employeeName: ""
    });

    // ============================================================
    // RÈGLES MÉTIER
    // ============================================================
    const currentYear = new Date().getFullYear();
    const isYearEditable = parseInt(selectedAnnee) === currentYear; // Année modifiable uniquement si c'est l'année en cours
    const showForm = isYearEditable; // Afficher le formulaire uniquement si l'année est modifiable

    // ============================================================
    // CLASSES CSS POUR LE DARK MODE ET RESPONSIVE
    // ============================================================
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-white' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = `p-2.5 rounded-lg border ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm ${!isYearEditable ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-70' : ''}`;
    const inputErrorClass = `p-2.5 rounded-lg border-2 border-red-500 ${cardClass} ${textClass} outline-none focus:ring-2 focus:ring-red-500 text-sm`;

    // ============================================================
    // FONCTIONS API - RÉCUPÉRATION DES DONNÉES
    // ============================================================

    /**
     * Récupère les paramètres IR pour l'année sélectionnée
     */
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

    /**
     * Récupère la liste des indemnités pour l'année sélectionnée
     */
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
    
    /**
     * Récupère les types RCAR pour l'année sélectionnée
     */
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

    /**
     * Récupère la configuration (postes, grades, etc.) pour l'année
     */
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

    /**
     * Récupère la liste des années disponibles
     */
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
            showNotification("Erreur chargement des années", "error");
        }
    };

    /**
     * Récupère la liste des employés avec pagination et filtres
     */
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

    /**
     * Récupère la liste des cotisations pour l'année
     */
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

    // ============================================================
    // FONCTIONS DE CALCUL - SALAIRE ET CHARGES
    // ============================================================

    /**
     * Calcule l'Impôt sur le Revenu (IR)
     * @param {number} salaireBrut - Salaire brut
     * @param {string} situationFamiliale - Situation familiale (Célibataire/Marié(e))
     * @param {number} nombreEnfants - Nombre d'enfants à charge
     * @returns {number} - Montant de l'IR
     */
    const calculateIR = (salaireBrut, situationFamiliale, nombreEnfants) => {
        if (!irSettings.length) return 0;
        
        const sortedSettings = [...irSettings].sort((a, b) => a.min - b.min);
        
        let irBrut = 0;
        let remaining = salaireBrut;
        
        // Calcul de l'IR brut par tranches
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
        
        // Calcul des déductions
        let deductionTotale = 0;
        const trancheActuelle = sortedSettings.find(t => {
            const max = t.max === 0 ? Infinity : t.max;
            return salaireBrut >= t.min && salaireBrut <= max;
        });
        
        if (trancheActuelle) {
            // Déduction pour conjoint
            if (situationFamiliale === 'Marié(e)' && trancheActuelle.marie) {
                deductionTotale += trancheActuelle.marie;
            }
            // Déduction pour enfants (max 2 enfants)
            if (nombreEnfants > 0 && trancheActuelle.enfant1) {
                deductionTotale += trancheActuelle.enfant1;
                if (nombreEnfants >= 2 && trancheActuelle.enfant2) {
                    deductionTotale += trancheActuelle.enfant2;
                }
            }
        }
        
        let irNet = irBrut - deductionTotale;
        if (irNet < 0) irNet = 0;
        
        return Math.round(irNet);
    };

    /**
     * Calcule les indemnités applicables à un employé
     * @returns {Object} - Total des indemnités et détails
     */
    const calculateIndemnitesForEmployee = (salaireBase, roleId, gradeId, echelleId, echelonId) => {
        let total = 0;
        const appliedIndemnites = [];
        
        // Filtrer les indemnités applicables selon le ciblage
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
    
    /**
     * Calcule les cotisations RCAR (Retraite)
     * Parcourt TOUS les types RCAR (Salariale et Patronale)
     */
    const calculateRCAR = (salaireBrut, rcarTypesList) => {
        if (!rcarTypesList || rcarTypesList.length === 0) {
            return { totalSalariale: 0, totalPatronale: 0, detailsSalariale: [], detailsPatronale: [] };
        }
        
        let totalSalariale = 0;
        let totalPatronale = 0;
        const detailsSalariale = [];
        const detailsPatronale = [];
        
        // Parcourir tous les types RCAR
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
    
    /**
     * Calcule les cotisations sociales (CNSS, ONFAM, etc.)
     */
    const calculateAllCotisations = (brutSalary, organismeId, cotisationsList) => {
        let totalCotisations = 0;
        const appliedCotisations = [];

        if (!cotisationsList || cotisationsList.length === 0) {
            return { total: 0, details: [] };
        }

        // Trouver l'organisme sélectionné
        let selectedOrganisme = null;
        if (organismeId) {
            selectedOrganisme = cotisationsList.find(c => c.id === parseInt(organismeId));
        }
        
        if (!selectedOrganisme && cotisationsList.length > 0) {
            selectedOrganisme = cotisationsList[0];
        }
        
        if (!selectedOrganisme || !selectedOrganisme.rubriques || selectedOrganisme.rubriques.length === 0) {
            return { total: 0, details: [] };
        }
        
        // Calculer le montant pour chaque rubrique
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

    /**
     * Calcule les charges SNTL
     */
    const calculateSNTL = (salaireBrut, sntlConfigList, roleId, gradeId, echelleId, echelonId) => {
        if (!sntlConfigList || sntlConfigList.length === 0) {
            return { total: 0, details: [] };
        }
        
        let totalSNTL = 0;
        const appliedSNTL = [];
        
        // Filtrer les SNTL applicables
        const applicableSNTL = sntlConfigList.filter(sntl => {
            if (sntl.categorie_cible === 'tous') return true;
            if (sntl.role_id && sntl.role_id !== roleId) return false;
            if (sntl.grade_id && sntl.grade_id !== gradeId) return false;
            if (sntl.echelle_id && sntl.echelle_id !== echelleId) return false;
            if (sntl.echelon_id && sntl.echelon_id !== echelonId) return false;
            return true;
        });
        
        applicableSNTL.forEach(sntl => {
            let montant = 0;
            if (sntl.type_montant === 'fixe') {
                montant = parseFloat(sntl.valeur);
            } else {
                montant = (salaireBrut * parseFloat(sntl.valeur)) / 100;
            }
            totalSNTL += montant;
            appliedSNTL.push({
                label: sntl.label,
                type: sntl.type_montant,
                valeur: sntl.valeur,
                montant: montant
            });
        });
        
        return { total: totalSNTL, details: appliedSNTL };
    };

    /**
     * Calcule les assurances sociales
     */
    const calculateAssurancesSociales = (salaireBrut, assurancesConfigList) => {
        if (!assurancesConfigList || assurancesConfigList.length === 0) {
            return { total: 0, details: [] };
        }
        
        let totalAssurances = 0;
        const appliedAssurances = [];
        
        assurancesConfigList.forEach(assurance => {
            if (assurance.is_active) {
                let montant = 0;
                // Vérifier les tranches
                if (assurance.tranches && assurance.tranches.length > 0) {
                    for (const tranche of assurance.tranches) {
                        if (salaireBrut >= tranche.min_salaire) {
                            if (!tranche.max_salaire || salaireBrut <= tranche.max_salaire) {
                                montant = (salaireBrut * (tranche.taux_employeur || 0)) / 100;
                                break;
                            }
                        }
                    }
                } else {
                    montant = (salaireBrut * (assurance.taux_employeur || 0)) / 100;
                }
                totalAssurances += montant;
                appliedAssurances.push({
                    name: assurance.name,
                    code: assurance.code,
                    taux: assurance.taux_employeur,
                    montant: montant
                });
            }
        });
        
        return { total: totalAssurances, details: appliedAssurances };
    };

    /**
     * Calcule les crédits en cours
     */
    const calculateCredits = (salaireBrut, creditsConfigList) => {
        if (!creditsConfigList || creditsConfigList.length === 0) {
            return { total: 0, details: [] };
        }
        
        let totalCredits = 0;
        const appliedCredits = [];
        
        creditsConfigList.forEach(credit => {
            const montant = (salaireBrut * (credit.interest_rate || 0)) / 100;
            totalCredits += montant;
            
            appliedCredits.push({
                name: credit.name,
                type: credit.type?.name || 'Crédit',
                category: credit.category?.name || 'Général',
                interest_rate: credit.interest_rate,
                max_amount: credit.max_amount,
                max_duration: credit.max_duration,
                montant: montant
            });
        });
        
        return { total: totalCredits, details: appliedCredits };
    };
    
    /**
     * Calcule le salaire net complet d'un employé
     * @returns {Object} - Tous les détails du calcul (brut, net, déductions, etc.)
     */
    const calculateSalaryDetails = (employee, cotisationsList, rcarTypesList, sntlConfigList, assurancesConfigList, creditsConfigList) => {
        const baseSalary = parseFloat(employee.salaire) || 0;
        
        // 1. Calcul des indemnités
        const indemnitesResult = calculateIndemnitesForEmployee(
            baseSalary,
            employee.role_id,
            employee.grade_id,
            employee.echelle_id,
            employee.echelon_id
        );
        
        // 2. Salaire brut = base + indemnités
        const brutSalary = baseSalary + indemnitesResult.total;
        
        // 3. Cotisations sociales
        const cotisationsResult = calculateAllCotisations(
            brutSalary, 
            employee.cotisation_id,
            cotisationsList
        );
        
        // 4. RCAR (Retraite)
        const rcarResult = calculateRCAR(brutSalary, rcarTypesList);
        
        // 5. Impôt sur le revenu
        const ir = calculateIR(
            brutSalary, 
            employee.situation_familiale, 
            parseInt(employee.nombre_enfants) || 0
        );
        
        // 6. SNTL
        const sntlResult = calculateSNTL(
            brutSalary,
            sntlConfigList,
            employee.role_id,
            employee.grade_id,
            employee.echelle_id,
            employee.echelon_id
        );
        
        // 7. Assurances
        const assurancesResult = calculateAssurancesSociales(
            brutSalary,
            assurancesConfigList
        );
        
        // 8. Crédits
        const creditsResult = calculateCredits(
            brutSalary,
            creditsConfigList
        );
        
        // 9. Total des déductions
        const totalDeductions = cotisationsResult.total + ir + rcarResult.totalSalariale + sntlResult.total + assurancesResult.total + creditsResult.total;
        
        // 10. Salaire net
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
            sntl: sntlResult,
            assurances: assurancesResult,
            credits: creditsResult,
            ir,
            totalDeductions,
            netSalary
        };
    };

    // ============================================================
    // useEffect - CHARGEMENT DES DONNÉES
    // ============================================================
    
    // Charger les indemnités quand l'année change
    useEffect(() => {
        if (selectedAnneeId) {
            fetchIndemnites();
        }
    }, [selectedAnneeId]);

    // Charger la config, IR, employés et RCAR quand l'année change
    useEffect(() => {
        if (selectedAnnee) {
            fetchConfig(selectedAnnee);
            fetchIrSettings();
            fetchEmployees();
            fetchRcarTypes();
        }
    }, [selectedAnnee]);

    // Charger les configurations (assurances, crédits, SNTL)
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

    // Charger les cotisations
    useEffect(() => {
        if (selectedAnnee) {
            fetchCotisations();
        }
    }, [selectedAnnee]);

    // Charger les années au montage du composant
    useEffect(() => {
        fetchAnnees();
    }, []);

    // Recharger les employés quand les filtres ou la page changent
    useEffect(() => {
        if (selectedAnneeId) {
            fetchEmployees(currentPage);
        }
    }, [filters, currentPage, selectedAnneeId]);

    // Fermer le dropdown de l'année quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearRef.current && !yearRef.current.contains(event.target)) {
                setIsYearOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ============================================================
    // FONCTIONS MÉTIER - CRUD EMPLOYÉS
    // ============================================================

    /**
     * Valide le formulaire avant soumission
     */
    const validateForm = () => {
        const newErrors = {};
        
        // Champs obligatoires
        if (!formData.prenom?.trim()) newErrors.prenom = "Prénom requis";
        if (!formData.nom?.trim()) newErrors.nom = "Nom requis";
        
        // Email
        if (!formData.email?.trim()) {
            newErrors.email = "Email requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email invalide";
        }
        
        // Téléphone
        if (formData.telephone && !/^[0-9+\-\s]{8,15}$/.test(formData.telephone)) {
            newErrors.telephone = "Téléphone invalide";
        }
        
        // Date de naissance - Âge minimum 18 ans
        if (!formData.date_naissance) {
            newErrors.date_naissance = "Date de naissance requise";
        } else if (!verifierAge(formData.date_naissance)) {
            newErrors.date_naissance = "L'employé doit avoir au moins 18 ans";
        }
        
        // Date d'embauche - Doit être dans l'année sélectionnée
        if (!formData.date_embauche) {
            newErrors.date_embauche = "Date d'embauche requise";
        } else if (!verifierDateEmbauche(formData.date_embauche)) {
            newErrors.date_embauche = `La date d'embauche doit être dans l'année ${selectedAnnee}`;
        }
        
        // Nombre d'enfants
        if (formData.nombre_enfants && (parseInt(formData.nombre_enfants) < 0 || parseInt(formData.nombre_enfants) > 20)) {
            newErrors.nombre_enfants = "Nombre d'enfants invalide (0-20)";
        }
        
        // Poste (role) obligatoire
        if (!formData.role_id) {
            newErrors.role_id = "Veuillez sélectionner un poste";
        }
        
        // Grade obligatoire
        if (!formData.grade_id) {
            newErrors.grade_id = "Veuillez sélectionner un grade";
        }
        
        // Échelle obligatoire
        if (!formData.echelle_id) {
            newErrors.echelle_id = "Veuillez sélectionner une échelle";
        }
        
        // Échelon obligatoire
        if (!formData.echelon_id) {
            newErrors.echelon_id = "Veuillez sélectionner un échelon";
        }
        
        setErrors(newErrors);
        
        // S'il y a des erreurs, scroll vers la première et afficher notification
        if (Object.keys(newErrors).length > 0) {
            const firstErrorField = Object.keys(newErrors)[0];
            scrollToError(firstErrorField);
            showNotification(` ${newErrors[firstErrorField]}`, "error");
            return false;
        }
        
        return true;
    };

    /**
     * Calcule les détails de salaire pour chaque employé (memoized)
     */
    const employeesWithDetails = React.useMemo(() => {
        if (!employeesList.length || !cotisationsList.length) return [];
        
        return employeesList.map(emp => {
            const details = calculateSalaryDetails(emp, cotisationsList, rcarTypesList, sntlConfig, assurancesConfig, creditsConfig);
            return { ...emp, details };
        });
    }, [employeesList, cotisationsList, rcarTypesList, sntlConfig, assurancesConfig, creditsConfig]);

    /**
     * Affiche la modale des détails d'un employé
     */
    const handleViewEmployee = (emp) => {
        const details = calculateSalaryDetails(emp, cotisationsList, rcarTypesList, sntlConfig, assurancesConfig, creditsConfig);
        setSelectedEmployeeDetails({ ...emp, details });
        setShowDetailsModal(true);
    };
    
    /**
     * Prépare le formulaire pour la modification d'un employé
     */
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

    /**
     * Supprime un employé après confirmation
     */
    const handleDeleteClick = (id, name) => {
        if (!isYearEditable) {
            showNotification(` L'année ${selectedAnnee} est passée. Vous ne pouvez plus supprimer des employés.`, "warning");
            return;
        }
        setDeleteModal({
            isOpen: true,
            employeeId: id,
            employeeName: name
        });
    };

    const confirmDelete = async () => {
        setLoading(true);
        try {
            await axiosClient.delete(`/api/employees/${deleteModal.employeeId}`);
            fetchEmployees(currentPage);
            showNotification("Employé supprimé avec succès", "success");
            setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" });
        } catch (err) { 
            console.error(err);
            showNotification(" Erreur lors de la suppression", "error");
        } finally {
            setLoading(false);
        }
    };

    /**
     * Gère les changements dans le formulaire
     */
    const handleChange = (e) => {
        if (!isYearEditable) return;
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    /**
     * Change le poste (role) sélectionné
     */
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

    /**
     * Change le grade sélectionné
     */
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

    /**
     * Change l'échelle sélectionnée
     */
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

    /**
     * Change l'échelon sélectionné et met à jour salaire/indice
     */
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

    /**
     * Change l'organisme de cotisation
     */
    const handleCotisationChange = (cotisationId) => {
        if (!isYearEditable) return;
        const cotisation = cotisationsList.find(c => c.id === parseInt(cotisationId));
        setSelectedCotisation(cotisation);
        setFormData({
            ...formData,
            cotisation_id: cotisationId
        });
    };

    /**
     * Soumet le formulaire (création ou modification)
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isYearEditable) {
            showNotification(` L'année ${selectedAnnee} est passée. Vous ne pouvez plus ajouter/modifier des employés.`, "error");
            return;
        }
        
        if (!validateForm()) {
            showNotification(" Veuillez corriger les erreurs", "error");
            return;
        }
        
        if (!selectedAnneeId) {
            showNotification(" Aucune année sélectionnée", "error");
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
                showNotification("Employé modifié avec succès", "success");
            } else {
                await axiosClient.post('/api/employees', submitData);
                showNotification("Employé ajouté avec succès", "success");
            }
            
            resetForm();
            fetchEmployees(currentPage);
        } catch (error) {
            console.error("Error:", error.response?.data);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(key => {
                    showNotification(` ${key}: ${errors[key][0]}`, "error");
                });
                setErrors(errors);
            } else {
                showNotification(error.response?.data?.message || " Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * Réinitialise le formulaire
     */
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

    /**
     * Change l'année sélectionnée
     */
    const handleYearChange = (yearValue, yearId) => {
        setSelectedAnnee(yearValue);
        setSelectedAnneeId(yearId);
        localStorage.setItem('employee_selected_year', yearValue);
        resetForm();
        showNotification(` Année ${yearValue} sélectionnée`, "success");
    };

    /**
     * Exporte la liste des employés en PDF
     */
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
            showNotification(" Erreur lors de l'export PDF", "error");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================
    // FONCTIONS DE VALIDATION SPÉCIFIQUES
    // ============================================================

    /**
     * Vérifie que l'âge est supérieur à 18 ans
     * @param {string} dateNaissance - Date de naissance au format YYYY-MM-DD
     * @returns {boolean} - true si âge >= 18, false sinon
     */
    const verifierAge = (dateNaissance) => {
        if (!dateNaissance) return false;
        const aujourdhui = new Date();
        const dateNaiss = new Date(dateNaissance);
        let age = aujourdhui.getFullYear() - dateNaiss.getFullYear();
        const m = aujourdhui.getMonth() - dateNaiss.getMonth();
        if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaiss.getDate())) {
            age--;
        }
        return age >= 18;
    };

    /**
     * Vérifie que la date d'embauche est dans l'année sélectionnée
     * @param {string} dateEmbauche - Date d'embauche au format YYYY-MM-DD
     * @returns {boolean} - true si l'année correspond à selectedAnnee, false sinon
     */
    const verifierDateEmbauche = (dateEmbauche) => {
        if (!dateEmbauche || !selectedAnnee) return false;
        const anneeEmbauche = new Date(dateEmbauche).getFullYear();
        return anneeEmbauche === parseInt(selectedAnnee);
    };

    /**
     * Met en surbrillance le champ avec erreur et scroll vers celui-ci
     * @param {string} fieldName - Nom du champ en erreur
     */
    const scrollToError = (fieldName) => {
        const element = document.querySelector(`[name="${fieldName}"]`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('border-red-500', 'ring-2', 'ring-red-500');
            setTimeout(() => {
                element.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
            }, 3000);
        }
    };

    // Variables pour les selects
    const roles = configData?.roles || [];
    const grades = selectedRole?.grades || [];
    const echelles = selectedGrade?.echelles || [];
    const echelons = selectedEchelle?.echelons || [];

    // ============================================================
    // COMPOSANT MODALE DES DÉTAILS EMPLOYÉ
    // ============================================================
    const EmployeeDetailsModal = ({ employee, onClose }) => {
        const details = employee.details;
        return (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className={`${cardClass} rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInUp`}>
                    {/* En-tête de la modale */}
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
                        {/* Section Informations personnelles */}
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

                        {/* Section Classification */}
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

                        {/* Section Indemnités */}
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

                        {/* Section Calcul du salaire */}
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

                                {/* SNTL */}
                                {details.sntl && details.sntl.details.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">SNTL</h4>
                                        {details.sntl.details.map((sntlItem, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span className="text-sm">{sntlItem.label}</span>
                                                <span className="text-sm text-rose-600">- {sntlItem.montant.toLocaleString()} MAD</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-1 border-t dark:border-gray-700">
                                            <span className="text-sm font-medium">Total SNTL</span>
                                            <span className="text-sm font-semibold text-rose-600">- {details.sntl.total.toLocaleString()} MAD</span>
                                        </div>
                                    </div>
                                )}

                                {/* Assurances Sociales */}
                                {details.assurances && details.assurances.details.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Assurances Sociales</h4>
                                        {details.assurances.details.map((ass, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <span className="text-sm">{ass.name} ({ass.taux}%)</span>
                                                <span className="text-sm text-rose-600">- {ass.montant.toLocaleString()} MAD</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-1 border-t dark:border-gray-700">
                                            <span className="text-sm font-medium">Total Assurances</span>
                                            <span className="text-sm font-semibold text-rose-600">- {details.assurances.total.toLocaleString()} MAD</span>
                                        </div>
                                    </div>
                                )}

                                {/* Crédits */}
                                {details.credits && details.credits.details.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">🏦 Crédits en cours</h4>
                                        {details.credits.details.map((credit, idx) => (
                                            <div key={idx} className="flex justify-between items-center border-b pb-2 dark:border-gray-700">
                                                <div>
                                                    <p className="text-sm font-medium">{credit.name}</p>
                                                    <p className="text-xs text-gray-500">{credit.type} - {credit.category}</p>
                                                    <p className="text-xs text-gray-400">Taux: {credit.interest_rate}% | Durée: {credit.max_duration} mois</p>
                                                </div>
                                                <span className="text-sm font-semibold text-rose-600">- {credit.montant.toLocaleString()} MAD</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-2 mt-1 border-t dark:border-gray-700">
                                            <span className="text-sm font-semibold">Total Crédits</span>
                                            <span className="text-sm font-bold text-rose-600">- {details.credits.total.toLocaleString()} MAD</span>
                                        </div>
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
                            
                            {/* Part patronale RCAR */}
                            {details.rcarPatronale > 0 && (
                                <div className="mt-3 p-3 rounded-xl bg-gray-100 dark:bg-[#252525] text-center">
                                    <p className="text-xs text-green-600 dark:text-green-400">
                                        ℹ️ Part patronale RCAR: {details.rcarPatronale.toLocaleString()} MAD (prise en charge par l'employeur)
                                    </p>
                                </div>
                            )}
                        </div>
                       
                        {/* Bouton fermer */}
                        <div className="flex gap-3 pt-4 border-t ${borderClass}">
                            <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer">
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
        <div className={`min-h-screen   transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-7xl mx-auto">
                
                {/* En-tête responsive avec titre, sélecteur année et boutons d'action */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                        <h1 className={`text-xl md:text-2xl font-bold ${textClass} flex items-center gap-2`}>
                            <Users size={22} className="text-indigo-500" />
                            Gestion des Employés
                        </h1>
                        <p className={`text-xs ${textMutedClass} mt-0.5`}>
                            Année: <strong className={textClass}>{selectedAnnee}</strong> • Total: {paginationData.total || 0} employés
                        </p>
                    </div>
                    
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        {/* Boutons mobiles : filtres et changement de vue */}
                        <div className="flex gap-2 sm:hidden">
                            <button
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className={`p-2 rounded-lg border ${cardClass} ${textClass}`}
                            >
                                <Filter size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                                className={`p-2 rounded-lg border ${cardClass} ${textClass}`}
                            >
                                {viewMode === 'table' ? <Grid3x3 size={16} /> : <List size={16} />}
                            </button>
                        </div>
                        
                        {/* Sélecteur d'année */}
                        <div className="relative" ref={yearRef}>
                            <button onClick={() => setIsYearOpen(!isYearOpen)} 
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cardClass} ${textClass} cursor-pointer text-sm`}>
                                <Calendar size={14} className={textMutedClass} />
                                <span>{selectedAnnee || 'Sélectionner'}</span>
                                <ChevronDown size={12} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && (
                                <div className={`absolute top-full right-0 mt-1 rounded-lg border ${cardClass} z-50 min-w-[140px] overflow-y-auto max-h-64 shadow-lg`}>
                                    {annees.map(y => (
                                        <div key={y.id} onClick={() => { handleYearChange(y.year, y.id); setIsYearOpen(false); }} 
                                            className={`px-3 py-2 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm flex justify-between items-center ${selectedAnnee == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : textClass}`}>
                                            <span>{y.year}</span>
                                            {y.year < currentYear && (<span className="text-xs text-gray-400 flex items-center gap-1"><Lock size={10} /> Lecture</span>)}
                                            {y.year === currentYear && (<span className="text-xs text-green-500 flex items-center gap-1"><Edit2 size={10} /> Modifiable</span>)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Bouton export PDF */}
                        <button onClick={handleExportPDF} disabled={loading || employeesList.length === 0} 
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm">
                            <Download size={14} /> <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>

                {/* Filtres mobiles (affichage conditionnel) */}
                {showMobileFilters && (
                    <div className={`${cardClass} rounded-xl p-3 mb-4 sm:hidden`}>
                        <div className="flex flex-col gap-3">
                            <select 
                                onChange={(e) => setFilters({ ...filters, statut: e.target.value })} 
                                className={`cursor-pointer px-3 py-2 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`}
                            >
                                <option value="Tous">Tous statuts</option>
                                <option value="ACTIF">Actif</option>
                                <option value="CONGÉ">Congé</option>
                                <option value="DÉPART">Départ</option>
                            </select>
                            
                            <div className="relative">
                                <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMutedClass}`} />
                                <input 
                                    type="text" 
                                    placeholder="Rechercher..." 
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`} 
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
                                />
                            </div>
                            
                            {(filters.statut !== "Tous" || filters.search) && (
                                <button onClick={() => setFilters({ statut: "Tous", search: "" })} 
                                    className="text-xs text-red-500 hover:text-red-700 text-left">
                                    Reset
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Formulaire d'ajout/modification d'employé (affiché uniquement si année modifiable) */}
                {showForm && (
                    <div className={`${cardClass} rounded-xl p-4 mb-5 border shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
                                {isEdit ? <Edit2 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                                {isEdit ? `Modifier l'employé - ${selectedAnnee}` : `Ajouter un employé - ${selectedAnnee}`}
                            </h2>
                            {isEdit && (<button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"><X size={14} /> Annuler</button>)}
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Section Information Personnelle */}
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                    <User size={16} className="text-emerald-500" />
                                    Information Personnelle
                                </h3>
                                <div className="h-px bg-gradient-to-r from-emerald-500 to-transparent mt-2"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Prénom *</label><input name="prenom" required value={formData.prenom} onChange={handleChange} placeholder="Prénom" className={errors.prenom ? inputErrorClass : inputClass} />{errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nom *</label><input name="nom" required value={formData.nom} onChange={handleChange} placeholder="Nom" className={errors.nom ? inputErrorClass : inputClass} />{errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Email *</label><input name="email" required type="email" value={formData.email} onChange={handleChange} placeholder="Email" className={errors.email ? inputErrorClass : inputClass} />{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Téléphone</label><input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Téléphone" className={errors.telephone ? inputErrorClass : inputClass} />{errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}</div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de naissance *</label>
                                    <input 
                                        type="date" 
                                        name="date_naissance" 
                                        value={formData.date_naissance || ''} 
                                        onChange={handleChange} 
                                        className={`${errors.date_naissance ? inputErrorClass : inputClass} ${errors.date_naissance ? 'error' : ''}`} 
                                        required 
                                    />
                                    {errors.date_naissance && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <AlertCircle size={12} /> {errors.date_naissance}
                                        </p>
                                    )}
                                </div>
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

                            {/* Section Information Professionnelle */}
                            <div className="pt-4 mb-4">
                                <div className="mb-3">
                                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                                        <Briefcase size={16} className="text-indigo-500" />
                                        Information Professionnelle
                                    </h3>
                                    <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent mt-2"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                                
                                {/* Organisme de cotisation */}
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

                {/* Affichage des employés : Vue tableau ou vue grille */}
                {viewMode === 'table' ? (
                    // VUE TABLEAU (Desktop)
                    <div className={`${cardClass} rounded-xl border overflow-hidden shadow-sm`}>
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className={darkMode ? 'bg-[#252525]' : 'bg-gray-50'}>
                                    <tr className={`text-left text-xs font-medium uppercase ${textMutedClass}`}>
                                        <th className="p-3">Employé</th>
                                        <th className="p-3 hidden md:table-cell">Poste</th>
                                        <th className="p-3 hidden lg:table-cell">Grade</th>
                                        <th className="p-3 hidden xl:table-cell">Échelle</th>
                                        <th className="p-3 hidden xl:table-cell">Échelon</th>
                                        <th className="p-3">Brut</th>
                                        <th className="p-3 hidden sm:table-cell">Net</th>
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
                                                    <div className={`font-medium text-sm ${textClass}`}>{emp.prenom} {emp.nom}</div>
                                                    <div className={`text-xs ${textMutedClass} truncate max-w-[150px]`}>{emp.email}</div>
                                                </td>
                                                <td className={`p-3 text-sm ${textClass} hidden md:table-cell`}>{emp.poste || '-'}</td>
                                                <td className={`p-3 text-sm ${textClass} hidden lg:table-cell`}>{emp.grade || '-'}</td>
                                                <td className={`p-3 text-sm ${textClass} hidden xl:table-cell`}>{emp.echelle || '-'}</td>
                                                <td className={`p-3 text-sm ${textClass} hidden xl:table-cell`}>{emp.echelon || '-'}</td>
                                                <td className={`p-3 font-medium text-purple-600 dark:text-purple-400 text-sm whitespace-nowrap`}>
                                                    {Math.round(emp.details.brutSalary).toLocaleString()} MAD
                                                </td>
                                                <td className={`p-3 font-medium text-emerald-600 dark:text-emerald-400 text-sm whitespace-nowrap hidden sm:table-cell`}>
                                                    {Math.round(emp.details.netSalary).toLocaleString()} MAD
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                                                        emp.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700' :
                                                        emp.statut === 'CONGÉ' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                        {emp.statut || 'ACTIF'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button onClick={() => handleViewEmployee(emp)} 
                                                            className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer" title="Voir détails">
                                                            <Eye size={16} />
                                                        </button>
                                                        <button onClick={() => handleEdit(emp)} 
                                                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}
                                                            disabled={!isYearEditable} title="Modifier">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)}  
                                                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}
                                                            disabled={!isYearEditable} title="Supprimer">
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
                            <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 p-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                <span className={`text-sm ${textMutedClass} order-2 sm:order-1`}>
                                    {paginationData.from || 0} - {paginationData.to || 0} sur {paginationData.total || 0}
                                </span>
                                <div className="flex gap-2 order-1 sm:order-2">
                                    <button onClick={() => setCurrentPage(p => Math.max(p-1,1))} 
                                        disabled={currentPage===1}
                                        className="px-3 py-1 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer">
                                        ←
                                    </button>
                                    <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm min-w-[40px] text-center">
                                        {currentPage}
                                    </span>
                                    <button onClick={() => setCurrentPage(p => Math.min(p+1, paginationData.last_page))} 
                                        disabled={currentPage===paginationData.last_page}
                                        className="px-3 py-1 rounded-lg border disabled:opacity-50 text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all cursor-pointer">
                                        →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // VUE GRILLE (Mobile)
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {employeesWithDetails.map((emp) => (
                            <div key={emp.id} className={`${cardClass} rounded-xl border p-3 shadow-sm`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className={`font-semibold ${textClass}`}>{emp.prenom} {emp.nom}</h3>
                                        <p className={`text-xs ${textMutedClass}`}>{emp.email}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                        emp.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-700' :
                                        emp.statut === 'CONGÉ' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                    }`}>
                                        {emp.statut}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                    <div>
                                        <p className={textMutedClass}>Poste</p>
                                        <p className={textClass}>{emp.poste || '-'}</p>
                                    </div>
                                    <div>
                                        <p className={textMutedClass}>Grade</p>
                                        <p className={textClass}>{emp.grade || '-'}</p>
                                    </div>
                                    <div>
                                        <p className={textMutedClass}>Brut</p>
                                        <p className="text-purple-600 font-medium">{Math.round(emp.details.brutSalary).toLocaleString()} MAD</p>
                                    </div>
                                    <div>
                                        <p className={textMutedClass}>Net</p>
                                        <p className="text-emerald-600 font-medium">{Math.round(emp.details.netSalary).toLocaleString()} MAD</p>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t ${borderClass}">
                                    <button onClick={() => handleViewEmployee(emp)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all cursor-pointer">
                                        <Eye size={14} />
                                    </button>
                                    <button onClick={() => handleEdit(emp)} disabled={!isYearEditable} 
                                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
                                        <Edit2 size={14} />
                                    </button>
                                    <button  onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)}   disabled={!isYearEditable}
                                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modale des détails employé */}
            {showDetailsModal && selectedEmployeeDetails && (
                <EmployeeDetailsModal employee={selectedEmployeeDetails} onClose={() => setShowDetailsModal(false)} />
            )}
            <DeleteConfirmModal 
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" })}
                onConfirm={confirmDelete}
                title="Confirmation de suppression"
                message={`Êtes-vous sûr de vouloir supprimer l'employé "${deleteModal.employeeName}" ? Cette action est irréversible.`}
                darkMode={darkMode}
            />
        </div>
    );
}