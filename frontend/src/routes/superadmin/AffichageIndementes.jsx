import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';
import { 
    Gift, Calendar, Loader2, AlertCircle, ArrowLeft, 
    Users, Award, Grid3x3, Hash, Percent, Globe, Wallet, TrendingUp, Eye, 
    CheckCircle, Search, List, ChevronDown, Trash2, X
} from 'lucide-react';

const AffichageIndemnitee = () => {
    const { showNotification } = useNotification();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedYearId, setSelectedYearId] = useState(null);
    const [indemnites, setIndemnites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, libelle: '' });
    const yearRef = useRef(null);

    // Dark mode classes
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = darkMode ? 'bg-[#252525] text-white placeholder-gray-500' : 'bg-gray-50 text-gray-800';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-800';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (yearRef.current && !yearRef.current.contains(event.target)) {
                setIsYearOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        if (selectedYearId) {
            fetchIndemnites();
        }
    }, [selectedYearId]);

    const fetchYears = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/gestionEtat/years-with-indemnites');
            const data = Array.isArray(res.data) ? res.data : [];
            setYears(data);
            
            const savedYear = localStorage.getItem('affichage_indemnite_year');
            if (savedYear && data.some(y => y.year == savedYear)) {
                setSelectedYear(savedYear);
                const yearObj = data.find(y => y.year == savedYear);
                setSelectedYearId(yearObj?.id);
            } else if (data.length > 0) {
                const lastYear = data[data.length - 1];
                setSelectedYear(lastYear.year);
                setSelectedYearId(lastYear.id);
                localStorage.setItem('affichage_indemnite_year', lastYear.year);
            }
        } catch (err) {
            showNotification("Erreur chargement des années", "error");
            setYears([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchIndemnites = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/gestionEtat/gestionindemnites/${selectedYearId}`);
            setIndemnites(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            setIndemnites([]); 
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (yearValue, yearId) => {
        setSelectedYear(yearValue);
        setSelectedYearId(yearId);
        localStorage.setItem('affichage_indemnite_year', yearValue);
        showNotification(`Année ${yearValue} sélectionnée`, "success");
    };

    const openDeleteModal = (id, libelle) => {
        setDeleteModal({ isOpen: true, id, libelle });
    };

    const closeDeleteModal = () => {
        setDeleteModal({ isOpen: false, id: null, libelle: '' });
    };

    const confirmDelete = async () => {
        const { id, libelle } = deleteModal;
        setDeletingId(id);
        try {
            await api.delete(`/api/gestionEtat/gestionindemnites/${id}`);
            showNotification(`Indemnité "${libelle}" supprimée`, "success");
            fetchIndemnites();
        } catch (err) {
            showNotification("Erreur lors de la suppression", "error");
        } finally {
            setDeletingId(null);
            closeDeleteModal();
        }
    };

    const getTargetText = (item) => {
        if (item.is_for_all) return "Tous les employés";
        let target = "";
        if (item.post) target += item.post.name;
        if (item.grade) target += ` / ${item.grade.name}`;
        if (item.echelle) target += ` / Éch. ${item.echelle.level}`;
        if (item.echelon) target += ` / E${item.echelon.order}`;
        return target || "Non spécifié";
    };

    const getTypeBadge = (type) => {
        if (type === 'Fixe') {
            return <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-0.5 rounded-full text-xs font-medium">Fixe</span>;
        }
        return <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-0.5 rounded-full text-xs font-medium">Pourcentage</span>;
    };

    // Filtrage
    const filteredIndemnites = indemnites.filter(item => {
        const matchesSearch = item.libelle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    // Statistiques
    const totalCount = filteredIndemnites.length;
    const fixeCount = filteredIndemnites.filter(i => i.type === 'Fixe').length;
    const pourcentageCount = filteredIndemnites.filter(i => i.type === 'Pourcentage').length;
    const totalFixeMontant = filteredIndemnites.filter(i => i.type === 'Fixe').reduce((sum, i) => sum + (parseFloat(i.valeur) || 0), 0);
    const totalPourcentageMontant = filteredIndemnites.filter(i => i.type === 'Pourcentage').reduce((sum, i) => sum + (parseFloat(i.valeur) || 0), 0);

    return (
        <div className={`min-h-screen ${bgClass}`}>
            <div className="max-w-6xl mx-auto p-2">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-lg ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-50'} border shadow-sm cursor-pointer`}
                    >
                        <ArrowLeft size={18} className={textClass} />
                    </button>
                    <div>
                        <h1 className={`text-2xl font-bold ${textClass}`}>Consultation des Indemnités</h1>
                        <p className={`text-sm ${textMutedClass} mt-1`}>Liste des primes et indemnités configurées par année</p>
                    </div>
                </div>

                {/* Year Selector */}
                <div className={`${cardClass} rounded-xl border ${borderClass} p-5 mb-6 shadow-sm`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className={`text-base font-semibold ${textClass}`}>Année de référence</p>
                                <p className={`text-sm ${textMutedClass}`}>Sélectionnez une année pour consulter les indemnités</p>
                            </div>
                        </div>
                        
                        <div className="relative" ref={yearRef}>
                            <button 
                                onClick={() => setIsYearOpen(!isYearOpen)}
                                disabled={years.length === 0}
                                className={`h-11 px-6 rounded-lg text-base font-medium flex items-center gap-2 ${selectClass} border ${borderClass} ${textClass} ${years.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {selectedYear || 'Sélectionner année'}
                                <ChevronDown size={16} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && years.length > 0 && (
                                <div className={`absolute top-full right-0 mt-2 rounded-lg border ${borderClass} ${cardClass} z-10 min-w-[160px] shadow-lg overflow-hidden`}>
                                    {years.map(y => (
                                        <div 
                                            key={y.id}
                                            onClick={() => { handleYearChange(y.year, y.id); setIsYearOpen(false); }}
                                            className={`px-4 py-3 text-base cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors ${selectedYear == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : textClass}`}
                                        >
                                            {y.year}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedYear ? (
                    <>
                        {/* Stats Cards - 2x3 grid plus grand */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                            <div className={`${cardClass} rounded-xl border ${borderClass} p-4`}>
                                <p className={`text-xs font-medium uppercase ${textMutedClass}`}>Total</p>
                                <p className={`text-2xl font-bold ${textClass} mt-1`}>{totalCount}</p>
                            </div>
                            <div className={`${cardClass} rounded-xl border ${borderClass} p-4`}>
                                <p className={`text-xs font-medium uppercase ${textMutedClass}`}>Fixe</p>
                                <p className={`text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1`}>{fixeCount}</p>
                            </div>
                            <div className={`${cardClass} rounded-xl border ${borderClass} p-4`}>
                                <p className={`text-xs font-medium uppercase ${textMutedClass}`}>Pourcentage</p>
                                <p className={`text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1`}>{pourcentageCount}</p>
                            </div>
                            <div className={`${cardClass} rounded-xl border ${borderClass} p-4`}>
                                <p className={`text-xs font-medium uppercase ${textMutedClass}`}>Masse Fixe</p>
                                <p className={`text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1`}>{totalFixeMontant.toLocaleString()} <span className="text-xs">MAD</span></p>
                            </div>
                            <div className={`${cardClass} rounded-xl border ${borderClass} p-4`}>
                                <p className={`text-xs font-medium uppercase ${textMutedClass}`}>Masse %</p>
                                <p className={`text-lg font-bold text-amber-600 dark:text-amber-400 mt-1`}>{totalPourcentageMontant.toLocaleString()}%</p>
                            </div>
                        </div>

                        {/* Search & Filter */}
                        <div className={`${cardClass} rounded-xl border ${borderClass} p-4 mb-6`}>
                            <div className="flex flex-wrap gap-3">
                                <div className="flex-1 min-w-[250px] relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Rechercher une indemnité..." 
                                        value={searchTerm} 
                                        onChange={(e) => setSearchTerm(e.target.value)} 
                                        className={`w-full pl-10 pr-3 py-2.5 rounded-lg text-sm border ${borderClass} ${inputClass} outline-none focus:ring-1 focus:ring-indigo-500 transition-all`} 
                                    />
                                </div>
                                <select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value)} 
                                    className={`px-4 py-2.5 rounded-lg text-sm border ${borderClass} ${selectClass} ${textClass} outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer`}
                                >
                                    <option value="all">Tous les types</option>
                                    <option value="Fixe">Fixe</option>
                                    <option value="Pourcentage">Pourcentage</option>
                                </select>
                                {(searchTerm || filterType !== 'all') && (
                                    <button onClick={() => { setSearchTerm(''); setFilterType('all'); }} className="px-4 py-2.5 text-red-500 text-sm hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer">
                                        Effacer
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Indemnités List */}
                        <div className={`${cardClass} rounded-xl border ${borderClass} overflow-hidden shadow-sm`}>
                            <div className={`px-5 py-4 border-b ${borderClass} ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                                <h3 className={`text-base font-semibold ${textClass}`}>
                                    Liste des indemnités
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400`}>
                                        {filteredIndemnites.length}
                                    </span>
                                </h3>
                            </div>
                            
                            <div className="divide-y dark:divide-[#2A2A2A]">
                                {loading ? (
                                    <div className="flex justify-center py-16">
                                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                                    </div>
                                ) : filteredIndemnites.length === 0 ? (
                                    <div className="text-center py-16">
                                        <Gift size={48} className={`mx-auto mb-4 opacity-30 ${textMutedClass}`} />
                                        <p className={`text-base ${textMutedClass}`}>Aucune indemnité trouvée</p>
                                        <p className={`text-sm ${textMutedClass} mt-1`}>Modifiez les filtres ou vérifiez la configuration</p>
                                    </div>
                                ) : (
                                    filteredIndemnites.map(item => (
                                        <div key={item.id} className={`p-5 transition-colors ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}>
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                                            <Gift size={16} className="text-indigo-600 dark:text-indigo-400" />
                                                        </div>
                                                        <p className={`text-base font-semibold ${textClass}`}>{item.libelle}</p>
                                                        {getTypeBadge(item.type)}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users size={14} className={textMutedClass} />
                                                            <span className={`text-sm ${textMutedClass}`}>{getTargetText(item)}</span>
                                                        </div>
                                                        <div className={`text-sm font-medium px-2 py-0.5 rounded-full ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'} ${textClass}`}>
                                                            Valeur: {item.valeur} {item.type === 'Fixe' ? 'MAD' : '%'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => openDeleteModal(item.id, item.libelle)}
                                                    disabled={deletingId === item.id}
                                                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                                                    title="Supprimer"
                                                >
                                                    {deletingId === item.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={`${cardClass} rounded-xl border ${borderClass} p-16 text-center shadow-sm`}>
                        {loading ? (
                            <Loader2 size={40} className="animate-spin text-indigo-500 mx-auto" />
                        ) : (
                            <>
                                <Calendar size={56} className={`mx-auto mb-5 opacity-30 ${textMutedClass}`} />
                                <p className={`text-lg font-medium ${textClass}`}>Aucune année sélectionnée</p>
                                <p className={`text-sm ${textMutedClass} mt-2`}>
                                    Veuillez sélectionner une année pour consulter les indemnités
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Supprimer l'indemnité"
                message={`Êtes-vous sûr de vouloir supprimer l'indemnité "${deleteModal.libelle}" ?`}
                darkMode={darkMode}
            />
        </div>
    );
};

export default AffichageIndemnitee;