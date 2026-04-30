import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { 
    Gift, Calendar, Loader2, AlertCircle, ArrowLeft, 
    Users, Award, Grid3x3, Hash, Percent, Globe, Wallet, TrendingUp, Eye, 
    CheckCircle, Search, List, ChevronDown
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
    const [filterStatut, setFilterStatut] = useState('all');
    const [isYearOpen, setIsYearOpen] = useState(false);
    const yearRef = useRef(null);

    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = darkMode ? 'bg-[#252525] text-white' : 'bg-gray-50 text-gray-800';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-200';

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

    // Modification ici: Récupérer uniquement les années avec indemnités
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
            showNotification("❌ Erreur chargement des années", "error");
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
        showNotification(`📅 Année ${yearValue} sélectionnée`, "success");
    };

    const getTargetText = (item) => {
        if (item.is_for_all) return "🌍 Tous les employés";
        let target = "";
        if (item.role) target += item.role.name;
        if (item.grade) target += ` / ${item.grade.name}`;
        if (item.echelle) target += ` / Éch. ${item.echelle.level}`;
        if (item.echelon) target += ` / E${item.echelon.order}`;
        return target || "Non spécifié";
    };

    const getTargetIcon = (item) => {
        if (item.is_for_all) return <Globe size={14} className="text-indigo-500"/>;
        if (item.echelon) return <Hash size={14} className="text-purple-500"/>;
        if (item.echelle) return <Grid3x3 size={14} className="text-green-500"/>;
        if (item.grade) return <Award size={14} className="text-blue-500"/>;
        return <Users size={14} className="text-gray-500"/>;
    };

    const getTypeBadge = (type) => {
        if (type === 'Fixe') {
            return <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5"><Wallet size={10}/> Fixe</span>;
        }
        return <span className="bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5"><Percent size={10}/> Pourcentage</span>;
    };

    const filteredIndemnites = indemnites.filter(item => {
        const matchesSearch = item.libelle?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        const matchesStatut = filterStatut === 'all' || (filterStatut === 'active' ? item.statut : !item.statut);
        return matchesSearch && matchesType && matchesStatut;
    });

    const totalFixe = filteredIndemnites.filter(i => i.type === 'Fixe' && i.statut).reduce((sum, i) => sum + (parseFloat(i.valeur) || 0), 0);
    const totalActives = filteredIndemnites.filter(i => i.statut).length;

    return (
        <div className={`min-h-screen transition-all duration-300 ${bgClass}`}>
            <div className="container mx-auto p-4 max-w-7xl">
                
                {/* Header */}
                <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} p-4 mb-6`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'} hover:scale-105`}
                            >
                                <ArrowLeft size={20} className={textClass} />
                            </button>
                            <div>
                                <h2 className={`font-bold text-xl md:text-2xl tracking-tight flex items-center gap-2 ${textClass}`}>
                                    <Eye size={24} className="text-indigo-500" />
                                    Consultation des Indemnités
                                </h2>
                                <p className={`text-sm ${textMutedClass} mt-1`}>Liste des primes et indemnités configurées</p>
                                {years.length === 0 && !loading && (
                                    <p className={`text-xs text-yellow-500 mt-1`}> Aucune indemnité configurée</p>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="relative" ref={yearRef}>
                                <button 
                                    onClick={() => setIsYearOpen(!isYearOpen)}
                                    disabled={years.length === 0}
                                    className={`h-10 px-4 rounded-xl font-medium outline-none cursor-pointer min-w-[140px] transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400 ${years.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="truncate">{selectedYear || 'Sélectionner année'}</span>
                                    <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isYearOpen && years.length > 0 && (
                                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${cardClass} z-50 max-h-60 overflow-y-auto shadow-xl animate-fadeIn`}>
                                        <div 
                                            onClick={() => {
                                                handleYearChange('');
                                                setIsYearOpen(false);
                                            }}
                                            className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${!selectedYear ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}
                                        >
                                            -- Année --
                                        </div>
                                        {years.map(y => (
                                            <div 
                                                key={y.id}
                                                onClick={() => {
                                                    handleYearChange(y.year, y.id);
                                                    setIsYearOpen(false);
                                                }}
                                                className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${selectedYear == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}
                                            >
                                                {y.year}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {selectedYear ? (
                    <>
                        {/* Statistiques */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className={`${cardClass} rounded-xl p-4 border ${borderClass}`}>
                                <div className="flex items-center justify-between">
                                    <div><p className={`text-[10px] font-bold uppercase ${textMutedClass}`}>Total Indemnités</p><p className={`text-2xl font-black ${textClass}`}>{filteredIndemnites.length}</p></div>
                                    <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-xl"><Gift size={20} className="text-indigo-500" /></div>
                                </div>
                            </div>
                            <div className={`${cardClass} rounded-xl p-4 border ${borderClass}`}>
                                <div className="flex items-center justify-between">
                                    <div><p className={`text-[10px] font-bold uppercase ${textMutedClass}`}>Actives</p><p className={`text-2xl font-black ${textClass}`}>{totalActives}</p></div>
                                    <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-xl"><CheckCircle size={20} className="text-emerald-500" /></div>
                                </div>
                            </div>
                            <div className={`${cardClass} rounded-xl p-4 border ${borderClass}`}>
                                <div className="flex items-center justify-between">
                                    <div><p className={`text-[10px] font-bold uppercase ${textMutedClass}`}>Masse Fixe</p><p className={`text-2xl font-black ${textClass}`}>{totalFixe.toLocaleString()} MAD</p></div>
                                    <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl"><Wallet size={20} className="text-amber-500" /></div>
                                </div>
                            </div>
                            <div className={`${cardClass} rounded-xl p-4 border ${borderClass}`}>
                                <div className="flex items-center justify-between">
                                    <div><p className={`text-[10px] font-bold uppercase ${textMutedClass}`}>% Actifs</p><p className={`text-2xl font-black ${textClass}`}>{indemnites.filter(i => i.type === 'Pourcentage' && i.statut).length}</p></div>
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl"><Percent size={20} className="text-purple-500" /></div>
                                </div>
                            </div>
                        </div>

                        {/* Filtres */}
                        <div className={`${cardClass} rounded-xl border ${borderClass} p-4 mb-6`}>
                            <div className="flex flex-wrap items-center gap-4">
                                <div className="relative">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`pl-9 pr-3 py-2 rounded-xl text-sm border ${borderClass} ${inputClass} w-56`} />
                                </div>
                                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={`px-3 py-2 rounded-xl text-sm border ${borderClass} ${selectClass} ${textClass}`}>
                                    <option value="all">Tous types</option>
                                    <option value="Fixe">Fixe</option>
                                    <option value="Pourcentage">Pourcentage</option>
                                </select>
                                <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)} className={`px-3 py-2 rounded-xl text-sm border ${borderClass} ${selectClass} ${textClass}`}>
                                    <option value="all">Tous statuts</option>
                                    <option value="active">Actifs</option>
                                    <option value="inactive">Inactifs</option>
                                </select>
                            </div>
                        </div>

                        {/* Liste */}
                        <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} overflow-hidden`}>
                            <div className={`px-6 py-4 border-b ${borderClass} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gray-50'}`}>
                                <h3 className={`font-bold flex items-center gap-2 ${textClass}`}>
                                    <List size={18} className="text-indigo-500"/>
                                    Indemnités - {selectedYear}
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>{filteredIndemnites.length}</span>
                                </h3>
                            </div>
                            <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                {filteredIndemnites.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className={`p-4 rounded-full mb-4 inline-block ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'}`}><Gift size={40} className={darkMode ? 'text-gray-600' : 'text-gray-300'} /></div>
                                        <p className={`text-sm font-medium ${textMutedClass}`}>Aucune indemnité trouvée</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                                        {filteredIndemnites.map((item) => (
                                            <div key={item.id} className={`p-4 transition-all duration-200 ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'}`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}><Gift size={14} className="text-indigo-500" /></div>
                                                            <span className={`font-semibold ${textClass}`}>{item.libelle}</span>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full ${item.statut ? 'bg-emerald-500/20 text-emerald-600' : 'bg-red-500/20 text-red-600'}`}>{item.statut ? 'ACTIF' : 'INACTIF'}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {getTypeBadge(item.type)}
                                                            <div className="flex items-center gap-1">
                                                                {getTargetIcon(item)}
                                                                <span className={`text-xs ${textMutedClass} truncate max-w-[250px]`}>{getTargetText(item)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-indigo-600 dark:text-indigo-400 text-sm ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'} px-3 py-1.5 rounded-lg`}>
                                                            {item.valeur} {item.type === 'Fixe' ? 'MAD' : '%'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className={`h-96 flex flex-col items-center justify-center ${cardClass} rounded-2xl border-2 border-dashed ${borderClass}`}>
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-indigo-500" size={40} />
                                <p className={`text-sm font-medium ${textMutedClass}`}>Chargement des données...</p>
                            </div>
                        ) : years.length === 0 ? (
                            <div className="text-center">
                                <div className={`p-5 rounded-full mb-4 inline-block ${darkMode ? 'bg-[#252525]' : 'bg-indigo-100'}`}>
                                    <Gift size={40} className="text-indigo-400" />
                                </div>
                                <p className={`text-base font-medium ${textClass}`}>Aucune indemnité configurée</p>
                                <p className={`text-sm ${textMutedClass} mt-2`}>Commencez par configurer des indemnités dans "Paramétrage"</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className={`p-5 rounded-full mb-4 inline-block ${darkMode ? 'bg-[#252525]' : 'bg-indigo-100'}`}>
                                    <Calendar size={40} className="text-indigo-400" />
                                </div>
                                <p className={`text-base font-medium ${textClass}`}>Sélectionnez une année</p>
                                <p className={`text-sm ${textMutedClass} mt-2`}>Pour consulter les indemnités configurées</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
                .custom-scrollbar::-webkit-scrollbar { width: 5px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: ${darkMode ? '#2A2A2A' : '#E5E7EB'}; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(135deg, #6366f1, #a855f7); border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default AffichageIndemnitee;