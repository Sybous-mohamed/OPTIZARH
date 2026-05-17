import React, { useState, useEffect, useRef } from 'react';
import {
    Save, Trash2, Plus, Loader2, X,
    Calendar, Percent, Shield, ChevronDown,
    AlertCircle, CheckCircle2, XCircle, Eye, EyeOff,
    TrendingUp, ArrowLeft
} from 'lucide-react';
import axiosClient from "../../../lib/apis/axiosConfig";
import { useNotification } from '../../../context/NotificationContext';
import { useTheme } from '../../../context/ThemeContext';
import DeleteConfirmModal from '../../../lib/components/DeleteConfirmModal';

/* ─── Design tokens — same palette as other pages ─── */
function useTokens(dark) {
    return dark ? {
        page:      'bg-[#0D0D0D]',
        card:      'bg-[#1A1A1A]',
        surface:   'bg-[#252525]',
        deep:      'bg-[#1E1E1E]',
        border:    'border-[#2A2A2A]',
        borderSub: 'border-[#333]',
        divider:   'divide-[#2A2A2A]',
        text:      'text-gray-100',
        textSub:   'text-gray-400',
        textMuted: 'text-gray-600',
        hover:     'hover:bg-[#252525]',
        inputBg:   'bg-[#252525] border-[#333] text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20',
    } : {
        page:      'bg-slate-50',
        card:      'bg-white',
        surface:   'bg-slate-50',
        deep:      'bg-slate-100',
        border:    'border-slate-200',
        borderSub: 'border-slate-200',
        divider:   'divide-slate-100',
        text:      'text-slate-900',
        textSub:   'text-slate-500',
        textMuted: 'text-slate-400',
        hover:     'hover:bg-slate-50',
        inputBg:   'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-indigo-500/20',
    };
}

const mkInput = (T, hasError = false) =>
    `w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 font-medium
     ${hasError ? 'border-rose-500 focus:ring-rose-500/20 bg-rose-500/5' : T.inputBg}`;

export default function AssuranceManagement() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    const T = useTokens(darkMode);

    const [loading, setLoading]                 = useState(false);
    const [annees, setAnnees]                   = useState([]);
    const [selectedAnnee, setSelectedAnnee]     = useState('');
    const [selectedAnneeId, setSelectedAnneeId] = useState(null);
    const [assurancesList, setAssurancesList]   = useState([]);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [expandedId, setExpandedId]           = useState(null);
    const [errors, setErrors]                   = useState({});
    const [isYearOpen, setIsYearOpen]           = useState(false);
    const [deleteModal, setDeleteModal]         = useState({ isOpen: false, id: null, name: '', isNew: false });
    const yearRef                               = useRef(null);

    // Dark mode classes pour le sélecteur
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const selectClass = darkMode ? 'bg-[#252525] border-[#333] text-white' : 'bg-gray-50 border-gray-200 text-gray-800';

    /* ── close year dropdown on outside click ── */
    useEffect(() => {
        const h = (e) => { if (yearRef.current && !yearRef.current.contains(e.target)) setIsYearOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    /* ── fetch years + auto-select ── */
    useEffect(() => {
        const load = async () => {
            try {
                const res  = await axiosClient.get('/api/assurances/annees');
                const data = res.data || [];
                setAnnees(data);
                if (!data.length) return;

                const saved = localStorage.getItem('assurance_year');
                if (saved && data.some(a => String(a.year) === saved)) {
                    setSelectedAnnee(saved); 
                    return;
                }
                const now   = new Date().getFullYear();
                const match = data.find(a => a.year === now);
                const pick  = match || data[data.length - 1];
                setSelectedAnnee(String(pick.year));
                localStorage.setItem('assurance_year', String(pick.year));
            } catch {
                showNotification("Erreur chargement des années", "error");
            }
        };
        load();
    }, []);

    const handleYearSelect = (year) => {
        setSelectedAnnee(String(year));
        localStorage.setItem('assurance_year', String(year));
        setIsYearOpen(false);
    };

    /* ── fetch config ── */
    const fetchConfig = async (year) => {
        if (!year) return;
        setLoading(true);
        try {
            const res = await axiosClient.get(`/api/assurances/get-by-year/${year}`);
            setAssurancesList(res.data.assurances || []);
            setSelectedAnneeId(res.data.annee_id);
            setHasUnsavedChanges(false);
            setErrors({});
        } catch {
            setAssurancesList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { if (selectedAnnee) fetchConfig(selectedAnnee); }, [selectedAnnee]);

    /* ── validation ── */
    const validateTaux = (val) => {
        const n = parseFloat(val);
        if (isNaN(n) || n < 0) return 0;
        if (n > 100) { showNotification("Le taux ne peut pas dépasser 100%", "warning"); return 100; }
        return n;
    };

    const validatePlafond = (val) => {
        if (val === '' || val === null) return null;
        const n = parseFloat(val);
        return (isNaN(n) || n < 0) ? null : n;
    };

    const getErr = (id, field) => errors[`${id}_${field}`];

    /* ── add ── */
    const addAssurance = () => {
        const item = {
            id: Date.now(),
            name: '',
            is_active: true,
            taux_salarie: 0,
            plafond_mensuel: null,
            _isNew: true,
        };
        setAssurancesList(prev => [...prev, item]);
        setExpandedId(item.id);
        setHasUnsavedChanges(true);
    };

    /* ── update ── */
    const updateAssurance = (id, field, value) => {
        let v = value;
        if (field === 'taux_salarie')    v = validateTaux(value);
        if (field === 'plafond_mensuel') v = validatePlafond(value);

        setAssurancesList(prev => prev.map(a => {
            if (a.id !== id) return a;
            if (errors[`${id}_${field}`]) setErrors(e => ({ ...e, [`${id}_${field}`]: null }));
            return { ...a, [field]: v };
        }));
        setHasUnsavedChanges(true);
    };

    /* ── delete ── */
    const openDeleteModal  = (id, name, isNew) => setDeleteModal({ isOpen: true, id, name, isNew });
    const closeDeleteModal = () => setDeleteModal({ isOpen: false, id: null, name: '', isNew: false });

    const confirmDelete = async () => {
        const { id, isNew } = deleteModal;
        if (!isNew) {
            setLoading(true);
            try {
                await axiosClient.delete(`/api/assurances/assurance/${id}`);
                setAssurancesList(prev => prev.filter(a => a.id !== id));
                showNotification("Assurance supprimée", "success");
            } catch { showNotification("Erreur suppression", "error"); }
            finally { setLoading(false); }
        } else {
            setAssurancesList(prev => prev.filter(a => a.id !== id));
        }
        setHasUnsavedChanges(true);
        closeDeleteModal();
    };

    /* ── validate all ── */
    const validateAll = () => {
        const errs = {};
        for (const a of assurancesList) {
            if (!a.name?.trim())                                errs[`${a.id}_name`]        = "Nom requis";
            if (a.taux_salarie < 0 || a.taux_salarie > 100)    errs[`${a.id}_taux_salarie`] = "0–100%";
            if (a.plafond_mensuel !== null && a.plafond_mensuel < 0) errs[`${a.id}_plafond`] = "Positif requis";
        }
        setErrors(errs);
        if (Object.keys(errs).length) { showNotification("Corrigez les erreurs avant de sauvegarder", "error"); return false; }
        return true;
    };

    /* ── save ── */
    const handleSave = async () => {
        if (!validateAll()) return;
        setLoading(true);
        try {
            await axiosClient.post('/api/assurances/store', {
                annee: parseInt(selectedAnnee),
                assurances: assurancesList.map(a => ({
                    name:            a.name,
                    is_active:       a.is_active,
                    taux_salarie:    a.taux_salarie    || 0,
                    plafond_mensuel: a.plafond_mensuel || null,
                })),
            });
            showNotification(`Configuration ${selectedAnnee} enregistrée`, "success");
            setHasUnsavedChanges(false);
            fetchConfig(selectedAnnee);
        } catch (err) {
            showNotification(err.response?.data?.error || "Erreur lors de la sauvegarde", "error");
        } finally { setLoading(false); }
    };

    const cancelChanges = () => { fetchConfig(selectedAnnee); showNotification("Modifications annulées", "info"); };

    /* ── derived stats ── */
    const activeCount    = assurancesList.filter(a => a.is_active).length;
    const avgTaux        = assurancesList.length
        ? (assurancesList.reduce((s, a) => s + (a.taux_salarie || 0), 0) / assurancesList.length).toFixed(1)
        : 0;
    const withPlafond    = assurancesList.filter(a => a.plafond_mensuel).length;

    /* ─── RENDER ─── */
    return (
        <div className={`min-h-screen ${T.page} font-sans`}>
            {/* top accent */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />

            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">

                {/* ══ HEADER ══ */}
                <div className={`${T.card} rounded-2xl border ${T.border} overflow-hidden shadow-sm`}>
                    <div className="h-[3px] w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 opacity-90" />
                    <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                        {/* Title */}
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                <Shield size={17} className="text-indigo-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 mb-0.5">
                                    <h1 className={`text-base font-bold tracking-tight ${T.text}`}>Assurances Sociales</h1>
                                    {hasUnsavedChanges && (
                                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                            Non sauvegardé
                                        </span>
                                    )}
                                </div>
                                <p className={`text-xs ${T.textSub}`}>
                                    Taux salarié & plafonds de cotisation
                                    {selectedAnnee && <span className="ml-2 text-indigo-400 font-semibold">· {selectedAnnee}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            {/* Year picker - Style identique aux autres pages */}
                            <div className="relative" ref={yearRef}>
                                <button 
                                    onClick={() => setIsYearOpen(!isYearOpen)}
                                    className={`h-10 px-4 rounded-xl font-medium outline-none cursor-pointer min-w-[140px] transition-all ${selectClass} border ${borderClass} text-sm flex items-center justify-between gap-3 hover:border-indigo-400`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-indigo-500" />
                                        <span className="truncate">{selectedAnnee || 'Sélectionner année'}</span>
                                    </div>
                                    <ChevronDown size={16} className={`text-indigo-500 transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {isYearOpen && (
                                    <div className={`relative top-full left-0 right-0 mt-2 rounded-xl border ${borderClass} ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white z-index border-gray-200'} z-50 max-h-60 overflow-y-auto shadow-xl animate-fadeIn`}>
                                        {annees.map(a => {
                                            const isActive = String(a.year) === selectedAnnee;
                                            return (
                                                <div 
                                                    key={a.id}
                                                    onClick={() => handleYearSelect(a.year)}
                                                    className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors flex justify-between items-center 
                                                        ${isActive ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                                >
                                                    <span>{a.year}</span>
                                                    {isActive && <CheckCircle2 size={14} className="text-indigo-500" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Add button */}
                            <button
                                onClick={addAssurance}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-sm font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
                            >
                                <Plus size={14} /> Nouvelle assurance
                            </button>
                        </div>
                    </div>
                </div>

                {/* ══ STATS ══ */}
                {assurancesList.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: 'Total',       value: assurancesList.length, color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  icon: Shield       },
                            { label: 'Actives',     value: activeCount,           color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
                            { label: 'Taux moy.',   value: `${avgTaux}%`,         color: 'text-violet-400',  bg: 'bg-violet-500/10',  icon: Percent      },
                            { label: 'Avec plafond',value: withPlafond,           color: 'text-blue-400',    bg: 'bg-blue-500/10',    icon: TrendingUp   },
                        ].map(({ label, value, color, bg, icon: Icon }) => (
                            <div key={label} className={`${T.card} rounded-2xl border ${T.border} p-4 flex items-center gap-3 shadow-sm`}>
                                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon size={15} className={color} />
                                </div>
                                <div>
                                    <p className={`text-[10px] uppercase tracking-widest font-bold ${T.textMuted}`}>{label}</p>
                                    <p className={`text-lg font-bold tabular-nums ${color}`}>{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ══ LIST ══ */}
                <div className="space-y-3">
                    {loading && assurancesList.length === 0 ? (
                        <div className={`${T.card} rounded-2xl border ${T.border} py-16 flex flex-col items-center gap-3`}>
                            <Loader2 size={28} className="animate-spin text-indigo-400" />
                            <p className={`text-sm ${T.textSub}`}>Chargement…</p>
                        </div>

                    ) : assurancesList.length === 0 ? (
                        <div className={`${T.card} rounded-2xl border-2 border-dashed ${T.border} py-16 flex flex-col items-center gap-4`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${T.surface}`}>
                                <Shield size={24} className={`${T.textMuted} opacity-40`} />
                            </div>
                            <div className="text-center">
                                <p className={`text-sm font-semibold ${T.textSub} mb-1`}>Aucune assurance pour {selectedAnnee}</p>
                                <p className={`text-xs ${T.textMuted} opacity-70`}>Commencez par ajouter une assurance</p>
                            </div>
                            <button onClick={addAssurance} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/20">
                                <Plus size={14} /> Ajouter une assurance
                            </button>
                        </div>

                    ) : (
                        assurancesList.map((assurance) => {
                            const isExpanded  = expandedId === assurance.id;
                            const nameErr     = getErr(assurance.id, 'name');
                            const tauxErr     = getErr(assurance.id, 'taux_salarie');
                            const plafondErr  = getErr(assurance.id, 'plafond');

                            return (
                                <div key={assurance.id}
                                    className={`${T.card} rounded-2xl border ${T.border} overflow-hidden shadow-sm transition-all duration-200 ${!assurance.is_active ? 'opacity-60' : ''}`}>

                                    {/* ── Card header ── */}
                                    <div
                                        className={`px-5 py-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer transition-colors ${T.hover}`}
                                        onClick={() => setExpandedId(isExpanded ? null : assurance.id)}
                                    >
                                        {/* Left: status icon + name */}
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${assurance.is_active ? 'bg-emerald-500/10' : `${T.surface}`}`}>
                                                {assurance.is_active
                                                    ? <CheckCircle2 size={16} className="text-emerald-400" />
                                                    : <XCircle size={16} className={T.textMuted} />}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <input
                                                        type="text"
                                                        value={assurance.name}
                                                        placeholder="Nom de l'assurance"
                                                        onClick={e => e.stopPropagation()}
                                                        onChange={e => { e.stopPropagation(); updateAssurance(assurance.id, 'name', e.target.value); }}
                                                        className={`bg-transparent outline-none font-semibold text-sm border-b transition-colors min-w-[160px] max-w-xs
                                                            ${nameErr ? 'border-rose-500 text-rose-400' : `border-transparent focus:border-indigo-500 ${T.text}`}`}
                                                    />
                                                    {nameErr && <span className="flex items-center gap-1 text-[10px] text-rose-400"><AlertCircle size={9} />{nameErr}</span>}
                                                    {assurance._isNew && (
                                                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold uppercase tracking-wide">
                                                            Nouveau
                                                        </span>
                                                    )}
                                                </div>
                                                <p className={`text-[10px] mt-0.5 ${T.textMuted}`}>Cotisation salariale</p>
                                            </div>
                                        </div>

                                        {/* Right: taux + toggle + actions */}
                                        <div className="flex items-center gap-4 flex-shrink-0" onClick={e => e.stopPropagation()}>

                                            {/* Taux salarié */}
                                            <div className="text-right">
                                                <p className={`text-[10px] font-bold uppercase tracking-wide ${T.textMuted} mb-1`}>Taux salarié</p>
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number" step="0.1" min="0" max="100"
                                                        value={assurance.taux_salarie ?? 0}
                                                        onChange={e => updateAssurance(assurance.id, 'taux_salarie', parseFloat(e.target.value))}
                                                        className={`w-16 text-right font-bold text-sm bg-transparent outline-none border-b-2 transition-colors
                                                            ${tauxErr ? 'border-rose-500 text-rose-400' : `border-transparent focus:border-indigo-500 ${T.text}`}`}
                                                    />
                                                    <span className={`text-xs font-semibold ${T.textMuted}`}>%</span>
                                                </div>
                                                {tauxErr && <p className="text-[9px] text-rose-400 mt-0.5">{tauxErr}</p>}
                                            </div>

                                            {/* Active toggle */}
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <div className="relative">
                                                    <input type="checkbox" checked={assurance.is_active}
                                                        onChange={e => updateAssurance(assurance.id, 'is_active', e.target.checked)}
                                                        className="sr-only peer" />
                                                    <div className={`w-9 h-5 rounded-full transition-all peer-checked:bg-indigo-600 ${darkMode ? 'bg-[#333]' : 'bg-slate-300'}`} />
                                                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 peer-checked:translate-x-4 shadow-sm" />
                                                </div>
                                                <span className={`text-[10px] font-semibold uppercase tracking-wide ${assurance.is_active ? 'text-indigo-400' : T.textMuted}`}>
                                                    {assurance.is_active ? 'Actif' : 'Inactif'}
                                                </span>
                                            </label>

                                            {/* Delete */}
                                            <button
                                                onClick={() => openDeleteModal(assurance.id, assurance.name, assurance._isNew)}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${T.textMuted} hover:bg-rose-500/10 hover:text-rose-400`}
                                            >
                                                <Trash2 size={14} />
                                            </button>

                                            {/* Expand chevron */}
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 cursor-pointer ${T.textMuted} ${isExpanded ? 'rotate-180' : ''}`}
                                                onClick={() => setExpandedId(isExpanded ? null : assurance.id)}>
                                                <ChevronDown size={15} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Expanded: plafond + summary ── */}
                                    {isExpanded && (
                                        <div className={`px-5 py-4 border-t ${T.border} ${T.surface}`}>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                                {/* Plafond mensuel */}
                                                <div className="space-y-1.5">
                                                    <label className={`block text-[10px] font-bold uppercase tracking-widest ${T.textMuted}`}>
                                                        Plafond mensuel
                                                    </label>
                                                    <div className="relative">
                                                        <input
                                                            type="number" step="1000" min="0"
                                                            value={assurance.plafond_mensuel ?? ''}
                                                            placeholder="Sans plafond"
                                                            onChange={e => updateAssurance(assurance.id, 'plafond_mensuel', e.target.value)}
                                                            className={mkInput(T, !!plafondErr) + ' pr-14'}
                                                        />
                                                        <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase ${T.textMuted} pointer-events-none`}>MAD</span>
                                                    </div>
                                                    {plafondErr
                                                        ? <p className={`text-[10px] text-rose-400 flex items-center gap-1`}><AlertCircle size={9}/>{plafondErr}</p>
                                                        : <p className={`text-[10px] ${T.textMuted} opacity-70`}>Laisser vide = aucun plafond</p>
                                                    }
                                                </div>

                                                {/* Summary card */}
                                                <div className={`flex items-center justify-center rounded-xl border ${T.border} ${T.card} p-4`}>
                                                    <div className="text-center">
                                                        <p className={`text-[10px] uppercase tracking-widest font-bold ${T.textMuted} mb-1`}>Taux de retenue</p>
                                                        <p className={`text-3xl font-bold tabular-nums ${assurance.is_active ? 'text-indigo-400' : T.textMuted}`}>
                                                            {Number(assurance.taux_salarie || 0).toFixed(1)}
                                                            <span className="text-base font-semibold ml-0.5">%</span>
                                                        </p>
                                                        <p className={`text-[10px] ${T.textMuted} mt-1`}>prélevé sur le salaire brut</p>
                                                        {assurance.plafond_mensuel && (
                                                            <p className="text-[10px] text-indigo-400 font-semibold mt-1">
                                                                ≤ {Number(assurance.plafond_mensuel).toLocaleString('fr-MA')} MAD / mois
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ══ FLOATING SAVE BAR ══ */}
            {hasUnsavedChanges && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl"
                    style={{ background: darkMode ? '#1A1A1A' : 'white', borderColor: darkMode ? '#2A2A2A' : '#e2e8f0', boxShadow: darkMode ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(0,0,0,0.12)' }}>
                    <span className={`text-xs font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        Modifications non sauvegardées
                    </span>
                    <div className={`w-px h-4 ${darkMode ? 'bg-[#333]' : 'bg-slate-200'}`} />
                    <button onClick={cancelChanges}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${T.border} ${T.text} ${T.hover}`}>
                        <X size={13} /> Annuler
                    </button>
                    <button onClick={handleSave} disabled={loading}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.97] text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/25 disabled:opacity-50">
                        {loading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        {loading ? 'Enregistrement…' : 'Sauvegarder'}
                    </button>
                </div>
            )}

            {/* ══ DELETE MODAL ══ */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={confirmDelete}
                title="Supprimer l'assurance"
                message={`Êtes-vous sûr de vouloir supprimer "${deleteModal.name}" ? Cette action est irréversible.`}
                darkMode={darkMode}
            />
        </div>
    );
}