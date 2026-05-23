import React, { useState, useEffect } from 'react';
import api from '../../lib/apis/axiosConfig';
import {
    Settings, Plus, Trash2, FolderPlus, Loader2,
    ChevronDown, Calendar, AlertCircle, X, Check,
    Layers, Tag, Shield
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

/* ─────────────────────────────────────────────
   Design tokens
───────────────────────────────────────────── */
function useTokens(dark) {
    return dark ? {
        page:        'bg-[#0A0A0F]',
        surface:     'bg-[#111118]',
        surfaceHigh: 'bg-[#181821]',
        surfaceMid:  'bg-[#141420]',
        hover:       'hover:bg-[#1E1E2A]',
        border:      'border-[#23232F]',
        text:        'text-white',
        muted:       'text-[#636380]',
        soft:        'text-[#9999B8]',
        input:       'bg-[#0E0E18] border-[#23232F] text-white placeholder-[#444460] focus:border-[#7B7BFF] focus:ring-[#7B7BFF]/20',
        tableRow:    'hover:bg-[#13131E]',
        tableAlt:    'bg-[#0D0D15]',
    } : {
        page:        'bg-[#F2F3F8]',
        surface:     'bg-white',
        surfaceHigh: 'bg-[#F6F7FB]',
        surfaceMid:  'bg-[#EEF0F8]',
        hover:       'hover:bg-[#F4F5FB]',
        border:      'border-[#E2E4F0]',
        text:        'text-[#0D0D1A]',
        muted:       'text-[#9090AA]',
        soft:        'text-[#55557A]',
        input:       'bg-white border-[#D8DAF0] text-[#0D0D1A] placeholder-[#AAAACC] focus:border-[#7B7BFF] focus:ring-[#7B7BFF]/20',
        tableRow:    'hover:bg-[#F8F9FE]',
        tableAlt:    'bg-[#FAFBFF]',
    };
}

/* ─────────────────────────────────────────────
   Atoms
───────────────────────────────────────────── */
function AccentBar({ color = 'bg-[#7B7BFF]' }) {
    return <div className={`h-[3px] w-full rounded-t-2xl ${color}`} />;
}

function SectionLabel({ icon: Icon, label, color = 'text-[#7B7BFF]', T }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className={`w-[3px] h-4 rounded-full bg-[#7B7BFF]`} />
            <Icon size={13} className={color} />
            <span className={`text-[11px] font-bold uppercase tracking-widest ${T.muted}`}>{label}</span>
        </div>
    );
}

function FormField({ label, error, children, T }) {
    return (
        <div>
            {label && <label className={`block text-[11px] font-semibold uppercase tracking-wider ${T.muted} mb-1.5`}>{label}</label>}
            {children}
            {error && (
                <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-1">
                    <AlertCircle size={10} /> {error}
                </p>
            )}
        </div>
    );
}

const inputCls = (T, hasError) =>
    `w-full px-3 py-2.5 rounded-xl border text-[13px] outline-none transition-all focus:ring-2
     ${hasError ? 'border-rose-500 focus:ring-rose-500/20' : T.input}`;

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
const SuperAdminConfig = () => {
    const { darkMode } = useTheme();
    const T = useTokens(darkMode);

    const [selectedYearId, setSelectedYearId] = useState('');
    const [years, setYears]                   = useState([]);
    const [categories, setCategories]         = useState([]);
    const [loading, setLoading]               = useState(false);
    const [isYearOpen, setIsYearOpen]         = useState(false);
    const [notification, setNotification]     = useState(null); // { msg, type }

    const [newCat, setNewCat]   = useState({ name: '', max: 25 });
    const [newType, setNewType] = useState({ categoryId: '', name: '', maxDays: 0 });

    const notify = (msg, type = 'success') => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    useEffect(() => {
        api.get('/api/salary-years').then(r => setYears(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (selectedYearId) fetchConfig(selectedYearId);
    }, [selectedYearId]);

    const fetchConfig = async (yearId) => {
        setLoading(true);
        try {
            const res = await api.get(`/api/leave-config/full/${yearId}`);
            setCategories(res.data);
        } catch { notify("Erreur chargement config", "error"); }
        finally { setLoading(false); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/leave-config/save-category', {
                salary_year_id: parseInt(selectedYearId),
                category_name: newCat.name,
                annual_global_max: parseInt(newCat.max),
            });
            fetchConfig(selectedYearId);
            setNewCat({ name: '', max: 25 });
            notify("Catégorie ajoutée");
        } catch { notify("Erreur ajout catégorie", "error"); }
    };

    const handleAddType = async (e) => {
        e.preventDefault();
        if (!newType.categoryId) { notify("Sélectionner une catégorie", "error"); return; }
        try {
            await api.post('/api/leave-config/types', {
                salary_year_id: selectedYearId,
                leave_category_id: newType.categoryId,
                name: newType.name,
                max_days_per_request: newType.maxDays,
            });
            fetchConfig(selectedYearId);
            setNewType({ categoryId: '', name: '', maxDays: 0 });
            notify("Type ajouté");
        } catch { notify("Erreur ajout type", "error"); }
    };

    const deleteType = async (id) => {
        if (!confirm("Confirmer la suppression ?")) return;
        try {
            await api.delete(`/api/leave-config/types/${id}`);
            fetchConfig(selectedYearId);
            notify("Type supprimé");
        } catch { notify("Erreur suppression", "error"); }
    };

    const selectedYear = years.find(y => String(y.id) === String(selectedYearId));
    const totalTypes   = categories.reduce((acc, c) => acc + (c.types?.length || 0), 0);

    return (
        <div className={`min-h-screen ${T.page} font-sans`}>
            <div className="max-w-6xl mx-auto px-4 md:px-6 py-7 space-y-6">

                {/* ── Toast ── */}
                {notification && (
                    <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-[13px] font-semibold transition-all
                        ${notification.type === 'error'
                            ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'}`}
                    >
                        {notification.type === 'error' ? <AlertCircle size={14} /> : <Check size={14} />}
                        {notification.msg}
                    </div>
                )}

                {/* ── PAGE HEADER ── */}
                <div className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden`}>
                    <AccentBar color="bg-gradient-to-r from-[#7B7BFF] via-violet-500 to-purple-600" />
                    <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-[#7B7BFF]/12 flex items-center justify-center">
                                <Settings size={16} className="text-[#7B7BFF]" />
                            </div>
                            <div>
                                <h1 className={`text-[16px] font-bold tracking-tight ${T.text}`}>Configuration RH</h1>
                                <p className={`text-[11px] ${T.muted} mt-0.5`}>Gestion des catégories et types</p>
                            </div>
                        </div>

                        {/* Year picker */}
                        <div className="relative">
                            <button
                                onClick={() => setIsYearOpen(p => !p)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${T.border} ${T.surface} ${T.text} text-[13px] font-semibold cursor-pointer ${T.hover} transition-all min-w-[180px] justify-between`}
                            >
                                <div className="flex items-center gap-2">
                                    <Calendar size={13} className={T.muted} />
                                    <span>{selectedYear ? `Année ${selectedYear.year}` : 'Sélectionner année'}</span>
                                </div>
                                <ChevronDown size={12} className={`${T.muted} transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && (
                                <div className={`absolute right-0 top-full mt-1.5 ${T.surface} border ${T.border} rounded-xl shadow-xl z-50 min-w-[180px] overflow-hidden`}
                                    onMouseLeave={() => setIsYearOpen(false)}>
                                    {years.map(y => (
                                        <button key={y.id} onClick={() => { setSelectedYearId(String(y.id)); setIsYearOpen(false); }}
                                            className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] ${T.hover} transition-all ${String(selectedYearId) === String(y.id) ? 'text-[#7B7BFF] font-semibold' : T.text}`}
                                        >
                                            <span>Année {y.year}</span>
                                            {String(selectedYearId) === String(y.id) && <Check size={12} className="text-[#7B7BFF]" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── NO YEAR SELECTED ── */}
                {!selectedYearId && (
                    <div className={`${T.surface} rounded-2xl border ${T.border} py-16 flex flex-col items-center gap-3`}>
                        <div className="w-12 h-12 rounded-2xl bg-[#7B7BFF]/10 flex items-center justify-center">
                            <Calendar size={20} className="text-[#7B7BFF]" />
                        </div>
                        <p className={`text-[14px] font-semibold ${T.text}`}>Sélectionnez une année</p>
                        <p className={`text-[12px] ${T.muted}`}>Choisissez une année pour gérer la configuration des congés</p>
                    </div>
                )}

                {/* ── STATS ROW ── */}
                {selectedYearId && !loading && categories.length > 0 && (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Catégories', value: categories.length, color: 'text-[#7B7BFF]', bg: 'bg-[#7B7BFF]/8', icon: Layers },
                            { label: 'Types', value: totalTypes, color: 'text-violet-400', bg: 'bg-violet-500/8', icon: Tag },
                            { label: 'Les max de xongé pour cette année', value: Math.max(...categories.map(c => c.annual_global_max || 0), 0), color: 'text-emerald-400', bg: 'bg-emerald-500/8', icon: Shield },
                        ].map(k => {
                            const Icon = k.icon;
                            return (
                                <div key={k.label} className={`${T.surface} rounded-2xl border ${T.border} p-4 flex items-center gap-3`}>
                                    <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                                        <Icon size={15} className={k.color} />
                                    </div>
                                    <div>
                                        <p className={`text-[10px] uppercase tracking-widest font-semibold ${T.muted}`}>{k.label}</p>
                                        <p className={`text-[20px] font-bold tabular-nums ${k.color}`}>{k.value}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── MAIN CONTENT ── */}
                {selectedYearId && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* ── LEFT: Forms ── */}
                        <div className="space-y-4">

                            {/* Add Category */}
                            <div className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden`}>
                                <AccentBar color="bg-[#7B7BFF]" />
                                <div className="p-5">
                                    <SectionLabel icon={FolderPlus} label="1. Créer une Catégorie" T={T} />
                                    <form onSubmit={handleAddCategory} className="space-y-3">
                                        <FormField label="Nom de la catégorie" T={T}>
                                            <input
                                                type="text" placeholder="Ex: Congé annuel"
                                                value={newCat.name}
                                                onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                                                required className={inputCls(T, false)}
                                            />
                                        </FormField>
                                        <FormField label="Jour max de conge pour cette année" T={T}>
                                            <input
                                                type="number" placeholder="25"
                                                value={newCat.max}
                                                onChange={e => setNewCat({ ...newCat, max: e.target.value })}
                                                className={inputCls(T, false)}
                                            />
                                        </FormField>
                                        <button type="submit"
                                            className="w-full py-2.5 rounded-xl bg-[#7B7BFF] text-white text-[13px] font-bold hover:bg-[#6A6AEE] transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Ajouter Catégorie & max jour
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Add Type */}
                            <div className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden`}>
                                <AccentBar color="bg-violet-500" />
                                <div className="p-5">
                                    <SectionLabel icon={Tag} label="2. Lier un Type" color="text-violet-400" T={T} />
                                    <form onSubmit={handleAddType} className="space-y-3">
                                        <FormField label="Catégorie" T={T}>
                                            <select
                                                value={newType.categoryId}
                                                onChange={e => setNewType({ ...newType, categoryId: e.target.value })}
                                                required className={inputCls(T, false)}
                                            >
                                                <option value="">— Choisir —</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.category_name}</option>
                                                ))}
                                            </select>
                                        </FormField>
                                        <FormField label="Nom du type" T={T}>
                                            <input
                                                type="text" placeholder="Ex: Maladie"
                                                value={newType.name}
                                                onChange={e => setNewType({ ...newType, name: e.target.value })}
                                                required className={inputCls(T, false)}
                                            />
                                        </FormField>
                                        <FormField label="Max jours / demande" T={T}>
                                            <input
                                                type="number" placeholder="3"
                                                value={newType.maxDays}
                                                onChange={e => setNewType({ ...newType, maxDays: e.target.value })}
                                                className={inputCls(T, false)}
                                            />
                                        </FormField>
                                        <button type="submit"
                                            className="w-full py-2.5 rounded-xl bg-violet-500 text-white text-[13px] font-bold hover:bg-violet-600 transition-all cursor-pointer flex items-center justify-center gap-2"
                                        >
                                            <Plus size={14} /> Lier le Type
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* ── RIGHT: Categories list ── */}
                        <div className="lg:col-span-2 space-y-4">
                            {loading ? (
                                <div className={`${T.surface} rounded-2xl border ${T.border} py-16 flex flex-col items-center gap-3`}>
                                    <Loader2 size={24} className="animate-spin text-[#7B7BFF]" />
                                    <span className={`text-[12px] ${T.muted}`}>Chargement…</span>
                                </div>
                            ) : categories.length === 0 ? (
                                <div className={`${T.surface} rounded-2xl border ${T.border} py-14 flex flex-col items-center gap-2`}>
                                    <Layers size={30} className={`${T.muted} opacity-30`} />
                                    <p className={`text-[13px] ${T.muted}`}>Aucune catégorie configurée</p>
                                </div>
                            ) : (
                                categories.map((cat, ci) => (
                                    <div key={cat.id} className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden`}>
                                        <AccentBar color={ci % 2 === 0 ? 'bg-[#7B7BFF]' : 'bg-violet-500'} />

                                        {/* Cat header */}
                                        <div className={`flex items-center justify-between px-5 py-4 border-b ${T.border} ${T.surfaceHigh}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${ci % 2 === 0 ? 'bg-[#7B7BFF]/12' : 'bg-violet-500/12'}`}>
                                                    <Layers size={14} className={ci % 2 === 0 ? 'text-[#7B7BFF]' : 'text-violet-400'} />
                                                </div>
                                                <div>
                                                    <p className={`text-[10px] uppercase tracking-widest font-bold ${T.muted}`}>Catégorie</p>
                                                    <p className={`text-[14px] font-bold ${T.text}`}>{cat.category_name}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Types table */}
                                        {cat.types?.length > 0 ? (
                                            <table className="w-full">
                                                <thead>
                                                    <tr className={`border-b ${T.border}`}>
                                                        <th className={`px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest ${T.muted}`}>Type</th>
                                                        <th className={`px-5 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest ${T.muted}`}>Max / Demande</th>
                                                        <th className="px-5 py-2.5" />
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {cat.types.map((type, ti) => (
                                                        <tr key={type.id}
                                                            className={`border-b ${T.border} last:border-0 transition-colors ${T.tableRow} ${ti % 2 === 0 ? T.tableAlt : ''}`}
                                                        >
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <Tag size={12} className={T.muted} />
                                                                    <span className={`text-[13px] font-semibold ${T.text}`}>{type.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[12px] font-bold tabular-nums border
                                                                    ${ci % 2 === 0
                                                                        ? 'bg-[#7B7BFF]/10 text-[#7B7BFF] border-[#7B7BFF]/20'
                                                                        : 'bg-violet-500/10 text-violet-400 border-violet-500/20'}`}>
                                                                    {type.max_days_per_request} jours
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3 text-right">
                                                                <button
                                                                    onClick={() => deleteType(type.id)}
                                                                    className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        ) : (
                                            <div className={`flex items-center gap-2 px-5 py-4 ${T.muted}`}>
                                                <Tag size={13} className="opacity-40" />
                                                <span className="text-[12px] italic opacity-60">Aucun type configuré</span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperAdminConfig;