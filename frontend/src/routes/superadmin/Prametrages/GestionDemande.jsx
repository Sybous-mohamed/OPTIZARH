import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import api from '../../../lib/apis/axiosConfig';
import {
    Settings, Plus, Trash2, FolderPlus, Loader2,
    ChevronDown, Calendar, AlertCircle, X, Check,
    Layers, Tag, Shield, Hash, Sparkles
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

/* ─────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────── */
function useTokens(dark) {
    return dark ? {
        page:        'bg-black',
        card:        'bg-[#1A1A1A]',
        surface:     'bg-[#252525]',
        surfaceDeep: 'bg-[#1E1E1E]',
        border:      'border-[#2A2A2A]',
        borderSub:   'border-[#333333]',
        divider:     'divide-[#2A2A2A]',
        text:        'text-gray-100',
        textSub:     'text-gray-400',
        textMuted:   'text-gray-600',
        inputCls:    'w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 font-medium bg-[#252525] border-[#333333] text-gray-100 placeholder-gray-600 focus:border-indigo-500 focus:ring-indigo-500/20',
        hover:       'hover:bg-[#252525]/70',
        tableRow:    'hover:bg-[#252525]/50',
        tableAlt:    'bg-[#1E1E1E]/60',
    } : {
        page:        'bg-slate-50',
        card:        'bg-white',
        surface:     'bg-slate-50',
        surfaceDeep: 'bg-slate-100',
        border:      'border-slate-200',
        borderSub:   'border-slate-200',
        divider:     'divide-slate-100',
        text:        'text-slate-900',
        textSub:     'text-slate-500',
        textMuted:   'text-slate-400',
        inputCls:    'w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 font-medium bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-indigo-500/20',
        hover:       'hover:bg-slate-50',
        tableRow:    'hover:bg-slate-50',
        tableAlt:    'bg-slate-50/60',
    };
}

const mkInput = (T) => T.inputCls;

function PageAccent() {
    return <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />;
}

function StatCard({ label, value, icon: Icon, colorText, colorBg, T }) {
    return (
        <div className={`${T.card} rounded-2xl border ${T.border} p-4 flex items-center gap-3.5 shadow-sm`}>
            <div className={`w-10 h-10 rounded-xl ${colorBg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={16} className={colorText} />
            </div>
            <div>
                <p className={`text-[10px] uppercase tracking-widest font-bold ${T.textMuted}`}>{label}</p>
                <p className={`text-xl font-bold tabular-nums ${colorText}`}>{value}</p>
            </div>
        </div>
    );
}

function SectionLabel({ icon: Icon, label, step, accent = 'indigo', T }) {
    const colors = {
        indigo: { bg: 'bg-indigo-500/15', text: 'text-indigo-400' },
        violet: { bg: 'bg-violet-500/15',  text: 'text-violet-400'  },
    };
    const c = colors[accent] || colors.indigo;
    return (
        <div className="flex items-center gap-2.5 mb-5">
            <span className={`w-5 h-5 rounded-full ${c.bg} ${c.text} text-[10px] font-black flex items-center justify-center flex-shrink-0`}>
                {step}
            </span>
            <Icon size={13} className={c.text} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${T.textMuted}`}>{label}</span>
        </div>
    );
}

function Field({ label, suffix, T, children }) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label className={`block text-[10px] font-bold uppercase tracking-widest ${T.textMuted}`}>{label}</label>
            )}
            {suffix ? (
                <div className="relative">
                    {children}
                    <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase ${T.textMuted} pointer-events-none`}>
                        {suffix}
                    </span>
                </div>
            ) : children}
        </div>
    );
}

const SuperAdminConfig = () => {
    const { darkMode } = useTheme();
    const T = useTokens(darkMode);

    const [selectedYearId, setSelectedYearId] = useState('');
    const [years, setYears] = useState([]);
    const [yearsLoading, setYearsLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [toast, setToast] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const yearRef = useRef(null);

    const [newCat, setNewCat] = useState({ name: '', max: 25 });
    const [newType, setNewType] = useState({ categoryId: '', name: '', maxDays: 0 });

    const notify = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const handler = (e) => {
            if (yearRef.current && !yearRef.current.contains(e.target)) {
                setIsYearOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const load = async () => {
            setYearsLoading(true);
            try {
                const res = await api.get('/api/salary-years');
                const data = res.data || [];
                setYears(data);
                if (!data.length) return;

                const saved = localStorage.getItem('rh_config_year_id');
                if (saved && data.some(y => String(y.id) === saved)) {
                    setSelectedYearId(saved);
                    return;
                }
                const now = new Date().getFullYear();
                const match = data.find(y => Number(y.year) === now);
                if (match) {
                    const id = String(match.id);
                    setSelectedYearId(id);
                    localStorage.setItem('rh_config_year_id', id);
                    return;
                }
                const latest = data[data.length - 1];
                const id = String(latest.id);
                setSelectedYearId(id);
                localStorage.setItem('rh_config_year_id', id);
            } catch {
                notify("Erreur chargement des années", "error");
            } finally {
                setYearsLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (selectedYearId) fetchConfig(selectedYearId);
    }, [selectedYearId]);

    const handleYearSelect = (id) => {
        const sid = String(id);
        setSelectedYearId(sid);
        localStorage.setItem('rh_config_year_id', sid);
        setIsYearOpen(false);
    };

    const updateDropdownPosition = () => {
        if (yearRef.current) {
            const rect = yearRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY + 8,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    const fetchConfig = async (yearId) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/leave-config/full/${yearId}`);
            setCategories(res.data);
        } catch {
            notify("Erreur chargement config", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCat.name.trim()) {
            notify("Veuillez saisir un nom de catégorie", "error");
            return;
        }
        try {
            await api.post('/api/leave-config/save-category', {
                salary_year_id: parseInt(selectedYearId),
                category_name: newCat.name,
                annual_global_max: parseInt(newCat.max) || 0,
            });
            fetchConfig(selectedYearId);
            setNewCat({ name: '', max: 25 });
            notify("Catégorie ajoutée avec succès", "success");
        } catch {
            notify("Erreur ajout catégorie", "error");
        }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newType.categoryId) {
            notify("Sélectionnez une catégorie", "error");
            return;
        }
        if (!newType.name.trim()) {
            notify("Veuillez saisir un nom de type", "error");
            return;
        }
        try {
            await api.post('/api/leave-config/types', {
                salary_year_id: selectedYearId,
                leave_category_id: newType.categoryId,
                name: newType.name,
                max_days_per_request: newType.maxDays || 0,
            });
            fetchConfig(selectedYearId);
            setNewType({ categoryId: '', name: '', maxDays: 0 });
            notify("Type de congé ajouté", "success");
        } catch {
            notify("Erreur ajout type", "error");
        }
    };

    const deleteType = async (id, name) => {
        if (!window.confirm(`Confirmer la suppression du type "${name}" ?`)) return;
        try {
            await api.delete(`/api/leave-config/types/${id}`);
            fetchConfig(selectedYearId);
            notify("Type supprimé", "success");
        } catch {
            notify("Erreur suppression", "error");
        }
    };

    const selectedYear = years.find(y => String(y.id) === selectedYearId);
    const totalTypes = categories.reduce((s, c) => s + (c.types?.length || 0), 0);
    const maxCap = categories.length ? Math.max(...categories.map(c => c.annual_global_max || 0)) : 0;

    const accent = (ci) => ci % 2 === 0
        ? {
            stripe: 'from-indigo-500 to-indigo-600',
            icon: 'text-indigo-400',
            iconBg: 'bg-indigo-500/10',
            badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
            numText: 'text-indigo-400',
            dot: 'bg-indigo-500',
          }
        : {
            stripe: 'from-violet-500 to-violet-600',
            icon: 'text-violet-400',
            iconBg: 'bg-violet-500/10',
            badge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
            numText: 'text-violet-400',
            dot: 'bg-violet-500',
          };

    return (
        <div className={`min-h-screen ${T.page} font-sans`}>
            <PageAccent />

            {/* Toast notification
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl text-sm font-semibold
                    ${toast.type === 'error'
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                        : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'}`}
                    style={{ backdropFilter: 'blur(12px)' }}
                >
                    {toast.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
                    {toast.msg}
                    <button onClick={() => setToast(null)} className="ml-1 opacity-50 hover:opacity-100 cursor-pointer">
                        <X size={12} />
                    </button>
                </div>
            )} */}

            <div className="max-w-6xl mx-auto px-2 md:px-3 py-3 space-y-3">

                {/* HEADER CARD */}
                <div className={`${T.card} rounded-2xl border ${T.border} overflow-hidden shadow-sm`}>
                    <div className="h-[3px] w-full bg-gradient-to-r from-indigo-600 via-violet-500 to-indigo-600 opacity-90" />
                    <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                                <Settings size={17} className="text-indigo-400" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5 mb-0.5">
                                    <h1 className={`text-base font-bold tracking-tight ${T.text}`}>Configuration RH</h1>
                                    <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        Super Admin
                                    </span>
                                </div>
                                <p className={`text-xs ${T.textSub}`}>
                                    Catégories et types de congés
                                    {selectedYear && (
                                        <span className="ml-2 text-indigo-400 font-semibold">· {selectedYear.year}</span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Year Picker */}
                        <div className="relative block" ref={yearRef} style={{ position: 'relative', zIndex: 99999 }}>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsYearOpen(!isYearOpen);
                                }}
                                disabled={yearsLoading}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${T.border} ${T.card} ${T.text} text-sm font-semibold cursor-pointer transition-all min-w-[185px] justify-between ${T.hover} disabled:opacity-50`}
                            >
                                <div className="flex items-center gap-2">
                                    {yearsLoading
                                        ? <Loader2 size={13} className="animate-spin text-indigo-400" />
                                        : <Calendar size={13} className="text-indigo-400" />
                                    }
                                    <span>
                                        {yearsLoading
                                            ? 'Chargement…'
                                            : selectedYear ? `Année ${selectedYear.year}` : 'Sélectionner une année'}
                                    </span>
                                </div>
                                <ChevronDown
                                    size={12}
                                    className={`${T.textMuted} transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isYearOpen && (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    className={`absolute left-0 right-0 mt-2 ${T.card} rounded-xl overflow-hidden shadow-2xl`}
                                    style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        background: darkMode ? '#1A1A1A' : 'white',
                                        border: darkMode ? '1px solid #2A2A2A' : '1px solid #e2e8f0',
                                        zIndex: 99999,
                                        maxHeight: '300px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {years.map(y => {
                                        const active = String(y.id) === selectedYearId;
                                        return (
                                            <div
                                                key={y.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    handleYearSelect(y.id);
                                                    setIsYearOpen(false);
                                                }}
                                                className={`w-full px-4 py-2.5 text-sm font-medium transition-all cursor-pointer text-left
                                                    ${active ? 'bg-indigo-500/10 text-indigo-400 font-semibold' : T.text}
                                                    hover:bg-indigo-500/20 hover:text-indigo-400`}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <span>Année {y.year}</span>
                                                    {active && <Check size={12} className="text-indigo-400 flex-shrink-0" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* STATS CARDS */}
                {selectedYearId && !loading && categories.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        <StatCard label="Catégories" value={categories.length} icon={Layers} colorText="text-indigo-400" colorBg="bg-indigo-500/10" T={T} />
                        <StatCard label="Types de congé" value={totalTypes} icon={Tag} colorText="text-violet-400" colorBg="bg-violet-500/10" T={T} />
                        <StatCard label="Plafond max" value={`${maxCap} j`} icon={Shield} colorText="text-emerald-400" colorBg="bg-emerald-500/10" T={T} />
                    </div>
                )}

                {/* MAIN CONTENT */}
                {selectedYearId && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* LEFT FORMS */}
                        <div className="space-y-4">
                            {/* Form: Add Category */}
                            <div className={`${T.card} rounded-2xl border ${T.border} overflow-hidden shadow-sm`}>
                                <div className="h-[3px] w-full bg-gradient-to-r from-indigo-500 to-indigo-600 opacity-80" />
                                <div className="p-5">
                                    <SectionLabel icon={FolderPlus} label="Créer une catégorie" step="1" accent="indigo" T={T} />
                                    <form onSubmit={handleAddCategory} className="space-y-3.5">
                                        <Field label="Nom de la catégorie" T={T}>
                                            <input type="text" placeholder="Ex : Congé annuel" value={newCat.name} onChange={e => setNewCat({ ...newCat, name: e.target.value })} required className={mkInput(T)} />
                                        </Field>
                                        <Field label="Plafond global" suffix="jours" T={T}>
                                            <input type="number" placeholder="25" value={newCat.max} onChange={e => setNewCat({ ...newCat, max: e.target.value })} className={mkInput(T) + ' pr-14'} />
                                        </Field>
                                        <button type="submit" className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20">
                                            <Plus size={14} /> Ajouter la catégorie
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Form: Add Type */}
                            <div className={`${T.card} rounded-2xl border ${T.border} overflow-hidden shadow-sm`}>
                                <div className="h-[3px] w-full bg-gradient-to-r from-violet-500 to-violet-600 opacity-80" />
                                <div className="p-5">
                                    <SectionLabel icon={Tag} label="Lier un type" step="2" accent="violet" T={T} />
                                    <form onSubmit={handleAddType} className="space-y-3.5">
                                        <Field label="Catégorie parente" T={T}>
                                            <select value={newType.categoryId} onChange={e => setNewType({ ...newType, categoryId: e.target.value })} required className={mkInput(T) + ' cursor-pointer'}>
                                                <option value="">— Choisir —</option>
                                                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                                            </select>
                                        </Field>
                                        <Field label="Nom du type" T={T}>
                                            <input type="text" placeholder="Ex : Maladie, Maternité…" value={newType.name} onChange={e => setNewType({ ...newType, name: e.target.value })} required className={mkInput(T)} />
                                        </Field>
                                        <Field label="Max jours / demande" suffix="jours" T={T}>
                                            <input type="number" placeholder="3" value={newType.maxDays} onChange={e => setNewType({ ...newType, maxDays: e.target.value })} className={mkInput(T) + ' pr-14'} />
                                        </Field>
                                        <button type="submit" className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20">
                                            <Plus size={14} /> Lier le type
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT CATEGORIES LIST */}
                        <div className="lg:col-span-2 space-y-4">
                            {loading ? (
                                <div className={`${T.card} rounded-2xl border ${T.border} py-20 flex flex-col items-center gap-3`}>
                                    <Loader2 size={26} className="animate-spin text-indigo-400" />
                                    <span className={`text-xs font-medium ${T.textSub}`}>Chargement…</span>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className={`${T.card} rounded-2xl border ${T.border} py-16 flex flex-col items-center gap-3`}>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${T.surface}`}>
                                        <Layers size={24} className={`${T.textMuted} opacity-40`} />
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-sm font-semibold ${T.textSub} mb-0.5`}>Aucune catégorie configurée</p>
                                        <p className={`text-xs ${T.textMuted} opacity-70`}>Utilisez le formulaire ci-contre pour commencer</p>
                                    </div>
                                </div>
                            ) : (
                                categories.map((cat, ci) => {
                                    const A = accent(ci);
                                    return (
                                        <div key={cat.id} className={`${T.card} rounded-2xl border ${T.border} overflow-hidden shadow-sm`}>
                                            <div className={`h-[3px] w-full bg-gradient-to-r ${A.stripe} opacity-80`} />

                                            <div className={`flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b ${T.border} ${T.surface}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${A.iconBg}`}>
                                                        <Layers size={15} className={A.icon} />
                                                    </div>
                                                    <div>
                                                        <p className={`text-[10px] uppercase tracking-widest font-bold ${T.textMuted}`}>Catégorie</p>
                                                        <p className={`text-sm font-bold ${T.text}`}>{cat.category_name}</p>
                                                    </div>
                                                </div>
                                                <div className={`px-3.5 py-2 rounded-xl border ${T.border} ${T.surfaceDeep} text-right`}>
                                                    <p className={`text-[9px] uppercase tracking-widest font-bold ${T.textMuted} mb-0.5`}>Plafond global</p>
                                                    <p className={`text-base font-bold tabular-nums ${A.numText}`}>
                                                        {cat.annual_global_max}
                                                        <span className="text-[11px] font-semibold ml-0.5">j</span>
                                                    </p>
                                                </div>
                                            </div>

                                            {cat.types?.length > 0 ? (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className={`border-b ${T.border}`}>
                                                                <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Type de congé</th>
                                                                <th className="px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">Max / demande</th>
                                                                <th className="px-4 py-2.5 w-12"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className={`divide-y ${T.border}`}>
                                                            {cat.types.map((type, ti) => (
                                                                <tr key={type.id} className={`transition-colors group ${T.tableRow} ${ti % 2 === 0 ? T.tableAlt : ''}`}>
                                                                    <td className="px-5 py-3.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <Tag size={11} className="text-gray-500 opacity-60" />
                                                                            <span className={`text-sm font-semibold ${T.text}`}>{type.name}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-5 py-3.5">
                                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold tabular-nums border ${A.badge}`}>
                                                                            {type.max_days_per_request} jours
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 text-right">
                                                                        <button onClick={() => deleteType(type.id, type.name)} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-0 group-hover:opacity-100 text-gray-500 hover:bg-rose-500/10 hover:text-rose-400`} title="Supprimer">
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 px-5 py-4">
                                                    <Tag size={12} className="text-gray-500 opacity-30" />
                                                    <span className={`text-xs italic ${T.textMuted} opacity-60`}>Aucun type — utilisez le formulaire ci-contre</span>
                                                </div>
                                            )}

                                            {cat.types?.length > 0 && (
                                                <div className={`px-5 py-2.5 border-t ${T.border} ${T.surface} flex items-center justify-between`}>
                                                    <span className={`text-[10px] ${T.textMuted}`}>
                                                        {cat.types.length} type{cat.types.length > 1 ? 's' : ''} configuré{cat.types.length > 1 ? 's' : ''}
                                                    </span>
                                                    <div className="flex gap-1">
                                                        {cat.types.slice(0, 6).map((_, i) => (<div key={i} className={`w-1.5 h-1.5 rounded-full ${A.dot} opacity-35`} />))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminConfig;