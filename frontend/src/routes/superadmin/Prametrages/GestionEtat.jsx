import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Save, Trash2, ChevronUp, ChevronDown, Download, Upload, 
  TrendingUp, Users, DollarSign, FileText, Printer,
  Copy, Check, Edit2, BarChart3, Calendar, Shield, Clock, AlertCircle, Loader,
  Layers, Briefcase, Award, Zap, Eye, EyeOff, RefreshCw, Grid3x3, List,
  ArrowUpDown, Sparkles, Database, Server, HardDrive, Star, ArrowLeft
} from 'lucide-react';
import api from '../../../lib/apis/axiosConfig'; 
import { useNotification } from '../../../context/NotificationContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';
import { useTheme } from '../../../context/ThemeContext';


const GestionEtat = () => {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    const navigate = useNavigate(); 
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {}
    });

    const closeConfirm = () => setConfirmConfig({ ...confirmConfig, isOpen: false });
    const [config, setConfig] = useState({ 
        year: new Date().getFullYear(), 
        Post: []  
    });
    const [showStats, setShowStats] = useState(true);
    const [loading, setLoading] = useState(false);
    const [deleting, setDeleting] = useState({ type: null, id: null });
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [isDataSaved, setIsDataSaved] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [compactView, setCompactView] = useState(false);

    const [selectedPostId, setSelectedPostId] = useState(null);
    const [postStarred, setPostStarred] = useState({});

    const [isTyping, setIsTyping] = useState(false);
    const fetchTimeoutRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const [isYearValid, setIsYearValid] = useState(true);
    const currentYear = config.year;
    const isValidYearRange = currentYear >= 1900 && currentYear <= 2200;
    
    useEffect(() => {
        const savedStarred = localStorage.getItem('starred_posts');
        if (savedStarred) {
            setPostStarred(JSON.parse(savedStarred));
        }
    }, []);

    useEffect(() => {
        const savedView = localStorage.getItem('rh_compact_view');
        if (savedView) setCompactView(JSON.parse(savedView));
        fetchYearData();
    }, []);

    useEffect(() => {
        if (isTyping) return;
        
        if (fetchTimeoutRef.current) {
            clearTimeout(fetchTimeoutRef.current);
        }
        
        fetchTimeoutRef.current = setTimeout(() => {
            if (config.year && config.year !== '') {
                fetchYearData();
            }
        }, 1200);
        
        return () => {
            if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
            }
        };
    }, [config.year, isTyping]);

    useEffect(() => {
        const fetchStarredPostsFromDB = async () => {
            try {
                const response = await api.get('/api/gestionEtat/starred-posts');
                const starredMap = {};
                response.data.forEach(post => {
                    starredMap[post.id] = true;
                });
                setPostStarred(starredMap);
                localStorage.setItem('starred_posts', JSON.stringify(starredMap));
            } catch (error) {
                console.error("Erreur chargement postes étoilés:", error);
            }
        };
        
        if (config.year && isDataSaved && config.Post.length > 0) {
            fetchStarredPostsFromDB();
        }
    }, [config.year, isDataSaved, config.Post.length]);

    const fetchYearData = async () => {
        if (!config.year || config.year === '') {
            setLoading(false);
            return;
        }
        const yearNumber = parseInt(config.year);
        if (isNaN(yearNumber)) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/api/gestionEtat/get-by-year/${yearNumber}`);
                    console.log("📦 API Response:", response.data); // ✅ Ajouter cette ligne
        console.log("📦 Post data:", response.data?.Post); 
            if (response.data && response.data.Post) {
                setConfig(prev => ({ ...prev, year: yearNumber, Post: response.data.Post }));
                setIsDataSaved(true);
                setHasUnsavedChanges(false);
            } else {
                setConfig(prev => ({ ...prev, year: yearNumber, Post: [] }));
                setIsDataSaved(true);
                setHasUnsavedChanges(false);
            }
        } catch (error) {
            setConfig(prev => ({ ...prev, year: yearNumber, Post: [] }));
            setIsDataSaved(true);
            setHasUnsavedChanges(false);
        } finally {
            setLoading(false);
        }
    };

    const isValidData = () => {
        if (config.Post.length === 0) {
            showNotification("Ajoutez au moins un poste avant d'enregistrer", "error");
            return false;
        }
        let hasError = false;
        let errorMessages = [];
        config.Post.forEach(post => {
            if (!post.name || post.name.trim() === "") {
                errorMessages.push(`Le poste "${post.name || 'sans nom'}" n'a pas de nom`);
                hasError = true;
            }
            
            if (!post.grades || post.grades.length === 0) {
                errorMessages.push(`Le poste "${post.name || 'sans nom'}" doit avoir au moins un grade`);
                hasError = true;
            }
            
            post.grades.forEach(grade => {
                if (!grade.name || grade.name.trim() === "") {
                    errorMessages.push(`Un grade dans le poste "${post.name}" n'a pas de nom`);
                    hasError = true;
                }
                
                if (!grade.echelles || grade.echelles.length === 0) {
                    errorMessages.push(`Le grade "${grade.name}" dans le poste "${post.name}" doit avoir au moins une échelle`);
                    hasError = true;
                }
                grade.echelles.forEach(ech => {
                    if (!ech.level || ech.level.trim() === "") {
                        errorMessages.push(`Une échelle dans le grade "${grade.name}" n'a pas de niveau`);
                        hasError = true;
                    }
                    if (!ech.echelons || ech.echelons.length === 0) {
                        errorMessages.push(`L'échelle "${ech.level || 'sans niveau'}" dans le grade "${grade.name}" doit avoir au moins un échelon`);
                        hasError = true;
                    }
                    ech.echelons.forEach(ecl => {
                        if (!ecl.salary || ecl.salary <= 0) {
                            errorMessages.push(`L'échelon ${ecl.order} dans l'échelle "${ech.level}" du grade "${grade.name}" n'a pas de salaire valide`);
                            hasError = true;
                        }
                    });
                });
            });
        });
        
        if (hasError) {
            const displayErrors = errorMessages.slice(0, 5);
            displayErrors.forEach(err => showNotification(err, "error"));
            if (errorMessages.length > 5) {
                showNotification(`Et ${errorMessages.length - 5} autre(s) erreur(s)...`, "error");
            }
        }
        return !hasError;
    };

    const togglePostStar = async (postId, postName) => {
        if (hasUnsavedChanges) {
            showNotification(" Veuillez d'abord enregistrer vos modifications", "error");
            return;
        }
        setLoading(true);
        try {
            const response = await api.put(`/api/gestionEtat/post/${postId}/toggle-star`);
            
            const newStarred = { ...postStarred, [postId]: response.data.is_starred };
            setPostStarred(newStarred);
            localStorage.setItem('starred_posts', JSON.stringify(newStarred));
            
            showNotification(response.data.message, "success");
            setTimeout(() => {
                fetchYearData();
            }, 1000);
            
        } catch (error) {
            console.error("Erreur toggle star:", error);
            showNotification(" Erreur lors de la modification", "error");
        } finally {
            setLoading(false);
        }
    };

    const totalGrades = isDataSaved && !hasUnsavedChanges ? config.Post.reduce((acc, post) => 
        acc + (post.grades?.length || 0), 0) : 0;
    
    const totalEchelles = isDataSaved && !hasUnsavedChanges ? config.Post.reduce((acc, post) => 
        acc + (post.grades?.reduce((acc2, grade) => acc2 + (grade.echelles?.length || 0), 0) || 0), 0) : 0;
    
    const totalEchelons = isDataSaved && !hasUnsavedChanges ? config.Post.reduce((acc, post) => 
        acc + (post.grades?.reduce((acc2, grade) => 
            acc2 + (grade.echelles?.reduce((acc3, ech) => acc3 + (ech.echelons?.length || 0), 0) || 0), 0) || 0), 0) : 0;
    
    const totalSalaryMass = isDataSaved && !hasUnsavedChanges ? config.Post.reduce((acc, post) => 
        acc + (post.grades?.reduce((acc2, grade) => 
            acc2 + (grade.echelles?.reduce((acc3, ech) => 
                acc3 + (ech.echelons?.reduce((acc4, ecl) => acc4 + (Number(ecl.salary) || 0), 0) || 0), 0) || 0), 0) || 0), 0) : 0;

    const changeYear = async (amount) => {
        const newYear = parseInt(config.year) + amount;
        
        if (newYear < 1900 || newYear > 2200) {
            showNotification(` Année ${newYear} invalide. Limite: 1900-2200`, "error");
            return;
        }
        
        if (hasUnsavedChanges) {
            if (window.confirm(`Changer vers ${newYear} perdra les modifications non sauvegardées. Continuer ?`)) {
                setConfig(prev => ({ ...prev, year: newYear }));
                setHasUnsavedChanges(false);
                setIsDataSaved(false);
                setSelectedPostId(null);
            }
        } else {
            setConfig(prev => ({ ...prev, year: newYear }));
            setHasUnsavedChanges(true);
            setIsDataSaved(false);
            setSelectedPostId(null);
        }
    };
    
    const addPost = () => {
        if (config.year < 1900 || config.year > 2200) {
            showNotification(" Année invalide. Sélectionnez une année entre 1900 et 2200", "error");
            return;
        }
        const newPost = { 
            id: Date.now(), 
            name: '', 
            grades: [],
            _isNew: true
        };
        setConfig({ ...config, Post: [...config.Post, newPost] });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        setSelectedPostId(newPost.id);
        showNotification("✨ Nouveau poste créé (non sauvegardé)", "success");
    };

    const addGrade = (pId) => {
        const newGrade = { 
            id: Date.now(), 
            name: '', 
            echelles: [],
            _isNew: true
        };
        setConfig({
            ...config,
            Post: config.Post.map(p => p.id === pId ? { 
                ...p, grades: [...(p.grades || []), newGrade] 
            } : p)
        });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        showNotification("📊 Nouveau grade ajouté (non sauvegardé)", "success");
    };

    const addEchelle = (pId, gId) => {
        const newEchelle = { 
            id: Date.now(), 
            level: '', 
            echelons: [],
            _isNew: true
        };
        setConfig({
            ...config,
            Post: config.Post.map(p => p.id === pId ? {
                ...p, grades: (p.grades || []).map(g => g.id === gId ? { 
                    ...g, echelles: [...(g.echelles || []), newEchelle] 
                } : g)
            } : p)
        });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        showNotification(" Nouvelle échelle créée (non sauvegardée)", "success");
    };

    const addEchelon = (pId, gId, eId) => {
        setConfig({
            ...config,
            Post: config.Post.map(p => p.id === pId ? {
                ...p, grades: (p.grades || []).map(g => g.id === gId ? {
                    ...g, echelles: (g.echelles || []).map(e => {
                        if (e.id === eId) {
                            const nextOrder = (e.echelons || []).length + 1;
                            const lastIndex = (e.echelons || []).length > 0 
                            ? e.echelons[e.echelons.length - 1]?.index_val 
                            : 0;
                            const newIndex = lastIndex + 3;
                            const newEchelon = {
                                id: Date.now(), 
                                order: nextOrder, 
                                index_val: newIndex , 
                                salary: 0,
                                _isNew: true
                            };
                            return { 
                                ...e, 
                                echelons: [...(e.echelons || []), newEchelon] 
                            };
                        }
                        return e;
                    })
                } : g)
            } : p)
        });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        showNotification("📈 Nouvel échelon ajouté (non sauvegardé)", "success");
    };


    // ============ FONCTIONS DE SUPPRESSION ============
    const deletePostFromDB = async (postId) => {
        if (hasUnsavedChanges) {
            showNotification(" Veuillez d'abord enregistrer vos modifications", "error");
            return false;
        }
        
        setDeleting({ type: 'post', id: postId });
        try {
            await api.delete(`/api/gestionEtat/post/${postId}`);
            setConfig({ ...config, Post: config.Post.filter(p => p.id !== postId) });
            showNotification("🗑️ Poste supprimé avec succès", "success");
            return true;
        } catch (error) {
            console.error("Erreur suppression poste:", error);
            showNotification(" Erreur lors de la suppression", "error");
            return false;
        } finally {
            setDeleting({ type: null, id: null });
        }
    };

    const deleteGradeFromDB = async (gradeId, postId) => {
        if (hasUnsavedChanges) {
            showNotification(" Veuillez d'abord enregistrer vos modifications", "error");
            return false;
        }
        
        setDeleting({ type: 'grade', id: gradeId });
        try {
            await api.delete(`/api/gestionEtat/grade/${gradeId}`);
            setConfig({
                ...config,
                Post: config.Post.map(p => p.id === postId ? {
                    ...p, grades: (p.grades || []).filter(g => g.id !== gradeId)
                } : p)
            });
            showNotification("🗑️ Grade supprimé avec succès", "success");
            return true;
        } catch (error) {
            console.error("Erreur suppression grade:", error);
            showNotification(" Erreur lors de la suppression", "error");
            return false;
        } finally {
            setDeleting({ type: null, id: null });
        }
    };

    const deleteEchelleFromDB = async (echelleId, postId, gradeId) => {
        if (hasUnsavedChanges) {
            showNotification(" Veuillez d'abord enregistrer vos modifications", "error");
            return false;
        }
        
        setDeleting({ type: 'echelle', id: echelleId });
        try {
            await api.delete(`/api/gestionEtat/echelle/${echelleId}`);
            setConfig({
                ...config,
                Post: config.Post.map(p => p.id === postId ? {
                    ...p, grades: (p.grades || []).map(g => g.id === gradeId ? {
                        ...g, echelles: (g.echelles || []).filter(e => e.id !== echelleId)
                    } : g)
                } : p)
            });
            showNotification("🗑️ Échelle supprimée avec succès", "success");
            return true;
        } catch (error) {
            console.error("Erreur suppression échelle:", error);
            showNotification(" Erreur lors de la suppression", "error");
            return false;
        } finally {
            setDeleting({ type: null, id: null });
        }
    };

    const deleteEchelonFromDB = async (echelonId, postId, gradeId, echelleId) => {
        if (hasUnsavedChanges) {
            showNotification(" Veuillez d'abord enregistrer vos modifications", "error");
            return false;
        }
        
        setDeleting({ type: 'echelon', id: echelonId });
        try {
            await api.delete(`/api/gestionEtat/echelon/${echelonId}`);
            setConfig({
                ...config,
                Post: config.Post.map(p => p.id === postId ? {
                    ...p, grades: (p.grades || []).map(g => g.id === gradeId ? {
                        ...g, echelles: (g.echelles || []).map(e => e.id === echelleId ? {
                            ...e, echelons: (e.echelons || []).filter(ec => ec.id !== echelonId)
                        } : e)
                    } : g)
                } : p)
            });
            showNotification("🗑️ Échelon supprimé avec succès", "success");
            return true;
        } catch (error) {
            console.error("Erreur suppression échelon:", error);
            showNotification(" Erreur lors de la suppression", "error");
            return false;
        } finally {
            setDeleting({ type: null, id: null });
        }
    };

    const openDeleteModal = (title, message, action) => {
        if (hasUnsavedChanges) {
            showNotification(" Veuillez d'abord enregistrer vos modifications", "error");
            return;
        }
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: action
        });
    };

    const deletePostLocal = (postId) => {
        setConfig({ ...config, Post: config.Post.filter(p => p.id !== postId) });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        if (selectedPostId === postId) {
            setSelectedPostId(null);
        }
        showNotification("🗑️ Poste supprimé localement", "success");
    };

    const deleteGradeLocal = (gradeId, postId) => {
        setConfig({
            ...config,
            Post: config.Post.map(p => p.id === postId ? {
                ...p, grades: (p.grades || []).filter(g => g.id !== gradeId)
            } : p)
        });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        showNotification("🗑️ Grade supprimé localement", "success");
    };

    const deleteEchelleLocal = (echelleId, postId, gradeId) => {
        setConfig({
            ...config,
            Post: config.Post.map(p => p.id === postId ? {
                ...p, grades: (p.grades || []).map(g => g.id === gradeId ? {
                    ...g, echelles: (g.echelles || []).filter(e => e.id !== echelleId)
                } : g)
            } : p)
        });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        showNotification("🗑️ Échelle supprimée localement", "success");
    };

    const deleteEchelonLocal = (echelonId, postId, gradeId, echelleId) => {
        setConfig({
            ...config,
            Post: config.Post.map(p => p.id === postId ? {
                ...p, grades: (p.grades || []).map(g => g.id === gradeId ? {
                    ...g, echelles: (g.echelles || []).map(e => e.id === echelleId ? {
                        ...e, echelons: (e.echelons || []).filter(ec => ec.id !== echelonId)
                    } : e)
                } : g)
            } : p)
        });
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        showNotification("🗑️ Échelon supprimé localement", "success");
    };

    const handleDeletePost = (postId) => {
        openDeleteModal(
            "Supprimer le poste",
            "Êtes-vous sûr de vouloir supprimer ce poste ainsi que toutes ses données liées ? Cette action est irréversible.",
            () => deletePostFromDB(postId)
        );
    };

    const handleDeleteGrade = (gradeId, postId) => {
        openDeleteModal(
            "Supprimer le grade",
            "Voulez-vous vraiment supprimer ce grade ?",
            () => deleteGradeFromDB(gradeId, postId)
        );
    };

    const handleDeleteEchelle = (echelleId, postId, gradeId) => {
        openDeleteModal(
            "Supprimer l'échelle",
            "Êtes-vous sûr de vouloir supprimer cette échelle ainsi que tous ses échelons ?",
            () => deleteEchelleFromDB(echelleId, postId, gradeId)
        );
    };

    const handleDeleteEchelon = (echelonId, postId, gradeId, echelleId) => {
        openDeleteModal(
            "Supprimer l'échelon",
            "Voulez-vous vraiment supprimer cet échelon ?",
            () => deleteEchelonFromDB(echelonId, postId, gradeId, echelleId)
        );
    };
    
    // ============ FIN FONCTIONS SUPPRESSION ============
    
    const duplicateEchelon = (pIdx, gIdx, eIdx, ecIdx) => {
        const newPosts = [...config.Post];
        const echelonToCopy = { ...newPosts[pIdx].grades[gIdx].echelles[eIdx].echelons[ecIdx] };
        echelonToCopy.id = Date.now();
        echelonToCopy.order = newPosts[pIdx].grades[gIdx].echelles[eIdx].echelons.length + 1;
        newPosts[pIdx].grades[gIdx].echelles[eIdx].echelons.push(echelonToCopy);
        setConfig({...config, Post: newPosts});
        setIsDataSaved(false);
        setHasUnsavedChanges(true);
        setCopiedIndex(ecIdx);
        setTimeout(() => setCopiedIndex(null), 2000);
        showNotification("📋 Échelon dupliqué avec succès", "success");
    };

    const handleSave = async () => {
        if (config.year < 1900 || config.year > 2200) {
            showNotification(" Année invalide. Veuillez choisir une année entre 1900 et 2200", "error");
            return;
        }
        if (!isValidData()) {
            return;
        }
        setLoading(true);
        try {
            const cleanConfig = {
                year: config.year,
                Post: config.Post.map(post => {
                    const { _isNew: pIsNew, ...cleanPost } = post;
                    return {
                        ...cleanPost,
                        grades: (post.grades || []).map(grade => {
                            const { _isNew: gIsNew, ...cleanGrade } = grade;
                            return {
                                ...cleanGrade,
                                echelles: (grade.echelles || []).map(echelle => {
                                    const { _isNew: eIsNew, ...cleanEchelle } = echelle;
                                    return {
                                        ...cleanEchelle,
                                        echelons: (echelle.echelons || []).map(echelon => {
                                            const { _isNew: ecIsNew, ...cleanEchelon } = echelon;
                                            return cleanEchelon;
                                        })
                                    };
                                })
                            };
                        })
                    };
                })
            };
            
            await api.post('/api/gestionEtat/store', cleanConfig);
            setIsDataSaved(true);
            setHasUnsavedChanges(false);
            showNotification(`Configuration ${config.year} enregistrée avec succès!`, "success");
            await fetchYearData(); 
        } catch (error) {
            console.error("Erreur save:", error);
            showNotification(" Erreur lors de la sauvegarde", "error");
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = async () => {
        if (config.year < 1900 || config.year > 2200) {
            showNotification("Année invalide. Sélectionnez une année entre 1900 et 2200", "error");
            return;
        }
        setLoading(true);
        try {
            const response = await api.get(`/api/gestionEtat/export-pdf/${config.year}`, {
                responseType: 'blob',
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `grille_salariale_${config.year}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            showNotification("📄 PDF exporté avec succès!", "success");
        } catch (error) {
            console.error("Erreur export PDF:", error);
            showNotification(" Erreur lors de l'export PDF", "error");
        } finally {
            setLoading(false);
        }
    };
    
    const isDeleting = (type, id) => deleting.type === type && deleting.id === id;

    const statsCards = [
        { title: "POSTES", value: config.Post.length, icon: Users, bgColor: darkMode ? "bg-indigo-500/10" : "bg-indigo-50", iconColor: "text-indigo-500" },
        { title: "GRADES", value: totalGrades, icon: Layers, bgColor: darkMode ? "bg-green-500/10" : "bg-green-50", iconColor: "text-green-500" },
        { title: "ÉCHELLES", value: totalEchelles, icon: Grid3x3, bgColor: darkMode ? "bg-purple-500/10" : "bg-purple-50", iconColor: "text-purple-500" },
        { title: "ÉCHELONS", value: totalEchelons, icon: Database, bgColor: darkMode ? "bg-orange-500/10" : "bg-orange-50", iconColor: "text-orange-500" },
        { title: "MASSE SALARIALE", value: totalSalaryMass.toLocaleString(), icon: DollarSign, bgColor: darkMode ? "bg-red-500/10" : "bg-red-50", iconColor: "text-red-500" }
    ];

    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F5F7FA]';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-100';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-100';

    return (
        <div className={`min-h-screen transition-all duration-300 ${bgClass}`}>
            <div className="p-3 max-w-[1600px] mx-auto">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate(-1)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-50'} border shadow-sm`}
                                title="Retour">
                                <ArrowLeft size={18} className={textClass} />
                            </button>
                            <div>
                                <h1 className={`text-2xl font-bold mb-1 ${textClass}`}>Grille des Salaires</h1>
                                <p className={`text-xs ${textMutedClass}`}>Gestion des postes, grades, échelles et échelons</p>
                            </div>
                        </div>
                    </div>

                    {showStats && isDataSaved && !hasUnsavedChanges && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            {statsCards.map((stat, idx) => (
                                <div key={idx} className={`${cardClass} rounded-xl p-4 border transition-all hover:shadow-lg hover:-translate-y-0.5`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className={`${stat.bgColor} p-2 rounded-xl`}>
                                            <stat.icon size={18} className={stat.iconColor}/>
                                        </div>
                                        <span className={`text-2xl font-black ${textClass}`}>{stat.value}</span>
                                    </div>
                                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${textMutedClass}`}>{stat.title}</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {(!isDataSaved || hasUnsavedChanges) && (
                        <div className={`${cardClass} rounded-xl p-4 border ${borderClass} mb-6`}>
                            <div className="flex items-center gap-3">
                                <div className="bg-yellow-500/10 p-2 rounded-full">
                                    <AlertCircle size={18} className="text-yellow-500"/>
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                                        {config.Post.length === 0 ? "Commencez par créer un poste et remplir les données": "Modifications en attente de sauvegarde"}
                                    </p>
                                    <p className={`text-[10px] ${textMutedClass}`}>
                                        {config.Post.length === 0 ? "Cliquez sur 'Nouveau Poste' pour commencer": "Les statistiques apparaîtront après la sauvegarde"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Controls Bar */}
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <div className={`flex items-center gap-2 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'} p-1.5 rounded-xl border ${borderClass} shadow-sm`}>
                            <span className={`pl-2 text-[10px] font-bold uppercase ${textMutedClass}`}>Année</span>
                            <input 
                                type="number" 
                                value={config.year}
                                className={`w-16 font-black text-center outline-none text-sm ${darkMode ? 'bg-transparent text-indigo-400' : 'bg-transparent text-indigo-600'}`} 
                                onChange={(e) => {
                                    const rawValue = e.target.value;
                                    if (typingTimeoutRef.current) {
                                        clearTimeout(typingTimeoutRef.current);
                                    }
                                    setIsTyping(true);
                                    
                                    if (rawValue === '') {
                                        setConfig({...config, year: ''});
                                        setIsDataSaved(false);
                                        setHasUnsavedChanges(true);
                                        return;
                                    }
                                    
                                    let newYear = parseInt(rawValue);
                                    if (newYear < 1900) {
                                        showNotification(" L'année ne peut pas être inférieure à 1900", "error");
                                        setConfig({...config, year: newYear});
                                    } else if (newYear > 2200) {
                                        showNotification(" L'année ne peut pas être supérieure à 2200", "error");
                                        setConfig({...config, year: newYear});
                                    } else {
                                        setConfig({...config, year: newYear});
                                    }
                                    
                                    setIsDataSaved(false);
                                    setHasUnsavedChanges(true);
                                    setSelectedPostId(null);
                                    
                                    typingTimeoutRef.current = setTimeout(() => {
                                        setIsTyping(false);
                                    }, 1000);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.target.blur();
                                        setIsTyping(false);
                                    }
                                }}
                                onBlur={() => {
                                    setIsTyping(false);
                                }}/>
                            <div className="flex flex-col border-l pl-1 ${borderClass}">
                                <button onClick={() => changeYear(1)} className={`p-0.5 hover:text-indigo-500 transition-colors`}><ChevronUp size={10}/></button>
                                <button onClick={() => changeYear(-1)} className={`p-0.5 hover:text-indigo-500 transition-colors`}><ChevronDown size={10}/></button>
                            </div>
                        </div>

                        <button onClick={addPost} className="flex items-center cursor-pointer gap-2 bg-blue-600  text-white px-4 py-1.5 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all transform text-[11px] shadow-lg shadow-indigo-500/25">
                            <Plus size={14} /> NOUVEAU POSTE
                        </button>

                        <button onClick={exportToPDF} 
                            disabled={loading || config.Post.length === 0}
                            className="flex items-center gap-2 bg-gradient-to-r from-red-600 cursor-pointer to-rose-600 text-white px-4 py-1.5 rounded-xl font-bold hover:from-red-700 hover:to-rose-700 transition-all text-[11px] shadow-lg shadow-red-500/25 disabled:opacity-50">
                            <FileText size={14} /> EXPORT PDF
                        </button>
                    </div>
                    <button onClick={handleSave} disabled={loading || !hasUnsavedChanges} className={` cursor-pointer px-5 py-1.5 rounded-xl font-bold shadow-lg flex items-center gap-2 text-[11px] transition-all disabled:opacity-50 ${!hasUnsavedChanges ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:from-indigo-700 hover:to-purple-700'} text-white`}>
                        {loading ? <Loader size={14} className="animate-spin"/> : hasUnsavedChanges ? <Save size={14}/> : <Save size={14}/>}
                        {!hasUnsavedChanges ? "SAUVEGARDÉ" : `SAUVEGARDER ${config.year}`}
                    </button>
                </div>

                {/* Post List */}
                <div className="space-y-4">
                    {config.Post.map((post, pIdx) => (
                        <div key={post.id} className={`${cardClass} rounded-xl border shadow-sm overflow-hidden transition-all hover:shadow-xl ${borderClass} animate-fadeIn`}>
                            <div className={`${darkMode ? 'bg-[#252525]' : 'bg-gray-50/50'} px-5 py-3 border-b ${borderClass} flex flex-wrap justify-between items-center gap-3`}>
                                <div className="flex-1 min-w-[200px]">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className={`p-1 rounded-lg ${darkMode ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                                            <Briefcase size={12} className="text-indigo-500"/>
                                        </div>
                                        <input className={`font-bold outline-none text-sm focus:border-b-2 border-indigo-400 ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'} w-full`}
                                            value={post.name}
                                            onChange={(e) => {
                                                const newPosts = [...config.Post];
                                                newPosts[pIdx].name = e.target.value;
                                                setConfig({...config, Post: newPosts});
                                                setIsDataSaved(false);
                                                setHasUnsavedChanges(true);
                                            }}
                                            placeholder="Nom du Poste..."/>
                                    </div>
                                    <div className={`text-[9px] ${textMutedClass}`}>
                                        {(post.grades || []).length} grade{(post.grades || []).length > 1 ? 's' : ''}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => togglePostStar(post.id, post.name)}
                                        disabled={hasUnsavedChanges || loading}
                                        className={`cursor-pointer p-1.5 rounded-lg transition-all ${hasUnsavedChanges ? 'text-gray-500 cursor-not-allowed' : postStarred[post.id] ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}
                                        title={postStarred[post.id] ? "Poste disponible dans toutes les années" : "Copier ce poste vers toutes les années"}>
                                        <Star size={14} fill={postStarred[post.id] ? "currentColor" : "none"} />
                                    </button>
                                    <button onClick={() => setSelectedPostId(selectedPostId === post.id ? null : post.id)}
                                        className={` cursor-pointer p-1.5 rounded-lg transition-all ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}
                                        title={selectedPostId === post.id ? "Masquer les détails" : "Afficher les détails"}>
                                        {selectedPostId === post.id ? 
                                            <EyeOff size={14} className={textMutedClass}/> : 
                                            <Eye size={14} className={textMutedClass}/>
                                        }
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (post._isNew) {
                                                deletePostLocal(post.id);
                                            } else {
                                                handleDeletePost(post.id);
                                            }
                                        }} 
                                        disabled={isDeleting('post', post.id) || (hasUnsavedChanges && !post._isNew)}
                                        className={`cursor-pointer p-1.5 rounded-lg transition-all ${(hasUnsavedChanges && !post._isNew) ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                                        title={(hasUnsavedChanges && !post._isNew) ? "Sauvegardez d'abord" : "Supprimer"}>
                                        {isDeleting('post', post.id) ? <Loader size={14} className="animate-spin"/> : <Trash2 size={14}/>}
                                    </button>
                                </div>
                            </div>

                            {selectedPostId == post.id && (
                                <div className="p-5 space-y-4">
                                    {(post.grades || []).map((grade, gIdx) => (
                                        <div key={grade.id} className={`border rounded-xl p-4 transition-all hover:shadow-md ${borderClass} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
                                            <div className="flex flex-wrap justify-between items-center mb-4 pb-2 border-b ${borderClass}">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1 rounded-lg ${darkMode ? 'bg-green-500/20' : 'bg-green-100'}`}>
                                                        <Award size={12} className="text-green-500"/>
                                                    </div>
                                                    <input 
                                                        className={`font-semibold outline-none text-sm ${darkMode ? 'bg-transparent text-white' : 'bg-transparent text-gray-800'}`} 
                                                        value={grade.name} 
                                                        onChange={(e) => {
                                                            const newPosts = [...config.Post];
                                                            newPosts[pIdx].grades[gIdx].name = e.target.value;
                                                            setConfig({...config, Post: newPosts});
                                                            setIsDataSaved(false);
                                                            setHasUnsavedChanges(true);
                                                        }} 
                                                        placeholder="Nom du grade..."
                                                    />
                                                </div>
                                                <div className="flex gap-1.5">
                                                    <button onClick={() => addEchelle(post.id, grade.id)} 
                                                        className=" cursor-pointer text-[10px] bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 font-medium transition-all">
                                                        + Échelle
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            if (grade._isNew) {
                                                                deleteGradeLocal(grade.id, post.id);
                                                            } else {
                                                                handleDeleteGrade(grade.id, post.id);
                                                            }
                                                        }} 
                                                        disabled={isDeleting('grade', grade.id) || (hasUnsavedChanges && !grade._isNew)}
                                                        className={`cursor-pointer p-1 rounded-lg transition-all ${(hasUnsavedChanges && !grade._isNew) ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10'}`}
                                                        title={(hasUnsavedChanges && !grade._isNew) ? "Sauvegardez d'abord" : "Supprimer"}>
                                                        {isDeleting('grade', grade.id) ? <Loader size={12} className="animate-spin"/> : <Trash2 size={12}/>}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={`grid ${compactView ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
                                                {(grade.echelles || []).map((ech, eIdx) => (
                                                    <div key={ech.id} className={`${darkMode ? 'bg-[#252525]' : 'bg-gray-50/50'} p-3 rounded-xl border ${borderClass} transition-all hover:shadow-md group`}>
                                                        <div className="flex justify-between items-center mb-3">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className={`text-[9px] font-bold uppercase tracking-wide ${textMutedClass}`}>Échelle</span>
                                                                <input 
                                                                    className={`w-10 border rounded-lg px-1.5 py-0.5 text-center font-bold outline-none text-xs ${darkMode ? 'bg-[#1A1A1A] border-[#333] text-indigo-400' : 'bg-white border-gray-200 text-indigo-600'}`}
                                                                    value={ech.level}
                                                                    onChange={(e) => {
                                                                        const newPosts = [...config.Post];
                                                                        newPosts[pIdx].grades[gIdx].echelles[eIdx].level = e.target.value;
                                                                        setConfig({...config, Post: newPosts});
                                                                        setIsDataSaved(false);
                                                                        setHasUnsavedChanges(true);
                                                                    }}
                                                                    placeholder="N°"
                                                                />
                                                            </div>
                                                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={() => addEchelon(post.id, grade.id, ech.id)} 
                                                                    className=" cursor-pointer  text-[9px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline px-1.5">
                                                                    + Échelon
                                                                </button>
                                                                <button 
                                                                    onClick={() => {
                                                                        if (ech._isNew) {
                                                                            deleteEchelleLocal(ech.id, post.id, grade.id);
                                                                        } else {
                                                                            handleDeleteEchelle(ech.id, post.id, grade.id);
                                                                        }
                                                                    }} 
                                                                    disabled={isDeleting('echelle', ech.id) || (hasUnsavedChanges && !ech._isNew)}
                                                                    className={`cursor-pointer p-0.5 rounded transition-all ${(hasUnsavedChanges && !ech._isNew) ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                                                                    title={(hasUnsavedChanges && !ech._isNew) ? "Sauvegardez d'abord" : "Supprimer"}>
                                                                    {isDeleting('echelle', ech.id) ? <Loader size={9} className="animate-spin"/> : <Trash2 size={10}/>}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
                                                            {(ech.echelons || []).map((ecl, ecIdx) => (
                                                                <div key={ecl.id} 
                                                                    className={`flex items-center gap-1.5 p-1.5 rounded-lg border transition-all ${borderClass} ${darkMode ? 'bg-[#1A1A1A] hover:bg-[#222]' : 'bg-white hover:bg-gray-50'}`}>
                                                                    <span className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] font-bold ${darkMode ? 'bg-[#333] text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                                        E{ecl.order}
                                                                    </span>
                                                                    <div className="flex items-center gap-0.5 flex-1">
                                                                        <span className={`text-[8px] ${textMutedClass}`}>Idx</span>
                                                                        <input 
                                                                            type="number" 
                                                                            className={`w-10 outline-none font-bold text-right text-[10px] ${darkMode ? 'text-indigo-400 bg-transparent' : 'text-indigo-600 bg-transparent'}`}
                                                                            value={ecl.index_val}
                                                                            onChange={(e) => {
                                                                                const newPosts = [...config.Post];
                                                                                newPosts[pIdx].grades[gIdx].echelles[eIdx].echelons[ecIdx].index_val = e.target.value;
                                                                                setConfig({...config, Post: newPosts});
                                                                                setIsDataSaved(false);
                                                                                setHasUnsavedChanges(true);
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <input 
                                                                        type="number" 
                                                                        className={`w-20 text-right font-black outline-none text-[10px] ${darkMode ? 'text-emerald-400 bg-transparent' : 'text-gray-800 bg-transparent'}`}
                                                                        value={ecl.salary}
                                                                        onChange={(e) => {
                                                                            const newPosts = [...config.Post];
                                                                            newPosts[pIdx].grades[gIdx].echelles[eIdx].echelons[ecIdx].salary = e.target.value;
                                                                            setConfig({...config, Post: newPosts});
                                                                            setIsDataSaved(false);
                                                                            setHasUnsavedChanges(true);
                                                                        }}
                                                                    />
                                                                    <span className={`text-[8px] ${textMutedClass}`}>MAD</span>
                                                                    <button 
                                                                        onClick={() => duplicateEchelon(pIdx, gIdx, eIdx, ecIdx)}
                                                                        className="p-0.5 text-indigo-400 hover:text-indigo-600 transition-all cursor-pointer "
                                                                        title="Dupliquer">
                                                                        {copiedIndex === ecIdx ? <Check size={9}/> : <Copy size={9}/>}
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => {
                                                                            if (ecl._isNew) {
                                                                                deleteEchelonLocal(ecl.id, post.id, grade.id, ech.id);
                                                                            } else {
                                                                                handleDeleteEchelon(ecl.id, post.id, grade.id, ech.id);
                                                                            }
                                                                        }} 
                                                                        disabled={isDeleting('echelon', ecl.id) || (hasUnsavedChanges && !ecl._isNew)}
                                                                        className={`cursor-pointer p-0.5 rounded transition-all ${(hasUnsavedChanges && !ecl._isNew) ? 'text-gray-500 cursor-not-allowed' : 'text-red-400 hover:text-red-600'}`}
                                                                        title={(hasUnsavedChanges && !ecl._isNew) ? "Sauvegardez d'abord" : "Supprimer"}>
                                                                        {isDeleting('echelon', ecl.id) ? <Loader size={8} className="animate-spin"/> : <Trash2 size={9}/>}
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {(ech.echelons || []).length === 0 && (
                                                                <div className={`text-center py-3 text-[9px] ${textMutedClass}`}>
                                                                    Aucun échelon
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={() => addGrade(post.id)} 
                                        className=" cursor-pointer text-[10px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline px-2 py-1 transition-all flex items-center gap-1">
                                        <Plus size={10}/> Ajouter un grade
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {config.Post.length === 0 && !loading && (
                        <div className={`text-center py-20 border-2 border-dashed rounded-2xl transition-all ${borderClass} ${darkMode ? 'text-gray-500 border-[#2A2A2A] bg-[#1A1A1A]' : 'text-gray-400 border-gray-200 bg-white'}`}>
                            <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'} flex items-center justify-center`}>
                                <Database size={32} className="opacity-50"/>
                            </div>
                            <p className="font-medium mb-2">Aucune configuration pour {config.year}</p>
                            <button onClick={addPost} className=" cursor-pointer mt-3 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:from-indigo-700 hover:to-purple-700 transition-all text-xs shadow-lg">
                                + Créer un poste
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            {hasUnsavedChanges && !loading && (
                <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full shadow-xl animate-pulse text-[10px] font-bold flex items-center gap-2">
                    <Sparkles size={12} className="animate-spin"/>
                    Modifications non sauvegardées
                </div>
            )}

            <DeleteConfirmModal 
                isOpen={confirmConfig.isOpen}
                onClose={closeConfirm}
                onConfirm={confirmConfig.onConfirm}
                title={confirmConfig.title}
                message={confirmConfig.message}
                darkMode={darkMode}
            />
        </div>
    );
};

export default GestionEtat;