import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/apis/axiosConfig'; 
import { 
  Plus, Trash2, Calendar, Loader2, AlertCircle, 
  Users, Award, Grid3x3, Hash, Percent, Globe,
  CheckCircle, Gift, TrendingUp, Sparkles, 
  Zap, Wallet, BadgeCheck, X, ChevronDown, ArrowLeft
} from 'lucide-react';
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';

const GestionIndemnitee = () => {
    const { showNotification } = useNotification();
    const { darkMode } = useTheme();
    const navigate = useNavigate();
    
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedYearId, setSelectedYearId] = useState(null);
    const [configData, setConfigData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [selectedEchelle, setSelectedEchelle] = useState(null);
    const [selectedEchelon, setSelectedEchelon] = useState(null);
    const [salaryValue, setSalaryValue] = useState(0);
    const [indexValue, setIndexValue] = useState(0);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const yearRef = useRef(null);

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
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const cardHeaderClass = darkMode ? 'bg-gradient-to-r from-indigo-800 to-purple-800' : 'bg-gradient-to-r from-indigo-600 to-purple-600';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const inputClass = darkMode ? 'bg-[#252525] border-[#333] text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-800';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const hoverClass = darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50';
    const badgeFixeClass = darkMode ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-emerald-100 text-emerald-700';
    const badgePercentClass = darkMode ? 'bg-amber-900/50 text-amber-400 border border-amber-800' : 'bg-amber-100 text-amber-700';

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
            fetchYearConfig();
        }
    }, [selectedYearId]);

    const fetchYears = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/gestionEtat/years');
            const data = Array.isArray(res.data) ? res.data : [];
            setYears(data);
            
            const savedYear = localStorage.getItem('indemnite_selected_year');
            if (savedYear && data.some(y => y.year == savedYear)) {
                setSelectedYear(savedYear);
                const yearObj = data.find(y => y.year == savedYear);
                setSelectedYearId(yearObj?.id);
            } else if (data.length > 0) {
                const lastYear = data[data.length - 1];
                setSelectedYear(lastYear.year);
                setSelectedYearId(lastYear.id);
                localStorage.setItem('indemnite_selected_year', lastYear.year);
            }
        } catch (err) {
            showNotification("❌ Erreur chargement des années", "error");
            setYears([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchYearConfig = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/gestionEtat/get-by-year/${selectedYear}`);
            setConfigData(res.data);
        } catch (err) { 
            showNotification("❌ Erreur chargement configuration", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleYearChange = (yearValue, yearId) => {
        setSelectedYear(yearValue);
        setSelectedYearId(yearId);
        localStorage.setItem('indemnite_selected_year', yearValue);
        showNotification(`📅 Année ${yearValue} sélectionnée`, "success");
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
        showNotification("Formulaire réinitialisé", "success");
    };

    const handleSave = async () => {
        if (!form.libelle || !form.valeur) {
            showNotification(" Veuillez remplir le libellé et la valeur", "error");
            return;
        }

        if (!form.is_for_all && !form.role_id) {
            showNotification(" Veuillez sélectionner un rôle ou activer 'Pour tous'", "error");
            return;
        }

        if (form.type === 'Pourcentage') {
            const valeur = parseFloat(form.valeur);
            if (isNaN(valeur) || valeur <= 0 || valeur > 100) {
                showNotification(" Le pourcentage doit être entre 1% et 100%", "error");
                return;
            }
        }

        if (form.type === 'Fixe') {
            const valeur = parseFloat(form.valeur);
            if (isNaN(valeur) || valeur <= 0) {
                showNotification(" Veuillez entrer un montant valide (supérieur à 0 MAD)", "error");
                return;
            }
        }

        setLoading(true);
        try {
            const payload = { 
                ...form, 
                salary_year_id: selectedYearId,
                valeur: parseFloat(form.valeur)
            };
            
            await api.post('/api/gestionEtat/gestionindemnites', payload);
            showNotification(`✨ Indemnité "${form.libelle}" ajoutée avec succès!`, "success");
            resetForm();
            
        } catch (err) { 
            console.error(err);
            showNotification("❌ Erreur lors de l'enregistrement", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleValeurChange = (e) => {
        let value = e.target.value;
        if (value === '') {
            setForm({...form, valeur: ''});
            return;
        }
        
        let numValue = parseFloat(value);
        if (isNaN(numValue)) {
            setForm({...form, valeur: ''});
            return;
        }
        
        if (form.type === 'Pourcentage') {
            if (numValue < 0) {
                showNotification(" Le pourcentage ne peut pas être négatif", "warning");
                setForm({...form, valeur: 0});
                return;
            }
            if (numValue > 100) {
                showNotification(" Le pourcentage ne peut pas dépasser 100%", "warning");
                setForm({...form, valeur: 100});
                return;
            }
        }
        
        if (form.type === 'Fixe' && numValue < 0) {
            showNotification(" Le montant ne peut pas être négatif", "warning");
            setForm({...form, valeur: 0});
            return;
        }
        
        setForm({...form, valeur: numValue});
    };

    return (
        <div className={`min-h-screen transition-all duration-300 ${bgClass}`}>
            <div className="container p-4 ">
                
                {/* Header */}
                <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} p-4 mb-6 sticky top-0 z-30 backdrop-blur-xl bg-opacity-80 dark:bg-opacity-80`}>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => navigate(-1)}
                                className={`p-2 rounded-xl transition-all cursor-pointer ${darkMode ? 'bg-[#252525] hover:bg-[#333] border border-[#333]' : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'} hover:scale-105`}
                                title="Retour"
                            >
                                <ArrowLeft size={20} className={textClass} />
                            </button>
                            <div>
                                <h2 className={`font-bold text-xl md:text-2xl tracking-tight flex items-center gap-2 ${textClass}`}>
                                    <Gift size={24} className="text-indigo-500" />
                                    Paramétrage des Indemnités
                                </h2>
                                <p className={`text-sm ${textMutedClass} mt-1`}>Configuration des primes et indemnités par hiérarchie</p>
                            </div>
                        </div>
                        
                        <div className="relative" ref={yearRef}>
                            <button 
                                onClick={() => setIsYearOpen(!isYearOpen)}
                                className={`h-10 px-4 rounded-xl font-medium outline-none cursor-pointer min-w-[140px] transition-all ${selectClass} border ${borderClass} ${textClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
                            >
                                <span className="truncate">{selectedYear || 'Sélectionner année'}</span>
                                <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isYearOpen && (
                                <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${cardClass} z-50 max-h-60 overflow-y-auto shadow-xl animate-fadeIn`}>
                                    <div 
                                        onClick={() => {
                                            handleYearChange('');
                                            setIsYearOpen(false);
                                        }}
                                        className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${!selectedYear ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}
                                    >
                                    </div>
                                    {years.map(y => (
                                        <div 
                                            key={y.id}
                                            onClick={() => {
                                                handleYearChange(y.year, y.id);
                                                setIsYearOpen(false);
                                            }}
                                            className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30  dark:text-white text-sm transition-colors ${selectedYear == y.year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : ''}`}>
                                            {y.year}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {selectedYear && configData ? (
                    <div className={`${cardClass} rounded-2xl shadow-xl border ${borderClass} overflow-hidden`}>
                        <div className={`${cardHeaderClass} px-6 py-4`}>
                            <h3 className="flex items-center gap-2 font-bold text-white text-sm uppercase tracking-wider">
                                
                                Nouvelle Indemnité - {selectedYear}
                            </h3>
                        </div>
                        
                        <div className="p-6 space-y-5">
                            <div>
                                <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block uppercase tracking-wider`}>Libellé *</label>
                                <input 
                                    placeholder="ex: Prime de transport, Indemnité de logement..."
                                    className={`w-full p-3 rounded-xl outline-none transition-all ${inputClass} border ${borderClass}`}
                                    value={form.libelle}
                                    onChange={e => setForm({...form, libelle: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block uppercase tracking-wider`}>Type</label>
                                    <select 
                                        className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                        value={form.type}
                                        onChange={e => setForm({...form, type: e.target.value, valeur: ''})}
                                    >
                                        <option value="Fixe">💰 Fixe (MAD)</option>
                                        <option value="Pourcentage">📈 Pourcentage (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block uppercase tracking-wider`}>Valeur</label>
                                    <input 
                                        type="number" 
                                        placeholder={form.type === 'Fixe' ? "0 MAD" : "0 %"}
                                        className={`w-full p-3 rounded-xl outline-none transition-all ${inputClass} border ${borderClass}`}
                                        value={form.valeur}
                                        onChange={handleValeurChange}
                                    />
                                    {form.type === 'Pourcentage' && form.valeur > 0 && (
                                        <p className={`text-[9px] mt-1 ${form.valeur > 100 ? 'text-red-500' : 'text-green-500'}`}>
                                            {form.valeur > 100 ? ' Le pourcentage ne peut pas dépasser 100%' : '✓ Pourcentage valide (0-100%)'}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div 
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${form.is_for_all ? 'border-indigo-500 bg-indigo-500/10' : borderClass} ${hoverClass}`}
                                onClick={() => {
                                    setForm({...form, is_for_all: !form.is_for_all, role_id: '', grade_id: '', echelle_id: '', echelon_id: ''});
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
                                        <p className={`font-semibold text-sm ${textClass}`}>Appliquer à tous les employés</p>
                                        <p className={`text-xs ${textMutedClass}`}>L'indemnité sera attribuée à tous</p>
                                    </div>
                                    {form.is_for_all && <CheckCircle size={20} className="text-indigo-500" />}
                                </div>
                            </div>

                            {!form.is_for_all && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div>
                                        <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                            <Users size={12}/> Rôle *
                                        </label>
                                        <select 
                                            className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                            value={form.role_id}
                                            onChange={(e) => handleRoleChange(e.target.value)}
                                        >
                                            <option value="">-- Choisir un rôle --</option>
                                            {configData?.roles?.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>

                                    {selectedRole && selectedRole.grades?.length > 0 && (
                                        <div className="animate-fadeIn">
                                            <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                <Award size={12}/> Grade (Optionnel)
                                            </label>
                                            <select 
                                                className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                value={form.grade_id}
                                                onChange={(e) => handleGradeChange(e.target.value)}
                                            >
                                                <option value="">-- Tous les grades --</option>
                                                {selectedRole.grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {selectedGrade && selectedGrade.echelles?.length > 0 && (
                                        <div className="animate-fadeIn">
                                            <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                <Grid3x3 size={12}/> Échelle (Optionnel)
                                            </label>
                                            <select 
                                                className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                value={form.echelle_id}
                                                onChange={(e) => handleEchelleChange(e.target.value)}
                                            >
                                                <option value="">-- Toutes les échelles --</option>
                                                {selectedGrade.echelles.map(e => <option key={e.id} value={e.id}>Échelle {e.level}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {selectedEchelle && selectedEchelle.echelons?.length > 0 && (
                                        <div className="animate-fadeIn">
                                            <label className={`text-xs font-bold ${textMutedClass} mb-1.5 block flex items-center gap-1 uppercase tracking-wider`}>
                                                <Hash size={12}/> Échelon (Optionnel)
                                            </label>
                                            <select 
                                                className={`w-full p-3 rounded-xl outline-none transition-all ${selectClass} border ${borderClass} ${textClass}`}
                                                value={form.echelon_id}
                                                onChange={(e) => handleEchelonChange(e.target.value)}
                                            >
                                                <option value="">-- Tous les échelons --</option>
                                                {selectedEchelle.echelons.map(e => (
                                                    <option key={e.id} value={e.id}>E{e.order} (Indice: {e.index_val} | {e.salary.toLocaleString()} MAD)</option>
                                                ))}
                                            </select>
                                            
                                            {selectedEchelon && (
                                                <div className={`mt-3 p-3 rounded-xl border ${darkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'} animate-fadeIn`}>
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
                                            <p className={`text-xs flex items-center gap-2 ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                                                <AlertCircle size={12}/>
                                                Aucun grade configuré pour ce rôle
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={loading}
                                    className=" cursor-pointer flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin"/> : <Plus size={18} />}
                                    {loading ? "Enregistrement..." : "Enregistrer l'indemnité"}
                                </button>
                                <button 
                                    onClick={resetForm}
                                    className=" cursor-pointer px-6 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <X size={18} /> Réinitialiser
                                </button>
                            </div>
                        </div>
                    </div>
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
                                <p className={`text-sm ${textMutedClass} mt-2`}>Pour commencer la configuration des indemnités</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GestionIndemnitee;