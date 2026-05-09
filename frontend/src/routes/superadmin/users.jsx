import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================

export default function EmployeeManagement() {
    // ============================================================
    // HOOKS ET ETATS PRINCIPAUX
    // ============================================================
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
    const [viewMode, setViewMode] = useState('table');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    
    const [assurancesConfig, setAssurancesConfig] = useState([]);
    const [creditsConfig, setCreditsConfig] = useState([]);
    const [sntlConfig, setSntlConfig] = useState([]);
    const [rcarTypesList, setRcarTypesList] = useState([]);
    
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
    
    const [CreditList, setCreditList] = useState([]);
    const [selectedCredit, setSelectedCredit] = useState(null);
    
    const [indemnitesList, setIndemnitesList] = useState([]);
    const [irSettings, setIrSettings] = useState([]);

    const [retraiteSettings, setRetraiteSettings] = useState(null);
    const [isRcarDisabled, setIsRcarDisabled] = useState(false);
    const [ageMessage, setAgeMessage] = useState('');   
    
    const [employeeCredits, setEmployeeCredits] = useState([]);
    const [showCreditForm, setShowCreditForm] = useState(false);
    const [tempCredit, setTempCredit] = useState({
        credit_type_id: '',
        montant_credit: '',
        taux_credit: '',
        credit_duree: '',
        credit_date_debut: '',
        credit_date_fin: '',
        description: ''
    });

    const [formData, setFormData] = useState({
        prenom: "", nom: "", email: "", telephone: "",role:"",password:"",
        date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
        departement: "", date_embauche: "",
        type_contrat: "", annee_id: "", Post_id: "", grade_id: "", echelle_id: "", echelon_id: "",
        grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
        cotisation_id: ""
    });
    
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        employeeId: null,
        employeeName: ""
    });

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
    // FONCTIONS API
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
    if (selectedAnnee) {
        fetchRetraiteSettings();
    }
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
    if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaiss.getDate())) {
        age--;
    }
    
    const ageLegal = parseInt(retraiteSettings.age_legal) || 60;
    
    if (age >= ageLegal) {
        setIsRcarDisabled(true);
        setAgeMessage(`⚠️ L'employé a ${age} ans (≥ ${ageLegal} ans). RCAR désactivé car age de retraite atteint.`);
    } else {
        setIsRcarDisabled(false);
        setAgeMessage(`✓ Âge: ${age} ans (retraite à ${ageLegal} ans)`);
    }
};

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
            
            const employeesWithCredits = await Promise.all(
                (res.data.data || []).map(async (emp) => {
                    try {
                        const creditsRes = await axiosClient.get(`/api/employees/${emp.id}/credits`);
                        return { ...emp, credits: creditsRes.data };
                    } catch (err) {
                        return { ...emp, credits: [] };
                    }
                })
            );
            
            setEmployeesList(employeesWithCredits);
            setPaginationData({ ...res.data, data: employeesWithCredits });
        } catch (err) { 
            console.error(err);
            showNotification("Erreur chargement des employes", "error");
        } finally {
            setLoading(false);
        }
    }, [selectedAnneeId, filters, currentPage]);

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

    const fetchCredit = async () => {
        try {
            const res = await axiosClient.get('/api/credit-types', {
                params: { year: selectedAnnee }
            });
            setCreditList(res.data || []);
        } catch (err) {
            console.error("Erreur chargement credits:", err);
            setCreditList([]);
        }
    }

    // ============================================================
    // FONCTIONS DE CALCUL
    // ============================================================
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
      
    // const calculateAllCotisations = (brutSalary, organismeId, cotisationsList) => {
    //     let totalCotisations = 0;
    //     const appliedCotisations = [];

    //     if (!cotisationsList || cotisationsList.length === 0) {
    //         return { total: 0, details: [] };
    //     }

    //     let selectedOrganisme = null;
    //     if (organismeId) {
    //         selectedOrganisme = cotisationsList.find(c => c.id === parseInt(organismeId));
    //     }
        
    //     if (!selectedOrganisme && cotisationsList.length > 0) {
    //         selectedOrganisme = cotisationsList[0];
    //     }
        
    //     if (!selectedOrganisme || !selectedOrganisme.rubriques || selectedOrganisme.rubriques.length === 0) {
    //         return { total: 0, details: [] };
    //     }
        
    //     selectedOrganisme.rubriques.forEach(rubrique => {
    //         const taux = rubrique.taux || 0;
    //         const plafond = rubrique.plafond || 0;
    //         let baseCalcul = brutSalary;

    //         if (plafond > 0) {
    //             baseCalcul = Math.min(brutSalary, plafond);
    //         }
            
    //         const montant = (baseCalcul * taux) / 100;
    //         totalCotisations += montant;
            
    //         appliedCotisations.push({
    //             name: rubrique.label,
    //             organisme: selectedOrganisme.name,
    //             taux: taux,
    //             plafond: plafond,
    //             baseCalcul: baseCalcul,
    //             montant: montant
    //         });
    //     });
        
    //     return { total: totalCotisations, details: appliedCotisations };
    // };

    const calculateAllCotisations = (brutSalary, organismeId, cotisationsList) => {
            let totalCotisations = 0;
            const appliedCotisations = [];

            if (!cotisationsList || cotisationsList.length === 0) {
                return { total: 0, details: [] };
            }

            let selectedOrganisme = null;
            if (organismeId) {
                selectedOrganisme = cotisationsList.find(c => c.id === parseInt(organismeId));
            }
            
            if (!selectedOrganisme && cotisationsList.length > 0) {
                selectedOrganisme = cotisationsList[0];
            }
            
            if (!selectedOrganisme || !selectedOrganisme.rubriques) {
                return { total: 0, details: [] };
            }
            
            selectedOrganisme.rubriques.forEach(rubrique => {
                const taux = rubrique.taux || 0;
                const plafondMontant = rubrique.plafond || 0;
                let montantCalcule = (brutSalary * taux) / 100;

                let montantFinal = montantCalcule;
                if (plafondMontant > 0) {
                    montantFinal = Math.min(montantCalcule, plafondMontant);
                }

                totalCotisations += montantFinal;
                
                appliedCotisations.push({
                    name: rubrique.label,
                    organisme: selectedOrganisme.name,
                    taux: taux,
                    plafond: plafondMontant,
                    baseCalcul: brutSalary,
                    montant: montantFinal
                });
            });
            
            return { total: totalCotisations, details: appliedCotisations };
    };



    // const calculateIR = (salaireBrut, situationFamiliale, nombreEnfants) => {
    //     if (!irSettings.length) return 0;
        
    //     const sortedSettings = [...irSettings].sort((a, b) => a.min - b.min);
        
    //     let irBrut = 0;
    //     let remaining = salaireBrut;
        
    //     for (let i = 0; i < sortedSettings.length; i++) {
    //         const tranche = sortedSettings[i];
    //         const min = tranche.min;
    //         const max = tranche.max === 0 ? Infinity : tranche.max;
    //         const taux = tranche.taux;
            
    //         if (remaining <= 0) break;
            
    //         let trancheMontant = Math.min(remaining, max - min);
    //         if (trancheMontant > 0) {
    //             irBrut += (trancheMontant * taux) / 100;
    //             remaining -= trancheMontant;
    //         }
    //     }
        
    //     let deductionTotale = 0;
    //     const trancheActuelle = sortedSettings.find(t => {
    //         const max = t.max === 0 ? Infinity : t.max;
    //         return salaireBrut >= t.min && salaireBrut <= max;
    //     });
        
    //     if (trancheActuelle) {
    //         if (situationFamiliale === 'Marie(e)' && trancheActuelle.marie) {
    //             deductionTotale += trancheActuelle.marie;
    //         }
    //         if (nombreEnfants > 0 && trancheActuelle.enfant1) {
    //             deductionTotale += trancheActuelle.enfant1;
    //             if (nombreEnfants >= 2 && trancheActuelle.enfant2) {
    //                 deductionTotale += trancheActuelle.enfant2;
    //             }
    //         }
    //     }
        
    //     let irNet = irBrut - deductionTotale;
    //     if (irNet < 0) irNet = 0;
        
    //     return Math.round(irNet);
    // };

    const calculateIR = (salaireBrut, situationFamiliale, nombreEnfants) => {
        if (!irSettings || irSettings.length === 0) return { ir: 0, taux: 0 };

        const trancheActuelle = irSettings.find(t => {
            const min = parseFloat(t.min);
            const max = (t.max === 'Illimité' || t.max === 0 || !t.max) ? Infinity : parseFloat(t.max);
            return salaireBrut >= min && salaireBrut <= max;
        });

        if (!trancheActuelle) return { ir: 0, taux: 0 };

        const taux = parseFloat(trancheActuelle.taux);
        let irBrut = salaireBrut * (taux / 100);

        let deductionTotale = 0;

        if (situationFamiliale === 'Marie(e)') {
            deductionTotale += parseFloat(trancheActuelle.marie || 0);
        }
        const enfantsACharge = Math.min(nombreEnfants, 2);

        if (enfantsACharge >= 1) {
            deductionTotale += parseFloat(trancheActuelle.enfant1 || 0);
        }
        if (enfantsACharge >= 2) {
            deductionTotale += parseFloat(trancheActuelle.enfant2 || 0);
        }

        let irNet = irBrut - deductionTotale;
        return { 
            ir: Math.max(0, Math.round(irNet)), 
            taux: taux 
        };
    };

    const calculateSNTL = (salaireBrut, sntlConfigList, roleId, gradeId, echelleId, echelonId) => {
        if (!sntlConfigList || sntlConfigList.length === 0) {
            return { total: 0, details: [] };
        }
        
        let totalSNTL = 0;
        const appliedSNTL = [];
        
        const applicableSNTL = sntlConfigList.filter(sntl => {
            if (sntl.categorie_cible === 'tous') return true;
            if (sntl.categorie_cible === 'cadres') {
                if (sntl.role_id && sntl.role_id !== roleId) return false;
                if (sntl.grade_id && sntl.grade_id !== gradeId) return false;
                if (sntl.echelle_id && sntl.echelle_id !== echelleId) return false;
                if (sntl.echelon_id && sntl.echelon_id !== echelonId) return false;
                return true;
            }
            return false;
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
                id: sntl.id,
                label: sntl.label,
                type: sntl.type_montant,
                valeur: sntl.valeur,
                montant: montant,
                categorie_cible: sntl.categorie_cible
            });
        });
        
        return { total: totalSNTL, details: appliedSNTL };
    };

    const calculateRCAR = (salaireBrut, rcarTypesList) => {
        if (!rcarTypesList || rcarTypesList.length === 0) {
            return { 
                totalSalariale: 0, 
                totalPatronale: 0,
                totalAutres: 0,
                totalGeneral: 0,
                types: [],
                details: []
            };
        }
        
        let totalSalariale = 0;
        let totalPatronale = 0;
        let totalAutres = 0;
        const typesWithDetails = [];
        const allDetails = [];
        
        rcarTypesList.forEach(type => {
            if (!type.details || type.details.length === 0) return;
            
            let typeTotal = 0;
            const typeDetails = [];
            
            type.details.forEach(detail => {
                const taux = detail.percentage || 0;
                const plafond = detail.plafond || 0;
                const designation = detail.designation || type.label || 'RCAR';
                const typeDetail = detail.type || type.label?.toLowerCase() || 'autre';
                
                let baseCalcul = plafond > 0 ? Math.min(salaireBrut, plafond) : salaireBrut;
                const montant = (baseCalcul * taux) / 100;
                
                const detailObj = {
                    id: detail.id,
                    name: designation,
                    taux: taux,
                    plafond: plafond,
                    baseCalcul: baseCalcul,
                    montant: montant,
                    type: typeDetail
                };
                
                typeDetails.push(detailObj);
                typeTotal += montant;
                allDetails.push(detailObj);
                
                // Accumuler selon le type
                if (typeDetail === 'salariale' || type.label === 'Salariale' || type.label === 'Salariare') {
                    totalSalariale += montant;
                } else if (typeDetail === 'patronale' || type.label === 'Patronales') {
                    totalPatronale += montant;
                } else {
                    totalAutres += montant;
                }
            });
            
            typesWithDetails.push({
                id: type.id,
                name: type.label,
                total: typeTotal,
                details: typeDetails,
                nature: type.label === 'Salariale' || type.label === 'Salariare' ? 'salariale' 
                    : type.label === 'Patronales' ? 'patronale' : 'autre'
            });
        });
        
        return {
            totalSalariale: totalSalariale,
            totalPatronale: totalPatronale,
            totalAutres: totalAutres,
            totalGeneral: totalSalariale + totalPatronale + totalAutres,
            types: typesWithDetails,
            details: allDetails
        };
    };
  

   const calculateAssurancesSociales = (salaireBrut, assurancesConfigList) => {
        if (!assurancesConfigList || assurancesConfigList.length === 0) {
            return { totalEmployeur: 0, totalSalarie: 0, total: 0, details: [] };
        }
        
        let totalEmployeur = 0;
        let totalSalarie = 0;
        const appliedAssurances = [];
        
        assurancesConfigList.forEach(assurance => {
            if (assurance.is_active) {
                let montantEmployeur = 0;
                let montantSalarie = 0;
                let tauxEmployeur = 0;
                let tauxSalarie = 0;
                
                // ✅ Utiliser les taux directs (sans tranches)
                tauxEmployeur = parseFloat(assurance.taux_employeur) || 0;
                tauxSalarie = parseFloat(assurance.taux_salarie) || 0;
                
                // Calculer les montants
                montantEmployeur = (salaireBrut * tauxEmployeur) / 100;
                montantSalarie = (salaireBrut * tauxSalarie) / 100;
                
                // ✅ Vérifier le plafond si existe (appliqué au montant employeur)
                let plafondMensuel = assurance.plafond_mensuel ? parseFloat(assurance.plafond_mensuel) : null;
                if (plafondMensuel && montantEmployeur > plafondMensuel) {
                    // Appliquer le plafond proportionnellement si besoin
                    const ratio = plafondMensuel / montantEmployeur;
                    montantEmployeur = plafondMensuel;
                    montantSalarie = montantSalarie * ratio;
                }
                
                totalEmployeur += montantEmployeur;
                totalSalarie += montantSalarie;
                
                appliedAssurances.push({
                    id: assurance.id,
                    name: assurance.name,
                    code: assurance.code,
                    taux_employeur: tauxEmployeur,
                    taux_salarie: tauxSalarie,
                    montant_employeur: montantEmployeur,
                    montant_salarie: montantSalarie,
                    plafond: plafondMensuel
                });
            }
        });
        
        return { 
            totalEmployeur: totalEmployeur,
            totalSalarie: totalSalarie,
            total: totalEmployeur + totalSalarie,
            details: appliedAssurances 
        };
    };


    const calculerMensualiteCredit = (montant, tauxAnnuel, dureeMois) => {
        const montantVal = parseFloat(montant);
        const tauxVal = parseFloat(tauxAnnuel);
        const dureeVal = parseInt(dureeMois);
        
        if (isNaN(montantVal) || isNaN(tauxVal) || isNaN(dureeVal)) return 0;
        if (montantVal <= 0 || dureeVal <= 0) return 0;
        
        if (tauxVal === 0) {
            return Math.round(montantVal / dureeVal);
        }
        
        const tauxMensuel = (tauxVal / 100) / 12;
        const mensualite = montantVal * (tauxMensuel * Math.pow(1 + tauxMensuel, dureeVal)) / 
                          (Math.pow(1 + tauxMensuel, dureeVal) - 1);
        
        return Math.round(mensualite);
    };

    const calculateSalaryDetails = (employee, cotisationsList, rcarTypesList, sntlConfigList, assurancesConfigList, creditsConfigList) => {
        const baseSalary = parseFloat(employee.salaire) || 0;
        
        // 1. Indemnités
        const indemnitesResult = calculateIndemnitesForEmployee(
            baseSalary,
            employee.role_id,
            employee.grade_id,
            employee.echelle_id,
            employee.echelon_id
        );
        
        const brutSalary = baseSalary + indemnitesResult.total;
        
        // 2. Cotisations
        const cotisationsResult = calculateAllCotisations(
            brutSalary, 
            employee.cotisation_id,
            cotisationsList
        );
        
        const verifierAgePourRetraite = (dateNaissance) => {
            if (!dateNaissance) return 0;
            const aujourdhui = new Date();
            const dateNaiss = new Date(dateNaissance);
            let age = aujourdhui.getFullYear() - dateNaiss.getFullYear();
            const m = aujourdhui.getMonth() - dateNaiss.getMonth();
            if (m < 0 || (m === 0 && aujourdhui.getDate() < dateNaiss.getDate())) {
                age--;
            }
            return age;
        };
        
        const ageEmployee = verifierAgePourRetraite(employee.date_naissance);
        const ageRetraite = retraiteSettings?.age_legal || 60;
        
        let rcarResult = { totalSalariale: 0, totalPatronale: 0, totalAutres: 0, totalGeneral: 0, types: [], details: [] };
        
        if (ageEmployee < ageRetraite) {
            rcarResult = calculateRCAR(brutSalary, rcarTypesList);
        }
        
        // 4. IR
        const irResult = calculateIR(
            brutSalary, 
            employee.situation_familiale, 
            parseInt(employee.nombre_enfants) || 0
        );
        const ir = irResult.ir;
        const trancheIR = irResult.taux;
        
        // 5. SNTL
        const sntlResult = calculateSNTL(
            brutSalary,
            sntlConfigList,
            employee.role_id,
            employee.grade_id,
            employee.echelle_id,
            employee.echelon_id
        );
        
        // 6. ASSURANCES (avec distinction employeur/salarié)
        const assurancesResult = calculateAssurancesSociales(
            brutSalary,
            assurancesConfigList
        );
        
        // 7. CRÉDITS
        let creditsResult = { total: 0, details: [], nombre_credits: 0 };
        
        if (employee.credits && employee.credits.length > 0) {
            let totalMensualites = 0;
            const details = [];
            
            for (const credit of employee.credits) {
                if (credit.statut === 'ACTIF' && credit.montant_credit > 0) {
                    let mensualite = credit.credit_mensualite;
                    if (!mensualite && credit.taux_credit > 0 && credit.credit_duree > 0) {
                        const tauxMensuel = (credit.taux_credit / 100) / 12;
                        mensualite = credit.montant_credit * (tauxMensuel * Math.pow(1 + tauxMensuel, credit.credit_duree)) / 
                                    (Math.pow(1 + tauxMensuel, credit.credit_duree) - 1);
                    } else if (!mensualite) {
                        mensualite = credit.montant_credit / credit.credit_duree;
                    }
                    
                    totalMensualites += Math.round(mensualite);
                    details.push({
                        id: credit.id,
                        name: credit.credit_type?.name || 'Credit',
                        type: "Credit personnel",
                        category: credit.credit_type?.name || "Employe",
                        interest_rate: credit.taux_credit,
                        max_amount: credit.montant_credit,
                        max_duration: credit.credit_duree,
                        montant: Math.round(mensualite),
                        reste_a_payer: credit.credit_reste_a_payer,
                        date_debut: credit.credit_date_debut,
                        date_fin: credit.credit_date_fin,
                        mensualite: Math.round(mensualite)
                    });
                }
            }
            
            if (details.length > 0) {
                creditsResult = {
                    total: totalMensualites,
                    details: details,
                    nombre_credits: details.length
                };
            }
        }
        
        // 8. TOTAL DÉDUCTIONS (CE QUI SE DÉDUIT DU SALAIRE DU SALARIÉ)
        const totalDeductions = cotisationsResult.total + ir + 
                                (rcarResult.totalSalariale + rcarResult.totalPatronale + rcarResult.totalAutres) + 
                                sntlResult.total + 
                                assurancesResult.totalSalarie +  
                                creditsResult.total;
        
        // 9. SALAIRE NET
        const netSalary = brutSalary - totalDeductions;
        
        // 10. RETOUR
        return {
            // Salaire
            baseSalary,
            totalIndemnites: indemnitesResult.total,
            appliedIndemnites: indemnitesResult.appliedIndemnites,
            brutSalary,
            netSalary,
            
            // Cotisations
            cotisations: cotisationsResult,
            
            // RCAR
            rcar: rcarResult,
            rcarTotalSalariale: rcarResult.totalSalariale,
            rcarTotalPatronale: rcarResult.totalPatronale,
            rcarTotalAutres: rcarResult.totalAutres,
            rcarTypes: rcarResult.types,
            rcarDetails: rcarResult.details,
            
            // SNTL
            sntl: sntlResult,
            
            // ASSURANCES
            assurances: assurancesResult,              // Total (employeur + salarié)
            assurancesSalarie: assurancesResult.totalSalarie,  
            assurancesEmployeur: assurancesResult.totalEmployeur, 
            assurancesDetails: assurancesResult.details,
            
            // Crédits
            credits: creditsResult,
            
            // IR
            ir,
            trancheIR,
            
            // Totaux
            totalDeductions,
        };
    };


    // ============================================================
    // FONCTIONS POUR LES CREDITS DANS LE FORMULAIRE
    // ============================================================
    const addTempCredit = () => {
    
        if (!tempCredit.credit_type_id) {
            showNotification("Veuillez selectionner un type de credit", "warning");
            return;
        }
        if (!tempCredit.montant_credit || parseFloat(tempCredit.montant_credit) <= 0) {
            showNotification("Veuillez saisir un montant valide", "warning");
            return;
        }
        if (!tempCredit.taux_credit || parseFloat(tempCredit.taux_credit) < 0 || parseFloat(tempCredit.taux_credit) > 100) {
            showNotification("Veuillez saisir un taux valide (0-100%)", "warning");
            return;
        }
        if (!tempCredit.credit_duree || parseInt(tempCredit.credit_duree) <= 0) {
            showNotification("Veuillez saisir une duree valide", "warning");
            return;
        }
        
        const mensualite = calculerMensualiteCredit(
            tempCredit.montant_credit,
            tempCredit.taux_credit,
            tempCredit.credit_duree
        );
        
        const dateFin = tempCredit.credit_date_debut ? 
            calculerDateFin(tempCredit.credit_date_debut, tempCredit.credit_duree) : '';
        
        const newCredit = {
            credit_type_id: tempCredit.credit_type_id,
            montant_credit: tempCredit.montant_credit,
            taux_credit: tempCredit.taux_credit,
            credit_duree: tempCredit.credit_duree,
            credit_date_debut: tempCredit.credit_date_debut || null,
            credit_date_fin: dateFin,
            credit_mensualite: mensualite,
            credit_reste_a_payer: tempCredit.montant_credit,
            description: tempCredit.description || '',
            temp_id: Date.now()
        };
        
        console.log("💰 Crédit ajouté:", newCredit); 
        
        setEmployeeCredits([...employeeCredits, newCredit]);
        
        setTempCredit({
            credit_type_id: '',
            montant_credit: '',
            taux_credit: '',
            credit_duree: '',
            credit_date_debut: '',
            credit_date_fin: '',
            description: ''
        });
        setShowCreditForm(false);
        
        showNotification("Crédit ajouté à la liste", "success");
    };
    
    const removeTempCredit = (tempId) => {
        setEmployeeCredits(employeeCredits.filter(c => c.temp_id !== tempId));
    };
    
    const calculerDateFin = (dateDebut, dureeMois) => {
        if (!dateDebut || !dureeMois) return '';
        const debut = new Date(dateDebut);
        const fin = new Date(debut);
        fin.setMonth(fin.getMonth() + parseInt(dureeMois));
        return fin.toISOString().split('T')[0];
    };
    
    const calculerMensualite = () => {
        if (!tempCredit.montant_credit || !tempCredit.taux_credit || !tempCredit.credit_duree) {
            return 0;
        }
        return calculerMensualiteCredit(tempCredit.montant_credit, tempCredit.taux_credit, tempCredit.credit_duree);
    };

    // ============================================================
    // useEffect
    // ============================================================
    
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
            fetchRcarTypes();
            fetchCredit();
        }
    }, [selectedAnnee]);

    useEffect(() => {
        const loadConfigs = async () => {
            if (!selectedAnnee) return;
            
            try {
                const [assurancesRes, sntlRes] = await Promise.all([
                    axiosClient.get(`/api/assurances/get-by-year/${selectedAnnee}`),
                    axiosClient.get(`/api/sntl/configs/${selectedAnnee}`)
                ]);
                
                setAssurancesConfig(assurancesRes.data.assurances || []);
                setSntlConfig(sntlRes.data || []);
                
            } catch (err) {
                console.error("Erreur chargement configurations:", err);
            }
        };
        
        loadConfigs();
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
        if (selectedAnneeId) {
            fetchEmployees(currentPage);
        }
    }, [filters, currentPage, selectedAnneeId]);

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
    // FONCTIONS CRUD
    // ============================================================

    const employeesWithDetails = React.useMemo(() => {
        if (!employeesList.length || !cotisationsList.length) return [];
        
        return employeesList.map(emp => {
            const details = calculateSalaryDetails(emp, cotisationsList, rcarTypesList, sntlConfig, assurancesConfig, creditsConfig);
            return { ...emp, details };
        });
    }, [employeesList, cotisationsList, rcarTypesList, sntlConfig, assurancesConfig, creditsConfig]);



    const handleViewEmployee = (emp) => {
        const details = calculateSalaryDetails(emp, cotisationsList, rcarTypesList, sntlConfig, assurancesConfig, creditsConfig);
        setSelectedEmployeeDetails({ ...emp, details });
        setShowDetailsModal(true);
    };
    
    const handleEdit = (emp) => {
        if (!isYearEditable) {
            showNotification(`L'annee ${selectedAnnee} est passee. Vous ne pouvez plus modifier les employes.`, "warning");
            return;
        }
        setFormData(emp);
        setCurrentId(emp.id);
        setIsEdit(true);
        setErrors({});
        
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

    const handleDeleteClick = (id, name) => {
        if (!isYearEditable) {
            showNotification(`L'annee ${selectedAnnee} est passee. Vous ne pouvez plus supprimer des employes.`, "warning");
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
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
        if (name === 'date_naissance') {
            verifierAgeRetraite(value);
        }
    };

    const handlePostChange = (postId) => {
        if (!isYearEditable) return;
        const post = configData?.Post?.find(p => p.id === parseInt(postId));
        setSelectedPost(post);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setFormData({
            ...formData,
            Post_id: postId,
            grade_id: '', grade: '',
            echelle_id: '', echelle: '',
            echelon_id: '', echelon: '', salaire: '', indice: ''
        });
    };

    const handleGradeChange = (gradeId) => {
        if (!isYearEditable) return;
        const grade = selectedPost?.grades?.find(g => g.id === parseInt(gradeId));
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

    const handleCotisationChange = (cotisationId) => {
        if (!isYearEditable) return;
        const cotisation = cotisationsList.find(c => c.id === parseInt(cotisationId));
        setSelectedCotisation(cotisation);
        setFormData({ ...formData, cotisation_id: cotisationId });
    };
    
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.prenom?.trim()) newErrors.prenom = "Prenom requis";
        if (!formData.nom?.trim()) newErrors.nom = "Nom requis";
        
        if (!formData.email?.trim()) {
            newErrors.email = "Email requis";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Email invalide";
        }
        
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isYearEditable) {
            showNotification(`L'annee ${selectedAnnee} est passee. Vous ne pouvez plus ajouter/modifier des employes.`, "error");
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
            const submitData = {
                prenom: formData.prenom,
                nom: formData.nom,
                email: formData.email,
                password: formData.password,
                role: formData.role,
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
                grade: formData.grade || null,
                echelle: formData.echelle || null,
                echelon: formData.echelon ? String(formData.echelon) : null,
                salaire: formData.salaire ? parseFloat(formData.salaire) : null,
                indice: formData.indice ? parseFloat(formData.indice) : null,
                statut: formData.statut || "ACTIF",
                cotisation_id: formData.cotisation_id ? parseInt(formData.cotisation_id) : null
            };
            
            let employeeId;
            if (isEdit) {
                await axiosClient.put(`/api/employees/${currentId}`, submitData);
                employeeId = currentId;
                showNotification("Employe modifie avec succes", "success");
            } else {
                console.log("Données à soumettre:", submitData);
                const res = await axiosClient.post('/api/employees', submitData);
                employeeId = res.data.id;
                showNotification("Employe ajoute avec succes", "success");
            }
            
            if (employeeCredits.length > 0) {
                for (const credit of employeeCredits) {
                    await axiosClient.post(`/api/employees/${employeeId}/credits`, {
                        credit_type_id: credit.credit_type_id,
                        montant_credit: credit.montant_credit,
                        taux_credit: credit.taux_credit,
                        credit_duree: credit.credit_duree,
                        credit_date_debut: credit.credit_date_debut || null,
                        credit_date_fin: credit.credit_date_fin || null,
                        credit_mensualite: credit.credit_mensualite,
                        credit_reste_a_payer: credit.credit_reste_a_payer,
                    });
                }
                setEmployeeCredits([]);
            }
            
            resetForm();
            fetchEmployees(currentPage);
        } catch (error) {
            console.log("Les erreurs de validation:", error.response.data.errors);
            console.error("Error:", error.response?.data);
            if (error.response?.data?.errors) {
                const errors = error.response.data.errors;
                Object.keys(errors).forEach(key => {
                    showNotification(`${key}: ${errors[key][0]}`, "error");
                });
                setErrors(errors);
            } else {
                showNotification(error.response?.data?.message || "Erreur lors de l'enregistrement", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            prenom: "", nom: "", email: "", telephone: "",password: "",role: "",
            date_naissance: "", adresse: "", situation_familiale: "", nombre_enfants: "",
            departement: "", date_embauche: "",
            type_contrat: "", annee_id: "", role_id: "", grade_id: "", echelle_id: "", echelon_id: "",
            grade: "", echelle: "", echelon: "", salaire: "", indice: "", statut: "ACTIF",
            cotisation_id: ""
        });
        setEmployeeCredits([]);
        setShowCreditForm(false);
        setSelectedPost(null);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setSelectedCotisation(null);
        setErrors({});
        setIsEdit(false);
        setCurrentId(null);
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
            setTimeout(() => {
                element.classList.remove('border-red-500', 'ring-2', 'ring-red-500');
            }, 3000);
        }
    };



    const posts = configData?.Post || [];
    const grades = selectedPost?.grades || [];
    const echelles = selectedGrade?.echelles || [];
    const echelons = selectedEchelle?.echelons || [];

    const generatePassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let retVal = "";
        for (let i = 0; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        // Hna t9der t-updater state dyal l-formulaire direct
        setFormData({ ...formData, password: retVal });
    };

    // ============================================================
    // COMPOSANT MODALE DES DETAILS EMPLOYE
    // ============================================================
   // ============================================================
// EMPLOYEE DETAILS MODAL - AVEC TOUS LES DÉTAILS (STYLE FORMULAIRE)
// ============================================================
const EmployeeDetailsModal = ({ employee, onClose }) => {
    const details = employee.details;
    
    const formatMoney = (amount) => {
        return (amount || 0).toLocaleString() + ' MAD';
    };
    
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${cardClass} rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-fadeInUp`}>
                
                {/* HEADER */}
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
                    
                    {/* ===== SECTION 1: INFOS PERSONNELLES ===== */}
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
                        </div>
                    </div>
                    
                    {/* ===== SECTION 2: CLASSIFICATION ===== */}
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
                                <p className={`text-sm font-medium ${textClass} mt-1`}>{employee.poste || employee.grade || '-'}</p>
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
                    
                    {/* ===== SECTION 3: SALAIRE DE BASE + INDEMNITÉS ===== */}
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
                                <span className="text-sm font-medium">Salaire de base</span>
                                <span className="text-sm font-semibold text-emerald-600">{formatMoney(details.baseSalary)}</span>
                            </div>
                            
                            {details.appliedIndemnites.length > 0 && (
                                <div className="mt-3">
                                    <p className={`text-xs ${textMutedClass} mb-2`}>Indemnités appliquées :</p>
                                    {details.appliedIndemnites.map((ind, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-1">
                                            <div>
                                                <span className="text-sm">{ind.libelle}</span>
                                                <span className={`text-xs ml-2 ${textMutedClass}`}>
                                                    ({ind.type === 'Fixe' ? 'Fixe' : `${ind.valeur}%`})
                                                </span>
                                            </div>
                                            <span className="text-sm text-blue-600">{formatMoney(ind.montant)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                        <span className="text-sm font-semibold">Total indemnités</span>
                                        <span className="text-sm font-bold text-blue-600">{formatMoney(details.totalIndemnites)}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex justify-between items-center mt-3 pt-2 border-t ${borderClass}">
                                <span className="text-base font-bold">Salaire brut</span>
                                <span className="text-base font-bold text-purple-600">{formatMoney(details.brutSalary)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* ===== SECTION 4: DÉDUCTIONS ===== */}
                    <div>
                        <div className="mb-3">
                            <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                <div className="w-1 h-5 bg-rose-500 rounded-full"></div>
                                <Shield size={16} className="text-rose-500" /> Déductions
                            </h3>
                            <div className="h-px bg-gradient-to-r from-rose-500 to-transparent mt-2"></div>
                        </div>
                        
                        <div className="space-y-4">
                            
                            {/* Cotisations */}
                            {details.cotisations?.details?.length > 0 && (
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800">
                                            <Percent size={14} className="text-gray-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Cotisations sociales</h4>
                                    </div>
                                    {details.cotisations.details.map((cot, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-1.5 border-b ${borderClass} last:border-0">
                                            <div>
                                                <span className="text-sm">{cot.name}</span>
                                                <span className={`text-xs ml-2 ${textMutedClass}`}>({cot.taux}%)</span>
                                                {cot.organisme && <span className={`text-xs ml-2 ${textMutedClass}`}>- {cot.organisme}</span>}
                                            </div>
                                            <span className="text-sm text-rose-600">- {formatMoney(cot.montant)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                        <span className="text-sm font-semibold">Total cotisations</span>
                                        <span className="text-sm font-bold text-rose-600">- {formatMoney(details.cotisations.total)}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* IR */}
                            <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <span className="text-sm font-medium">IR (Impôt sur le revenu)</span>
                                        <p className={`text-xs ${textMutedClass} mt-0.5`}>
                                            Taux: {details.trancheIR || 0}%
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold text-rose-600">- {formatMoney(details.ir)}</span>
                                </div>
                            </div>
                            
                            {/* RCAR  */}
                            {details.rcarTypes?.length > 0 && (
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                                            <Shield size={14} className="text-orange-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">RCAR (Retraite) - Déduction totale</h4>
                                    </div>
                                    
                                    {/* Afficher TOUS les types - TOUS déduits */}
                                    {details.rcarTypes.map((type, typeIdx) => (
                                        <div key={typeIdx} className="mb-3 last:mb-0">
                                            {/* En-tête du type */}
                                            <div className="flex justify-between items-center py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800">
                                                <div>
                                                    <span className="text-sm font-medium">{type.name}</span>
                                                    <span className="text-xs ml-2 text-gray-500">
                                                        ({type.nature === 'salariale' ? 'Salariale' : type.nature === 'patronale' ? 'Patronale' : 'Autre'})
                                                    </span>
                                                </div>
                                                <span className="text-sm font-bold text-rose-600">
                                                    - {formatMoney(type.total)}
                                                </span>
                                            </div>
                                            
                                            {/* Détails du type */}
                                            <div className="mt-2 space-y-1.5 pl-2">
                                                {type.details.map((detail, detailIdx) => (
                                                    <div key={detailIdx} className="flex justify-between items-center">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="text-sm">{detail.name}</span>
                                                                <span className={`text-xs ${textMutedClass}`}>(Taux: {detail.taux}%)</span>
                                                                {detail.plafond > 0 && (
                                                                    <span className={`text-xs ${textMutedClass}`}>
                                                                        Plafond: {formatMoney(detail.plafond)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={`text-xs ${textMutedClass} mt-0.5`}>
                                                                Base: {formatMoney(detail.baseCalcul)}
                                                                {detail.baseCalcul < detail.plafond && detail.plafond > 0 && (
                                                                    <span className="ml-1">(salaire &lt; plafond)</span>
                                                                )}
                                                                {detail.baseCalcul === detail.plafond && detail.plafond > 0 && (
                                                                    <span className="ml-1">(plafond atteint)</span>
                                                                )}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-rose-600 whitespace-nowrap ml-3">
                                                            - {formatMoney(detail.montant)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {/* Total RCAR déduit */}
                                    <div className="mt-3 pt-3 border-t ${borderClass}">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-semibold">Total RCAR (déduit du salaire)</span>
                                            <span className="text-base font-bold text-rose-600">- {formatMoney(details.rcarTotalSalariale + details.rcarTotalPatronale + details.rcarTotalAutres)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* SNTL */}
                            {details.sntl?.details?.length > 0 && (
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                            <Shield size={14} className="text-amber-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">SNTL</h4>
                                    </div>
                                    {details.sntl.details.map((sntlItem, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-1.5 border-b ${borderClass} last:border-0">
                                            <div>
                                                <span className="text-sm">{sntlItem.label}</span>
                                                <span className={`text-xs ml-2 ${textMutedClass}`}>
                                                    ({sntlItem.type === 'fixe' ? `${sntlItem.valeur} MAD` : `${sntlItem.valeur}%`})
                                                </span>
                                                {sntlItem.categorie_cible === 'cadres' && (
                                                    <span className="text-xs ml-2 text-blue-500">(Ciblé)</span>
                                                )}
                                            </div>
                                            <span className="text-sm text-rose-600">- {formatMoney(sntlItem.montant)}</span>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t ${borderClass}">
                                        <span className="text-sm font-semibold">Total SNTL</span>
                                        <span className="text-sm font-bold text-rose-600">- {formatMoney(details.sntl.total)}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Assurances sociales */}
                            {details.assurancesDetails?.length > 0 && (
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                            <Shield size={14} className="text-blue-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Assurances sociales</h4>
                                    </div>
                                    {details.assurancesDetails.map((ass, idx) => (
                                        <div key={idx} className="flex justify-between items-center py-1.5 border-b last:border-0">
                                            <div>
                                                <span className="text-sm">{ass.name}</span>
                                                <span className={`text-xs ml-2 ${textMutedClass}`}>
                                                    (Taux total: {ass.taux_employeur + ass.taux_salarie}%)
                                                </span>
                                                {ass.plafond && (
                                                    <p className={`text-xs ${textMutedClass} mt-0.5`}>Plafond: {formatMoney(ass.plafond)}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                {ass.montant_salarie > 0 && (
                                                    <div className="text-rose-600 text-sm">- {formatMoney(ass.montant_salarie)}</div>
                                                )}
                                                {ass.montant_employeur > 0 && (
                                                    <div className="text-emerald-600 text-[10px]">+ {formatMoney(ass.montant_employeur)} (employeur)</div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center mt-2 pt-2 border-t">
                                        <span className="text-sm font-semibold">Total déduit</span>
                                        <span className="text-sm font-bold text-rose-600">- {formatMoney(details.assurancesSalarie)}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Crédits */}
                            {details.credits?.details?.length > 0 && (
                                <div className={`p-4 rounded-lg ${cardClass} border ${borderClass}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                            <DollarSign size={14} className="text-purple-600" />
                                        </div>
                                        <h4 className="text-sm font-semibold">Crédits en cours</h4>
                                    </div>
                                    {details.credits.details.map((credit, idx) => (
                                        <div key={idx} className="py-2 border-b ${borderClass} last:border-0">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <span className="text-sm font-medium">{credit.name}</span>
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                                        <span className={`text-xs ${textMutedClass}`}>Taux: {credit.interest_rate}%</span>
                                                        <span className={`text-xs ${textMutedClass}`}>Montant: {formatMoney(credit.max_amount)}</span>
                                                        <span className={`text-xs ${textMutedClass}`}>Durée: {credit.max_duration} mois</span>
                                                        {credit.date_debut && (
                                                            <span className={`text-xs ${textMutedClass}`}>
                                                                {new Date(credit.date_debut).toLocaleDateString('fr-FR')} → {credit.date_fin ? new Date(credit.date_fin).toLocaleDateString('fr-FR') : '-'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {credit.mensualite && (
                                                        <p className={`text-xs ${textMutedClass} mt-1`}>
                                                            Mensualité: <span className="font-semibold text-emerald-600">{formatMoney(credit.mensualite)}</span>
                                                        </p>
                                                    )}
                                                    {credit.reste_a_payer && (
                                                        <div className="mt-2">
                                                            <div className="flex justify-between text-xs mb-1">
                                                                <span className={textMutedClass}>Remboursement</span>
                                                                <span className={textClass}>{credit.pourcentage_rembourse || 0}%</span>
                                                            </div>
                                                            <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${credit.pourcentage_rembourse || 0}%`}} />
                                                            </div>
                                                            <p className={`text-xs ${textMutedClass} mt-1`}>
                                                                Reste à payer: {formatMoney(credit.reste_a_payer)}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="text-sm font-semibold text-rose-600 whitespace-nowrap ml-3">
                                                    - {formatMoney(credit.montant)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center mt-3 pt-2 border-t ${borderClass}">
                                        <div>
                                            <span className="text-sm font-semibold">Total mensualités crédits</span>
                                            <p className={`text-xs ${textMutedClass}`}>Déduit mensuellement</p>
                                        </div>
                                        <span className="text-base font-bold text-rose-600">- {formatMoney(details.credits.total)}</span>
                                    </div>
                                </div>
                            )}
                            
                            {/* Total général des déductions */}
                            <div className={`p-4 rounded-lg ${cardClass} border ${borderClass} bg-gray-50 dark:bg-gray-800`}>
                                <div className="flex justify-between items-center">
                                    <span className="text-base font-bold">Total des déductions</span>
                                    <span className="text-base font-bold text-rose-600">- {formatMoney(details.totalDeductions)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* ===== SECTION 5: SALAIRE NET ===== */}
                    <div>
                        <div className={`p-5 rounded-xl border-2 ${darkMode ? 'border-indigo-800 bg-indigo-950/20' : 'border-indigo-200 bg-indigo-50'}`}>
                            <div className="flex justify-between items-center">
                                <div>
                                    <span className={`text-lg font-bold ${textClass}`}>Salaire net à payer</span>
                                    <p className={`text-xs ${textMutedClass} mt-0.5`}>Après toutes déductions</p>
                                </div>
                                <span className={`text-2xl font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>{formatMoney(details.netSalary)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* ===== BOUTON FERMER ===== */}
                    <div className="flex gap-3 pt-4 border-t ${borderClass}">
                        <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer">
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
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                        <h1 className={`text-xl md:text-2xl font-bold ${textClass} flex items-center gap-2`}>
                            <Users size={22} className="text-indigo-500" /> Gestion des Employes
                        </h1>
                        <p className={`text-xs ${textMutedClass} mt-0.5`}>
                            Annee: <strong className={textClass}>{selectedAnnee}</strong> • Total: {paginationData.total || 0} employes
                        </p>
                    </div>
                    
                    <div className="flex gap-2 items-center w-full sm:w-auto">
                        {/* <div className="flex gap-2 sm:hidden">
                            <button onClick={() => setShowMobileFilters(!showMobileFilters)} className={`p-2 rounded-lg border ${cardClass} ${textClass}`}>
                                <Filter size={16} />
                            </button>
                            <button onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')} className={`p-2 rounded-lg border ${cardClass} ${textClass}`}>
                                {viewMode === 'table' ? <Grid3x3 size={16} /> : <List size={16} />}
                            </button>
                        </div>  */}
                        
                        <div className="relative" ref={yearRef}>
                            <button onClick={() => setIsYearOpen(!isYearOpen)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${cardClass} ${textClass} cursor-pointer text-sm`}>
                                <Calendar size={14} className={textMutedClass} />
                                <span>{selectedAnnee || 'Selectionner'}</span>
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
                        
                        <button onClick={handleExportPDF} disabled={loading || employeesList.length === 0} 
                            className="cursor-pointer flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 text-sm">
                            <Download size={14} /> <span className="hidden sm:inline">PDF</span>
                        </button>
                    </div>
                </div>

                {showMobileFilters && (
                    <div className={`${cardClass} rounded-xl p-3 mb-4 sm:hidden`}>
                        <div className="flex flex-col gap-3">
                            <select onChange={(e) => setFilters({ ...filters, statut: e.target.value })} 
                                className={`cursor-pointer px-3 py-2 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`}>
                                <option value="Tous">Tous statuts</option>
                                <option value="ACTIF">Actif</option>
                                <option value="CONGE">Conge</option>
                                <option value="DEPART">Depart</option>
                            </select>
                            
                            <div className="relative">
                                <Search size={14} className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${textMutedClass}`} />
                                <input type="text" placeholder="Rechercher..." 
                                    className={`w-full pl-9 pr-3 py-2 rounded-lg border ${cardClass} ${textClass} outline-none text-sm`} 
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                            </div>
                            
                            {(filters.statut !== "Tous" || filters.search) && (
                                <button onClick={() => setFilters({ statut: "Tous", search: "" })} 
                                    className="text-xs text-red-500 hover:text-red-700 text-left">Reset</button>
                            )}
                        </div>
                    </div>
                )}

                {showForm && (
                    <div className={`${cardClass} rounded-xl p-4 mb-5 border shadow-sm`}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className={`text-lg font-bold ${textClass} flex items-center gap-2`}>
                                {isEdit ? <Edit2 size={18} className="text-indigo-500" /> : <Plus size={18} className="text-indigo-500" />}
                                {isEdit ? `Modifier l'employe - ${selectedAnnee}` : `Ajouter un employe - ${selectedAnnee}`}
                            </h2>
                            {isEdit && (<button onClick={resetForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"><X size={14} /> Annuler</button>)}
                        </div>
                        
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                    <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
                                    <User size={16} className="text-emerald-500" /> Information Personnelle
                                </h3>
                                <div className="h-px bg-gradient-to-r from-emerald-500 to-transparent mt-2"></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Prenom</label><input name="prenom" required value={formData.prenom} onChange={handleChange} placeholder="Prenom" className={errors.prenom ? inputErrorClass : inputClass} />{errors.prenom && <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nom</label><input name="nom" required value={formData.nom} onChange={handleChange} placeholder="Nom" className={errors.nom ? inputErrorClass : inputClass} />{errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Email</label><input name="email" required type="email" value={formData.email} onChange={handleChange} placeholder="Email" className={errors.email ? inputErrorClass : inputClass} />{errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}</div>
                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Telephone</label><input name="telephone" value={formData.telephone} onChange={handleChange} placeholder="Telephone" className={errors.telephone ? inputErrorClass : inputClass} />{errors.telephone && <p className="text-red-500 text-xs mt-1">{errors.telephone}</p>}</div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de naissance</label>
                                    <input type="date" name="date_naissance" value={formData.date_naissance || ''} onChange={handleChange} className={`${errors.date_naissance ? inputErrorClass : inputClass}`} required />
                                    {errors.date_naissance && (<p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.date_naissance}</p>)}
                                    {/* Message d'âge pour RCAR */}
                                    {ageMessage && (
                                                <p className={`text-sm ${isRcarDisabled ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                                                    {ageMessage}
                                                </p>
                                    )}
                                </div>

                                <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date d'embauche</label><input type="date" name="date_embauche" value={formData.date_embauche || ''} onChange={handleChange} className={errors.date_embauche ? inputErrorClass : inputClass} required />{errors.date_embauche && <p className="text-red-500 text-xs mt-1">{errors.date_embauche}</p>}</div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Situation familiale</label>
                                    <select name="situation_familiale" value={formData.situation_familiale} onChange={(e) => { handleChange(e); if (e.target.value !== 'Marie(e)') setFormData(prev => ({ ...prev, nombre_enfants: '' })); }} className={inputClass}>
                                        <option value="">Selectionner</option>
                                        <option value="Celibataire">Celibataire</option>
                                        <option value="Marie(e)">Marie(e)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Nombre d'enfants</label>
                                    <input type="number" name="nombre_enfants" value={formData.nombre_enfants || ''} onChange={handleChange} className={errors.nombre_enfants ? inputErrorClass : inputClass} min="0" max="20" step="1" placeholder="0" disabled={formData.situation_familiale !== 'Marie(e)'}/>
                                    {errors.nombre_enfants && <p className="text-red-500 text-xs mt-1">{errors.nombre_enfants}</p>}
                                </div>
                                <div>
                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Statut</label>
                                    <select name="statut" value={formData.statut} onChange={handleChange} className={inputClass}>
                                        <option value="ACTIF">Actif</option>
                                        <option value="CONGE">Conge</option>
                                        <option value="DEPART">Depart</option>
                                    </select>
                                </div>
                            </div>

                            {/* ===== SECTION ACCÈS & SÉCURITÉ ===== */}
                            <div className="mt-6">
                            <div className="mb-3">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
                            Sécurité & Accès
                                </h3>
                                <div className="h-px bg-gradient-to-r from-blue-500 to-transparent mt-2"></div>
                            </div>

                            <div className={`p-5 rounded-xl ${cardClass} border ${borderClass} space-y-4`}>
                                
                                {/* Choix du Rôle (Select) */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center border-b pb-4 border-dashed border-gray-200 dark:border-gray-700">
                                <label className={`text-sm font-medium ${textClass}`}>Rôle Système</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                                    className={`w-full p-2 rounded-lg border bg-transparent ${borderClass} ${textClass} focus:ring-2 focus:ring-blue-500/20`}
                                >
                                    <option value="">Selectionner un rôle</option>
                                    <option value="employee">Employé</option>
                                    <option value="rh">RH</option>
                                    <option value="admin">Admin</option>
                                </select>
                                </div>

                                {/* Email & Password Generation */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs mb-1 ${textMutedClass}`}>Adresse Email Pro</label>
                                    <input 
                                    type="email" 
                                    placeholder="ex: a.alami@company.com"
                                    value={formData.email}
                                    className={`w-full p-2.5 rounded-lg border bg-transparent ${borderClass} ${textClass}`}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs mb-1 ${textMutedClass}`}>Mot de passe</label>
                                    <div className="relative">
                                    <input 
                                        type="text" // 'text' bach yban lih password fach yt-genera
                                        value={formData.password}
                                        className={`w-full p-2.5 pr-24 rounded-lg border bg-transparent ${borderClass} ${textClass} font-mono text-sm`}
                                        readOnly // Bach may-ghltch fih l-admin
                                    />
                                    <button 
                                        type="button"
                                        onClick={generatePassword}
                                        className="absolute right-1 top-1 bottom-1 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1"
                                    > Générer
                                    </button>
                                    </div>
                                </div>
                                </div>
                            </div>
                            </div>

                            <div className="pt-4 mb-4">
                                <div className="mb-3">
                                    <h3 className={`text-sm font-semibold flex items-center gap-2 ${textClass}`}>
                                        <div className="w-1 h-5 bg-indigo-500 rounded-full"></div>
                                        <Briefcase size={16} className="text-indigo-500" /> Information Professionnelle
                                    </h3>
                                    <div className="h-px bg-gradient-to-r from-indigo-500 to-transparent mt-2"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Post</label><select value={formData.Post_id || ""} onChange={(e) => handlePostChange(e.target.value)} className={inputClass} required><option value="">Selectionner un Post</option>{posts.map(post => (<option key={post.id} value={post.id}>{post.name} {post.is_starred && '⭐'}</option>))}</select></div>
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Grade</label><select value={formData.grade_id || ""} onChange={(e) => handleGradeChange(e.target.value)} className={inputClass} disabled={!selectedPost} required><option value="">Selectionner un grade</option>{grades.map(grade => <option key={grade.id} value={grade.id}>{grade.name}</option>)}</select></div>
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Echelle</label><select value={formData.echelle_id || ""} onChange={(e) => handleEchelleChange(e.target.value)} className={inputClass} disabled={!selectedGrade} required><option value="">Selectionner une echelle</option>{echelles.map(echelle => <option key={echelle.id} value={echelle.id}>Echelle {echelle.level}</option>)}</select></div>
                                    <div><label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Echelon</label><select value={formData.echelon_id || ""} onChange={(e) => handleEchelonChange(e.target.value)} className={inputClass} disabled={!selectedEchelle} required><option value="">Selectionner un echelon</option>{echelons.map(echelon => (<option key={echelon.id} value={echelon.id}>Ech. {echelon.order} - {Number(echelon.salary).toLocaleString()} MAD</option>))}</select></div>
                                </div>

                                {formData.salaire > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-3 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 rounded-lg">
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Salaire de base</label>
                                            <input type="text" name="salaire" value={formData.salaire ? Number(formData.salaire).toLocaleString() : '0'} readOnly className={`w-full p-2 rounded-lg border ${cardClass} ${textClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed font-bold`} />
                                        </div>
                                        <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 rounded-lg">
                                            <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Indice</label>
                                            <input type="text" name="indice" value={formData.indice || '0'} readOnly className={`w-full p-2 rounded-lg border ${cardClass} ${textClass} bg-gray-100 dark:bg-gray-800 cursor-not-allowed`} />
                                        </div>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 mb-4 ">
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Organisme (Cotisation)</label>
                                        <select value={formData.cotisation_id || ""} onChange={(e) => handleCotisationChange(e.target.value)} className={inputClass}>
                                            <option value="">-- Selectionner un organisme --</option>
                                            {cotisationsList.map(org => (<option key={org.id} value={org.id}>{org.name} {org.is_favorite && '⭐'}</option>))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium  ${textMutedClass}  mb-1 block`}>Credits</label>
                                        <button type="button"
                                            onClick={() => setShowCreditForm(!showCreditForm)}
                                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all cursor-pointer">
                                            <Plus size={12} /> Ajouter un credit
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    {employeeCredits.length > 0 && (
                                        <div className="mb-3 space-y-2">
                                            {employeeCredits.map((credit) => (
                                                <div key={credit.temp_id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-[#252525] rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {CreditList.find(c => c.id === parseInt(credit.credit_type_id))?.name || 'Credit'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {Number(credit.montant_credit).toLocaleString()} MAD • {credit.taux_credit}% • {credit.credit_duree} mois
                                                        </p>
                                                        <p className="text-xs text-indigo-600">
                                                            Mensualite: {Number(credit.credit_mensualite).toLocaleString()} MAD
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTempCredit(credit.temp_id)}
                                                        className="text-rose-500 hover:text-rose-700">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {showCreditForm && (
                                        <div className="mt-2 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/20">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Type de credit</label>
                                                    <select
                                                        value={tempCredit.credit_type_id}
                                                        onChange={(e) => setTempCredit({...tempCredit, credit_type_id: e.target.value})}
                                                        className={inputClass}>
                                                        <option value="">-- Selectionner --</option>
                                                        {CreditList.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Montant (MAD)</label>
                                                    <input type="number" placeholder="Ex: 100000" className={inputClass} 
                                                        value={tempCredit.montant_credit}
                                                        onChange={(e) => setTempCredit({...tempCredit, montant_credit: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Taux (%)</label>
                                                    <input type="number" step="0.1" placeholder="Ex: 6" className={inputClass}
                                                        value={tempCredit.taux_credit}
                                                        onChange={(e) => setTempCredit({...tempCredit, taux_credit: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Duree (mois)</label>
                                                    <input type="number" placeholder="Ex: 60" className={inputClass}
                                                        value={tempCredit.credit_duree}
                                                        onChange={(e) => setTempCredit({...tempCredit, credit_duree: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de debut</label>
                                                    <input type="date" className={inputClass}
                                                        value={tempCredit.credit_date_debut}
                                                        onChange={(e) => {
                                                            const newDateDebut = e.target.value;
                                                            setTempCredit({...tempCredit, credit_date_debut: newDateDebut});
                                                            if (tempCredit.credit_duree && newDateDebut) {
                                                                const dateFin = calculerDateFin(newDateDebut, tempCredit.credit_duree);
                                                                setTempCredit(prev => ({ ...prev, credit_date_fin: dateFin }));
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`text-xs font-medium ${textMutedClass} mb-1 block`}>Date de fin</label>
                                                    <div className="relative">
                                                        <input 
                                                            type="date" 
                                                            className={`${inputClass}  bg-gray-100 dark:bg-gray-800 cursor-not-allowed pr-8`} 
                                                            value={tempCredit.credit_date_fin} 
                                                            readOnly
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {tempCredit.montant_credit && tempCredit.taux_credit && tempCredit.credit_duree && (
                                                <div className="mt-3 p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                    <p className="text-sm text-indigo-600 dark:text-indigo-400">
                                                        Mensualite estimee: <strong>{calculerMensualite().toLocaleString()} MAD</strong>
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <div className="flex justify-end gap-4 mt-5 mr-2">
                                                <button type="button" onClick={() => {
                                                        setShowCreditForm(false);
                                                        setTempCredit({
                                                            credit_type_id: '',
                                                            montant_credit: '',
                                                            taux_credit: '',
                                                            credit_duree: '',
                                                            credit_date_debut: '',
                                                            description: ''
                                                        });
                                                    }}
                                                    className="px-3 py-1 text-sm text-white bg-red-500 rounded-lg cursor-pointer">
                                                    Annuler
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={addTempCredit}
                                                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg cursor-pointer">
                                                    Ajouter
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={loading} className="cursor-pointer w-full py-3 bg-blue-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25">
                                {loading ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
                                {loading ? "Enregistrement..." : isEdit ? "Mettre a jour" : "Enregistrer"}
                            </button>
                        </form>
                    </div>
                )}

                    {viewMode === 'table' ? (
                        <div className={`${cardClass} rounded-xl border overflow-hidden shadow-sm`}>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead className={darkMode ? 'bg-[#252525]' : 'bg-gray-50'}>
                                        <tr className={`text-left text-xs font-medium uppercase ${textMutedClass}`}>
                                            <th className="p-3">Employe</th>
                                            <th className="p-3 hidden md:table-cell">Poste</th>
                                            <th className="p-3 hidden lg:table-cell">Grade</th>
                                            <th className="p-3 hidden xl:table-cell">Echelle</th>
                                            <th className="p-3 hidden xl:table-cell">Echelon</th>
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
                                                    Aucun employe
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
                                                            emp.statut === 'CONGE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                                                        }`}>
                                                            {emp.statut || 'ACTIF'}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button onClick={() => handleViewEmployee(emp)} 
                                                                className="p-1.5 text-blue-500 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all cursor-pointer" 
                                                                title="Voir details">
                                                                <Eye size={16} />
                                                            </button>
                                                            <button onClick={() => handleEdit(emp)} 
                                                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`} 
                                                                disabled={!isYearEditable} 
                                                                title="Modifier">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)} 
                                                                className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400 cursor-not-allowed' : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`} 
                                                                disabled={!isYearEditable} 
                                                                title="Supprimer">
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
                                            emp.statut === 'CONGE' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
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
                                        <button onClick={() => handleViewEmployee(emp)} 
                                            className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all cursor-pointer">
                                            <Eye size={14} />
                                        </button>
                                        <button onClick={() => handleEdit(emp)} disabled={!isYearEditable} 
                                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'}`}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(emp.id, `${emp.prenom} ${emp.nom}`)} disabled={!isYearEditable}
                                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${!isYearEditable ? 'text-gray-400' : 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30'}`}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                {showDetailsModal && selectedEmployeeDetails && (<EmployeeDetailsModal employee={selectedEmployeeDetails} onClose={() => setShowDetailsModal(false)} />)}
                <DeleteConfirmModal 
                    isOpen={deleteModal.isOpen} 
                    onClose={() => setDeleteModal({ isOpen: false, employeeId: null, employeeName: "" })} 
                    onConfirm={confirmDelete} 
                    title="Confirmation de suppression" 
                    message={`Etes-vous sur de vouloir supprimer l'employe "${deleteModal.employeeName}" ? Cette action est irreversible.`} 
                    darkMode={darkMode} 
                />
        </div>
    </div>
);
}