import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { 
  Plus, Trash2, ShieldCheck, List, Calendar, Loader2, AlertCircle, 
  Users, Award, Grid3x3, Hash, DollarSign, Percent, Globe, Target,
  Edit2, CheckCircle, XCircle, Bell, Gift, TrendingUp, Settings,
  Sparkles, Eye, EyeOff, Zap, CreditCard, Wallet, BadgeCheck,
  Moon, Sun, Menu, X, Search
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';

const IndemniteManagement = () => {
    const { showNotification } = useNotification();
    const { darkMode, toggleDarkMode } = useTheme();
    
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedYearId, setSelectedYearId] = useState(null);
    const [configData, setConfigData] = useState(null);
    const [indemnites, setIndemnites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedEchelle, setSelectedEchelle] = useState(null);
    const [selectedEchelon, setSelectedEchelon] = useState(null);
    const [salaryValue, setSalaryValue] = useState(0);
    const [indexValue, setIndexValue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const [form, setForm] = useState({
        libelle: '',
        type: 'Fixe',
        valeur: '',
        role_id: '',
        grade_id: '',
        echelle_id: '',
        echelon_id: '',
        is_for_all: false
    });

    // Dark mode classes
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gradient-to-br from-gray-50 via-gray-50 to-indigo-50/20';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-100';
    const cardHeaderClass = darkMode ? 'bg-gradient-to-r from-indigo-800 to-purple-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const inputClass = darkMode ? 'bg-[#252525] border-[#333] text-white focus:border-indigo-500' : 'bg-gray-50/50 border-gray-200 focus:border-indigo-400';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-white border-gray-200';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-100';
    const hoverClass = darkMode ? 'hover:bg-[#252525]' : 'hover:bg-indigo-50/30';
    const badgeFixeClass = darkMode ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700';
    const badgePercentClass = darkMode ? 'bg-amber-900/50 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-700';

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        if (selectedYearId) {
            fetchYearConfig();
            fetchIndemnites();
        }
    }, [selectedYearId]);

    const fetchYears = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/gestionEtat/years');
            setYears(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            showNotification("❌ Erreur chargement des années", "error");
            setYears([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchYearConfig = async () => {
        try {
            const res = await api.get(`/api/gestionEtat/get-by-year/${selectedYear}`);
            setConfigData(res.data);
        } catch (err) { 
            showNotification("❌ Erreur chargement configuration", "error");
        }
    };

    const fetchIndemnites = async () => {
        try {
            const res = await api.get(`/api/gestionEtat/gestionindemnites/${selectedYearId}`);
            setIndemnites(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            setIndemnites([]); 
        }
    };

    const handleYearChange = (e) => {
        const yearValue = e.target.value;
        setSelectedYear(yearValue);
        const yearObj = years.find(y => y.year == yearValue);
        setSelectedYearId(yearObj?.id || null);
        if (yearValue) {
            showNotification(`📅 Année ${yearValue} sélectionnée`, "info");
        }
    };

    const handleRoleChange = (roleId) => {
        setForm({ ...form, role_id: roleId, grade_id: '', echelle_id: '', echelon_id: '' });
        const role = configData?.roles?.find(r => r.id == roleId);
        setSelectedRole(role);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setSelectedEchelon(null);
        setSalaryValue(0);
        setIndexValue(0);
    };

    const handleGradeChange = (gradeId) => {
        setForm({ ...form, grade_id: gradeId, echelle_id: '', echelon_id: '' });
        const grade = selectedRole?.grades?.find(g => g.id == gradeId);
        setSelectedGrade(grade);
        setSelectedEchelle(null);
        setSelectedEchelon(null);
        setSalaryValue(0);
        setIndexValue(0);
    };

    const handleEchelleChange = (echelleId) => {
        setForm({ ...form, echelle_id: echelleId, echelon_id: '' });
        const echelle = selectedGrade?.echelles?.find(e => e.id == echelleId);
        setSelectedEchelle(echelle);
        setSelectedEchelon(null);
        
        if (echelle?.echelons?.length > 0) {
            setSalaryValue(echelle.echelons[0].salary);
            setIndexValue(echelle.echelons[0].index_val);
        }
    };

    const handleEchelonChange = (echelonId) => {
        setForm({ ...form, echelon_id: echelonId });
        const echelon = selectedEchelle?.echelons?.find(e => e.id == echelonId);
        setSelectedEchelon(echelon);
        if (echelon) {
            setSalaryValue(echelon.salary);
            setIndexValue(echelon.index_val);
        }
    };

    const resetForm = () => {
        setForm({
            libelle: '',
            type: 'Fixe',
            valeur: '',
            role_id: '',
            grade_id: '',
            echelle_id: '',
            echelon_id: '',
            is_for_all: false
        });
        setSelectedRole(null);
        setSelectedGrade(null);
        setSelectedEchelle(null);
        setSelectedEchelon(null);
        setSalaryValue(0);
        setIndexValue(0);
        showNotification("Formulaire réinitialisé", "info");
    };

    const handleSave = async () => {
        if (!form.libelle || !form.valeur) {
            showNotification("⚠️ Veuillez remplir le libellé et la valeur", "warning");
            return;
        }

        if (!form.is_for_all && !form.role_id) {
            showNotification("⚠️ Veuillez sélectionner un rôle ou activer 'Pour tous'", "warning");
            return;
        }

        setLoading(true);
        try {
            const payload = { 
                ...form, 
                salary_year_id: selectedYearId,
                valeur: parseFloat(form.valeur)
            };
            
            const res = await api.post('/api/gestionEtat/gestionindemnites', payload);
            setIndemnites([res.data.data, ...indemnites]);
            
            showNotification(`✨ Indemnité "${form.libelle}" ajoutée avec succès!`, "success");
            resetForm();
            
        } catch (err) { 
            console.error(err);
            showNotification("❌ Erreur lors de l'enregistrement", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, libelle) => {
        if (window.confirm(`Supprimer l'indemnité "${libelle}" ?`)) {
            try {
                await api.delete(`/api/gestionEtat/gestionindemnites/${id}`);
                setIndemnites(indemnites.filter(i => i.id !== id));
                showNotification(`🗑️ Indemnité "${libelle}" supprimée`, "warning");
            } catch (err) {
                showNotification("❌ Erreur lors de la suppression", "error");
            }
        }
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
            return <span className={`${badgeFixeClass} px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit shadow-sm`}><Wallet size={10}/> Fixe</span>;
        }
        return <span className={`${badgePercentClass} px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 w-fit shadow-sm`}><TrendingUp size={10}/> Pourcentage</span>;
    };

    // Filtrer les indemnités
    const filteredIndemnites = indemnites.filter(item => {
        const matchesSearch = item.libelle.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || item.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className={`min-h-screen transition-all duration-300 ${bgClass}`}>
            <div className="container mx-auto p-4 md:p-6 max-w-5xl">
                
                {/* Header */}
                <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} p-4 md:p-5 mb-6 sticky top-0 z-20 backdrop-blur-sm`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`${cardHeaderClass} p-3 rounded-2xl shadow-lg`}>
                                <Gift className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className={`font-bold text-xl md:text-2xl tracking-tight flex items-center gap-2 ${textClass}`}>
                                    Indemnités & Primes
                                    <BadgeCheck size={18} className="text-indigo-500" />
                                </h2>
                                <p className={`text-xs ${textMutedClass} mt-0.5`}>Configuration des primes par hiérarchie</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={toggleDarkMode}
                                className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-[#252525] text-yellow-500 border border-[#333]' : 'bg-gray-100 text-gray-600 border border-gray-200'} hover:scale-105`}
                                title={darkMode ? "Mode clair" : "Mode sombre"}
                            >
                                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                            </button>
                            
                            <div className="relative">
                                <select 
                                    value={selectedYear}
                                    onChange={handleYearChange}
                                    className={`p-3 pl-10 pr-10 rounded-xl font-bold outline-none cursor-pointer min-w-[180px] appearance-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                >
                                    <option value="">-- Année --</option>
                                    {years.map(y => (
                                        <option key={y.id} value={y.year}>{y.year}</option>
                                    ))}
                                </select>
                                <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {selectedYear && configData ? (
                    <>
                        {/* Formulaire */}
                        <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} overflow-hidden mb-6`}>
                            <div className={`${cardHeaderClass} px-5 py-4`}>
                                <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider">
                                    <Sparkles size={16} />
                                    Nouvelle Indemnité
                                </h3>
                            </div>
                            
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Colonne gauche */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block uppercase tracking-wider`}>Libellé *</label>
                                            <input 
                                                placeholder="ex: Prime de transport, Indemnité de logement..."
                                                className={`w-full p-3 border-2 rounded-xl outline-none transition-all ${inputClass} ${borderClass}`}
                                                value={form.libelle}
                                                onChange={e => setForm({...form, libelle: e.target.value})}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block uppercase tracking-wider`}>Type</label>
                                                <select 
                                                    className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                    value={form.type}
                                                    onChange={e => setForm({...form, type: e.target.value})}
                                                >
                                                    <option value="Fixe">💰 Fixe (MAD)</option>
                                                    <option value="Pourcentage">📈 Pourcentage (%)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block uppercase tracking-wider`}>Valeur</label>
                                                <input 
                                                    type="number" 
                                                    placeholder="0"
                                                    className={`w-full p-3 border-2 rounded-xl outline-none transition-all ${inputClass} ${borderClass}`}
                                                    value={form.valeur}
                                                    onChange={e => setForm({...form, valeur: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <div 
                                            className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${form.is_for_all ? 'border-indigo-500 bg-indigo-500/10' : borderClass} ${hoverClass}`}
                                            onClick={() => {
                                                setForm({
                                                    ...form, 
                                                    is_for_all: !form.is_for_all, 
                                                    role_id: '', 
                                                    grade_id: '', 
                                                    echelle_id: '', 
                                                    echelon_id: ''
                                                });
                                                setSelectedRole(null);
                                                setSelectedGrade(null);
                                                setSelectedEchelle(null);
                                                setSelectedEchelon(null);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl transition-all ${form.is_for_all ? 'bg-indigo-500 text-white' : darkMode ? 'bg-[#252525] text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                                                    <Globe size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-bold text-sm ${textClass}`}>Appliquer à tous</p>
                                                    <p className={`text-[10px] ${textMutedClass}`}>L'indemnité sera attribuée à tous les employés</p>
                                                </div>
                                                {form.is_for_all && (
                                                    <CheckCircle size={20} className="text-indigo-500" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Colonne droite */}
                                    {!form.is_for_all && (
                                        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                            <div>
                                                <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                    <Users size={12}/> Rôle *
                                                </label>
                                                <select 
                                                    className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                    value={form.role_id}
                                                    onChange={(e) => handleRoleChange(e.target.value)}
                                                >
                                                    <option value="">-- Choisir un rôle --</option>
                                                    {configData.roles?.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {selectedRole && selectedRole.grades?.length > 0 && (
                                                <div className="animate-in slide-in-from-left-2 duration-300">
                                                    <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                        <Award size={12}/> Grade (Optionnel)
                                                    </label>
                                                    <select 
                                                        className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                        value={form.grade_id}
                                                        onChange={(e) => handleGradeChange(e.target.value)}
                                                    >
                                                        <option value="">-- Tous les grades --</option>
                                                        {selectedRole.grades.map(g => (
                                                            <option key={g.id} value={g.id}>{g.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {selectedGrade && selectedGrade.echelles?.length > 0 && (
                                                <div className="animate-in slide-in-from-left-2 duration-300">
                                                    <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                        <Grid3x3 size={12}/> Échelle (Optionnel)
                                                    </label>
                                                    <select 
                                                        className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                        value={form.echelle_id}
                                                        onChange={(e) => handleEchelleChange(e.target.value)}
                                                    >
                                                        <option value="">-- Toutes les échelles --</option>
                                                        {selectedGrade.echelles.map(e => (
                                                            <option key={e.id} value={e.id}>Échelle {e.level}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            {selectedEchelle && selectedEchelle.echelons?.length > 0 && (
                                                <div className="animate-in slide-in-from-left-2 duration-300">
                                                    <label className={`text-[11px] font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                        <Hash size={12}/> Échelon (Optionnel)
                                                    </label>
                                                    <select 
                                                        className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                        value={form.echelon_id}
                                                        onChange={(e) => handleEchelonChange(e.target.value)}
                                                    >
                                                        <option value="">-- Tous les échelons --</option>
                                                        {selectedEchelle.echelons.map(e => (
                                                            <option key={e.id} value={e.id}>
                                                                E{e.order} (Indice: {e.index_val} | {e.salary.toLocaleString()} MAD)
                                                            </option>
                                                        ))}
                                                    </select>
                                                    
                                                    {selectedEchelon && (
                                                        <div className={`mt-3 p-3 rounded-xl border ${darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'} animate-in zoom-in duration-300`}>
                                                            <div className="flex justify-between items-center">
                                                                <div>
                                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Salaire de base</p>
                                                                    <p className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{salaryValue.toLocaleString()} MAD</p>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Indice</p>
                                                                    <p className={`font-bold text-lg ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{indexValue}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {selectedRole && selectedRole.grades?.length === 0 && (
                                                <div className={`p-3 rounded-xl border ${darkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                                                    <p className={`text-[10px] flex items-center gap-2 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                                                        <AlertCircle size={12}/>
                                                        Aucun grade configuré pour ce rôle
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button 
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 rounded-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
                                    >
                                        {loading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
                                        {loading ? "Enregistrement..." : "Enregistrer l'indemnité"}
                                    </button>
                                    <button 
                                        onClick={resetForm}
                                        type="button"
                                        className="px-6 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <X size={18} /> Réinitialiser
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Liste des indemnités */}
                        <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} overflow-hidden`}>
                            <div className={`px-5 py-4 border-b ${borderClass} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gradient-to-r from-gray-50 to-indigo-50/30'}`}>
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <h3 className={`font-bold flex items-center gap-2 ${textClass}`}>
                                        <List size={18} className="text-indigo-500"/>
                                        Liste des indemnités
                                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>{filteredIndemnites.length}</span>
                                    </h3>
                                    <div className="flex gap-2">
                                        <div className="relative">
                                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400"/>
                                            <input 
                                                type="text"
                                                placeholder="Rechercher..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className={`pl-7 pr-3 py-1.5 rounded-lg text-xs border ${borderClass} ${inputClass} w-40`}
                                            />
                                        </div>
                                        <select 
                                            value={filterType}
                                            onChange={(e) => setFilterType(e.target.value)}
                                            className={`px-2 py-1.5 rounded-lg text-xs border ${borderClass} ${selectClass} ${textClass}`}
                                        >
                                            <option value="all">Tous</option>
                                            <option value="Fixe">Fixe</option>
                                            <option value="Pourcentage">Pourcentage</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                                {filteredIndemnites.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className={`p-4 rounded-full mb-4 inline-block ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                                            <Gift size={40} className={darkMode ? 'text-gray-600' : 'text-gray-300'} />
                                        </div>
                                        <p className={`text-sm font-medium ${textMutedClass}`}>
                                            {indemnites.length === 0 ? "Aucune indemnité configurée" : "Aucun résultat trouvé"}
                                        </p>
                                        <p className={`text-xs ${textMutedClass} mt-1`}>
                                            {indemnites.length === 0 ? "Utilisez le formulaire ci-dessus pour en ajouter" : "Modifiez vos critères de recherche"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-[#2A2A2A]">
                                        {filteredIndemnites.map((item) => (
                                            <div key={item.id} className={`p-4 transition-all duration-300 ${hoverClass}`}>
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`p-2 rounded-xl ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'}`}>
                                                                <Gift size={14} className="text-indigo-500" />
                                                            </div>
                                                            <span className={`font-semibold ${textClass}`}>{item.libelle}</span>
                                                        </div>
                                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                                            {getTypeBadge(item.type)}
                                                            <div className="flex items-center gap-1">
                                                                {getTargetIcon(item)}
                                                                <span className={`text-xs ${textMutedClass} truncate max-w-[250px]`} title={getTargetText(item)}>
                                                                    {getTargetText(item)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-bold text-indigo-600 dark:text-indigo-400 text-sm ${darkMode ? 'bg-indigo-900/30' : 'bg-indigo-50'} px-3 py-1.5 rounded-lg`}>
                                                            {item.valeur} {item.type === 'Fixe' ? 'MAD' : '%'}
                                                        </span>
                                                        <button 
                                                            onClick={() => handleDelete(item.id, item.libelle)}
                                                            className={`p-2 rounded-xl transition-all ${darkMode ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Résumé */}
                        {indemnites.length > 0 && (
                            <div className={`mt-4 p-4 rounded-xl border ${borderClass} ${darkMode ? 'bg-[#1A1A1A]' : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50'}`}>
                                <h4 className={`text-[10px] font-bold ${textMutedClass} mb-3 flex items-center gap-2 uppercase tracking-wider`}>
                                    <Zap size={12} className="text-indigo-500"/>
                                    Résumé des configurations
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-white/60'}`}>
                                        <p className={`text-[9px] font-bold ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>Total</p>
                                        <p className={`font-black text-lg ${textClass}`}>{indemnites.length}</p>
                                    </div>
                                    <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-white/60'}`}>
                                        <p className={`text-[9px] font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Fixes</p>
                                        <p className={`font-black text-lg ${textClass}`}>{indemnites.filter(i => i.type === 'Fixe').length}</p>
                                    </div>
                                    <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-white/60'}`}>
                                        <p className={`text-[9px] font-bold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Pourcentages</p>
                                        <p className={`font-black text-lg ${textClass}`}>{indemnites.filter(i => i.type === 'Pourcentage').length}</p>
                                    </div>
                                    <div className={`text-center p-2 rounded-lg ${darkMode ? 'bg-[#252525]' : 'bg-white/60'}`}>
                                        <p className={`text-[9px] font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Globales</p>
                                        <p className={`font-black text-lg ${textClass}`}>{indemnites.filter(i => i.is_for_all).length}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className={`h-96 flex flex-col items-center justify-center ${cardClass} rounded-2xl border-2 border-dashed ${borderClass}`}>
                        {loading ? (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="animate-spin text-indigo-500" size={40} />
                                <p className={`text-sm font-medium ${textMutedClass}`}>Chargement des données...</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className={`p-5 rounded-full mb-4 inline-block ${darkMode ? 'bg-[#252525]' : 'bg-indigo-100'}`}>
                                    <Calendar size={40} className="text-indigo-400" />
                                </div>
                                <p className={`text-base font-medium ${textClass}`}>Sélectionnez une année</p>
                                <p className={`text-xs ${textMutedClass} mt-2`}>Pour commencer la configuration des indemnités</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                    height: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: ${darkMode ? '#1A1A1A' : '#f1f1f1'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: linear-gradient(135deg, #6366f1, #a855f7);
                    border-radius: 10px;
                }
                @keyframes slide-in-from-top {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes slide-in-from-left {
                    from {
                        opacity: 0;
                        transform: translateX(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                @keyframes zoom-in {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                .animate-in {
                    animation: slide-in-from-top 0.3s ease-out;
                }
                .slide-in-from-left-2 {
                    animation: slide-in-from-left 0.3s ease-out;
                }
                .zoom-in {
                    animation: zoom-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default IndemniteManagement;