import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp, TrendingDown, Shield, Percent,
    CreditCard, Banknote, ArrowLeft, Loader,
    ChevronRight, Calendar, DollarSign, Award,
    BarChart3, Info, Wallet, Building2
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

/* ─────────────────────────────────────────────
   Design tokens — Dark mode optimized
───────────────────────────────────────────── */
function useTokens(dark) {
    return dark ? {
        page:        'bg-black',
        surface:     'bg-[#1A1A1A]',      
        surfaceHigh: 'bg-[#252525]',         
        hover:       'hover:bg-[#2A2A2A]',
        border:      'border-[#2A2A2A]',
        divider:     'divide-[#2A2A2A]',
        text:        'text-[#E5E5E5]',
        textPrimary: 'text-[#FFFFFF]',
        muted:       'text-[#8A8A8A]',
        soft:        'text-[#A0A0A0]',
        accent:      'text-[#7B7BFF]',
        accentBg:    'bg-[#7B7BFF]/10',
        success:     'text-[#34D399]',
        successBg:   'bg-[#34D399]/10',
        warning:     'text-[#FBBF24]',
        warningBg:   'bg-[#FBBF24]/10',
        error:       'text-[#F87171]',
        errorBg:     'bg-[#F87171]/10',
        info:        'text-[#60A5FA]',
        infoBg:      'bg-[#60A5FA]/10',
    } : {
        page:        'bg-[#F4F5F8]',
        surface:     'bg-white',
        surfaceHigh: 'bg-[#F0F1F5]',
        hover:       'hover:bg-[#F6F7FA]',
        border:      'border-[#E4E5EF]',
        divider:     'divide-[#E4E5EF]',
        text:        'text-[#1A1A2E]',
        textPrimary: 'text-[#0D0D1A]',
        muted:       'text-[#9898B0]',
        soft:        'text-[#666685]',
        accent:      'text-[#4F46E5]',
        accentBg:    'bg-[#4F46E5]/10',
        success:     'text-[#059669]',
        successBg:   'bg-[#059669]/10',
        warning:     'text-[#D97706]',
        warningBg:   'bg-[#D97706]/10',
        error:       'text-[#DC2626]',
        errorBg:     'bg-[#DC2626]/10',
        info:        'text-[#2563EB]',
        infoBg:      'bg-[#2563EB]/10',
    };
}



/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Thin accent bar atop cards */
function AccentBar({ color }) {
    return <div className={`h-[3px] w-full rounded-t-2xl ${color}`} />;
}


/** Section header inside a card */
function SectionHeader({ icon: Icon, label, value, valueColor, tokens }) {
    return (
        <div className={`flex items-center justify-between px-5 py-3.5 border-b ${tokens.border} ${tokens.surfaceHigh} rounded-t-none`}>
            <div className="flex items-center gap-2.5">
                <Icon size={15} className={valueColor || tokens.accent} />
                <span className={`text-[13px] font-semibold tracking-tight ${tokens.text}`}>{label}</span>
            </div>
            {value && <span className={`text-[13px] font-bold tabular-nums ${valueColor}`}>{value}</span>}
        </div>
    );
}

/** Empty state */
function Empty({ label, tokens }) {
    return (
        <div className="flex flex-col items-center justify-center py-10 gap-2 opacity-40">
            <Info size={20} />
            <span className="text-xs">{label}</span>
        </div>
    );
}

/** Progress bar */
function Bar({ pct, color = 'bg-emerald-500' }) {
    return (
        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
            <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
        </div>
    );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export default function EmployeeSalaryDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { darkMode } = useTheme();
    const T = useTokens(darkMode);

    const [loading, setLoading] = useState(true);
    const [data, setData]       = useState(null);
    const [employee, setEmployee] = useState(null);

    const [balance, setBalance] = useState(null);

    useEffect(() => {
        if (user?.id) fetchSalaryData();
        else navigate('/auth/login');
    }, [user]);

    const fetchSalaryData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/my-salary');
            if (res.data?.salary_details) {
                setEmployee(res.data.employee);
                setData(res.data.salary_details);
            } else setDefaultData();
        } catch { setDefaultData(); }
        finally { setLoading(false); }
    };

    const setDefaultData = () => setData({
        brut_salary: 0, net_salary: 0, base_salary: 0, total_deductions: 0,
        indemnites:  { total: 0, details: [] },
        cotisations: { total: 0, details: [] },
        rcar:  { total: 0, details: [] },
        ir:    { total: 0, taux: 0 },
        sntl:  { total: 0, details: [] },
        assurances: { salarie: 0, employeur: 0, details: [] },
        credits: { total: 0, details: [] },
    });

    if (loading) return (
        <div className={`flex items-center justify-center min-h-screen ${T.page}`}>
            <div className="flex flex-col items-center gap-3">
                <Loader size={28} className="animate-spin text-[#7B7BFF]" />
                <span className={`text-xs ${T.muted}`}>Chargement du bulletin…</span>
            </div>
        </div>
    );

    const fmt = (n) => {
        if (n === undefined || n === null) return '0,00 MAD';
        return Number(n).toLocaleString('fr-MA', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        }) + ' MAD';
    };
    const totalRetained = (data?.ir?.total || 0) + 
                      (data?.cotisations?.total || 0) + 
                      (data?.rcar?.total || 0) + 
                      (data?.sntl?.total || 0) + 
                      (data?.assurances?.salarie || 0) + 
                      (data?.credits?.total || 0);

    const effectiveRate = data?.brut_salary > 0
        ? ((totalRetained / data.brut_salary) * 100).toFixed(2) : '0,00';
    const netRatio = data?.brut_salary > 0
        ? ((data.net_salary / data.brut_salary) * 100).toFixed(2) : 0;

    /* ── Top KPI cards data ── */
    const kpis = [
        {
            label:   'Salaire Brut',
            value:   fmt(data?.brut_salary),
            sub:     `Base ${fmt(data?.base_salary)}`,
            accent:  darkMode ? 'bg-[#7B7BFF]' : 'bg-[#4F46E5]',
            badge:   '+' + fmt(data?.indemnites?.total),
            icon:    TrendingUp,
        },
        {
            label:   'Total Déductions',
            value:   '-' + fmt(data?.total_deductions),
            sub:     `IR ${fmt(data?.ir?.total)}`,
            accent:  'bg-rose-500',
            badge:   `Cotis. ${fmt(data?.cotisations?.total)}`,
            icon:    TrendingDown,
        },
        {
            label:   'Salaire Net',
            value:   fmt(data?.net_salary),
            sub:     `${netRatio}% du brut`,
            accent:  darkMode ? 'bg-[#34D399]' : 'bg-[#059669]',
            badge:   'À percevoir',
            icon:    Wallet,
            featured: true,
        },
        {
            label:   'Taux IR',
            value: `${data?.ir?.taux || 0}%`, 
            sub:     'Impôt sur le revenu',
            accent:  darkMode ? 'bg-[#FBBF24]' : 'bg-[#D97706]',
            badge:   `Eff. ${effectiveRate}%`,
            icon:    BarChart3,
        },
    ];

    return (
        <div className={`min-h-screen ${T.page} font-sans`}>

            {/* ── HEADER ── */}
            <header className={`sticky top-0 z-20 border-b ${T.border} ${T.surface} backdrop-blur-md bg-opacity-90`}>
                <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div>
                            <h1 className={`text-[15px] font-bold tracking-tight ${T.textPrimary}`}>Bulletin de Paie</h1>
                            <p className={`text-[11px] ${T.muted} mt-0.5 tracking-wide uppercase`}>
                                {employee?.prenom} {employee?.nom}
                                {(employee?.poste_name || employee?.grade) && (
                                    <> | POST : <span className={T.accent}>{employee?.poste_name || employee?.grade}</span></>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg border ${T.border} ${T.surfaceHigh} ${T.muted}`}>
                            <Calendar size={11} />
                            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                        </span>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 py-7 space-y-7">

            {/* <LeaveBalanceCard data={balance} /> */}

                {/* ── KPI GRID ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((k) => {
                        const Icon = k.icon;
                        return (
                            <div key={k.label}
                                className={`
                                    relative rounded-2xl border ${T.border} overflow-hidden
                                    ${k.featured
                                        ? darkMode 
                                            ? 'bg-gradient-to-br from-[#34D399] to-[#059669]'
                                            : 'bg-gradient-to-br from-emerald-600 to-teal-700'
                                        : T.surface}
                                    transition-all duration-200 hover:scale-[1.01] hover:shadow-lg
                                    ${k.featured ? 'shadow-emerald-900/30 shadow-md' : ''}
                                `}
                            >
                                <AccentBar color={k.accent} />
                                <div className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <p className={`text-[10px] font-semibold uppercase tracking-widest ${k.featured ? 'text-white/80' : T.muted}`}>
                                            {k.label}
                                        </p>
                                        <div className={`p-1.5 rounded-lg ${k.featured ? 'bg-white/15' : T.accentBg}`}>
                                            <Icon size={14} className={k.featured ? 'text-white' : T.accent} />
                                        </div>
                                    </div>
                                    <p className={`text-[22px] font-bold tabular-nums leading-none tracking-tight ${k.featured ? 'text-white' : T.textPrimary}`}>
                                        {k.value}
                                    </p>
                                    <div className={`mt-3 pt-2.5 border-t flex justify-between items-center ${k.featured ? 'border-white/20' : T.border}`}>
                                        <span className={`text-[10px] ${k.featured ? 'text-white/80' : T.muted}`}>{k.sub}</span>
                                        <span className={`text-[10px] font-semibold ${k.featured ? 'text-white/90' : T.success}`}>{k.badge}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden md:col-span-1`}>
                    <SectionHeader icon={DollarSign} label="Résumé Fiscal" tokens={T} valueColor={T.warning} />
                    <div className="p-5 space-y-4">
                        <Row label="Total retenu" value={fmt(totalRetained)} valClr={T.error} T={T} />
                        <Row label="Taux effectif" value={`${effectiveRate}%`} T={T} />
                        <Row label="Net sur brut"  value={`${netRatio}%`} T={T} />
                    </div>
                </div>

                <div className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden md:col-span-2`}>
                    <SectionHeader icon={BarChart3} label="Flux de Paie" tokens={T} valueColor={T.accent} />
                    <div className="p-5">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
                            {/* Salaire Brut */}
                            <FlowBox label="Brut" value={fmt(data?.brut_salary)} color={T.accent} bg={T.accentBg} T={T} />
                            
                            {/* Toutes les déductions */}
                            <FlowArrow label={`- ${fmt(data?.cotisations?.total)}`} sub="Cotisations" T={T} />
                            <FlowArrow label={`- ${fmt(data?.ir?.total)}`} sub="IR" T={T} />
                            <FlowArrow label={`- ${fmt(data?.rcar?.total)}`} sub="RCAR" T={T} />
                            <FlowArrow label={`- ${fmt(data?.sntl?.total)}`} sub="SNTL" T={T} />
                            <FlowArrow label={`- ${fmt(data?.assurances?.salarie)}`} sub="Assurances" T={T} />
                            <FlowArrow label={`- ${fmt(data?.credits?.total)}`} sub="Crédits" T={T} />
                                
                            {/* Flèche vers le Net */}
                            <ChevronRight size={16} className={T.muted} />
                                
                            {/* Salaire Net */}
                            <FlowBox label="Net" value={fmt(data?.net_salary)} color={T.success} bg={T.successBg} T={T} featured />
                        </div>
                            
                        {/* Résumé du total des déductions */}
                        <div className={`mt-4 p-3 rounded-xl ${T.surfaceHigh} border ${T.border}`}>
                            <div className="flex justify-between items-center">
                                <span className={`text-xs font-semibold ${T.muted}`}>Total des déductions</span>
                                <span className={`text-sm font-bold ${T.error}`}>
                                    - {fmt(totalRetained)}
                                </span>
                            </div>
                        </div>
                            
                        <div className={`mt-4 pt-3 border-t ${T.border} flex items-center gap-2`}>
                            <Award size={13} className={T.accent} />
                            <p className={`text-[11px] ${T.muted} leading-relaxed`}>
                                Toutes les déductions sont automatiquement déclarées aux autorités compétentes.
                            </p>
                        </div>
                    </div>
                </div>


                {/* ── DETAIL GRID ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Indemnités */}
                    <DetailCard
                        icon={Shield} label="Indemnités"
                        value={'+' + fmt(data?.indemnites?.total)}
                        valueColor={T.success}
                        accentClass={darkMode ? 'bg-[#7B7BFF]' : 'bg-[#4F46E5]'}
                        T={T}>
                        {data?.indemnites?.details?.length ? data.indemnites.details.map((item, idx) => (
                            <DetailRow
                                key={idx}
                                title={item.libelle}
                                sub={item.type === 'Fixe' ? 'Montant fixe' : `${item.valeur}% du salaire`}
                                value={'+' + fmt(item.montant)}
                                valClr={T.success}
                                T={T}/>
                        )) : <Empty label="Aucune indemnité" tokens={T} />}
                    </DetailCard>

                    {/* Cotisations */}
                    <DetailCard
                        icon={Percent} label="Cotisations Sociales"
                        value={'-' + fmt(data?.cotisations?.total)}
                        valueColor={T.error}
                        accentClass="bg-rose-500"
                        T={T}>
                        {data?.cotisations?.details?.map((item, idx) => (
                            <DetailRow
                                key={idx}
                                title={item.name}
                                sub={`Taux ${item.taux}%${item.organisme ? ' · ' + item.organisme : ''}`}
                                value={'-' + fmt(item.montant)}
                                valClr={T.error}
                                T={T}
                            />
                        ))}
                        {/* RCAR + SNTL pill row */}
                        <div className={`flex gap-3 px-5 py-3 border-t ${T.border} ${T.surfaceHigh}`}>
                            <Pill label="RCAR" amount={'-' + fmt(data?.rcar?.total)} T={T} />
                            <Pill label="SNTL" amount={'-' + fmt(data?.sntl?.total)} T={T} />
                        </div>
                    </DetailCard>

                    {/* IR & Assurances */}
                    <DetailCard
                        icon={Percent} label="Impôts & Assurances"
                        valueColor={T.warning}
                        accentClass="bg-purple-500"
                        T={T}>
                        <DetailRow
                            title="IR — Impôt sur le revenu"
                            sub={`Taux appliqué : ${data?.ir?.taux || 0}%`}
                            value={'-' + fmt(data?.ir?.total)}
                            valClr={T.error}
                            T={T}/>
                        {data?.assurances?.details?.length > 0 && (
                            <div className={`px-5 py-3 border-t ${T.border}`}>
                                <p className={`text-[10px] uppercase tracking-widest font-semibold ${T.muted} mb-3`}>Assurances sociales</p>
                                <div className="space-y-2">
                                    {data.assurances.details.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center">
                                            <span className={`text-xs ${T.soft}`}>{item.name}</span>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold tabular-nums" style={{ color: T.error.replace('text-', '') }}>
                                                    -{fmt(item.montant_salarie)}
                                                </span>
                                                <span className={`text-[10px] ${T.muted} ml-1.5`}>
                                                    (+{fmt(item.montant_employeur)} emp.)
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </DetailCard>

                    {/* Crédits */}
                    <DetailCard
                        icon={CreditCard} label="Crédits en cours"
                        value={data?.credits?.total > 0 ? '-' + fmt(data?.credits?.total) : undefined}
                        valueColor={T.error}
                        accentClass={darkMode ? 'bg-indigo-500' : 'bg-indigo-600'}
                        T={T}>
                        {data?.credits?.details?.length ? data.credits.details.map((credit, idx) => (
                            <div key={idx} className={`px-5 py-3.5 border-b ${T.border} last:border-0 ${T.hover} transition-all`}>
                                <div className="flex justify-between items-start mb-1.5">
                                    <div>
                                        <p className={`text-[13px] font-semibold ${T.text}`}>{credit.name}</p>
                                        <p className={`text-[10px] ${T.muted} mt-0.5`}>
                                            {fmt(credit.montant)} · {credit.taux}% · {credit.duree} mois
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold tabular-nums" style={{ color: T.error.replace('text-', '') }}>
                                        -{fmt(credit.mensualite)}
                                    </span>
                                </div>
                                {credit.reste > 0 && (() => {
                                    const paidPct = Math.round((credit.montant - credit.reste) / credit.montant * 100);
                                    return (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] mb-1">
                                                <span className={T.muted}>{fmt(credit.reste)} restant</span>
                                                <span className={T.muted}>{paidPct}% remboursé</span>
                                            </div>
                                            <Bar pct={paidPct} color={darkMode ? 'bg-indigo-500' : 'bg-indigo-600'} />
                                        </div>
                                    );
                                })()}
                            </div>
                        )) : <Empty label="Aucun crédit en cours" tokens={T} />}
                    </DetailCard>
                </div>

                {/* ── BOTTOM BANNER ── */}
                <div className={`rounded-2xl border ${T.border} ${T.surface} overflow-hidden`}>
                    <AccentBar color="bg-gradient-to-r from-[#7B7BFF] via-emerald-500 to-teal-500" />
                    <div className="px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <p className={`text-[10px] uppercase tracking-widest font-semibold ${T.muted}`}>Net mensuel à percevoir</p>
                            <p className="text-3xl font-bold tabular-nums text-emerald-400 mt-1">{fmt(data?.net_salary)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Chip label="Brut" value={fmt(data?.brut_salary)} T={T} />
                            <ChevronRight size={14} className={T.muted} />
                            <Chip label="Déductions" value={'-' + fmt(data?.total_deductions)} valColor={T.error} T={T} />
                            <ChevronRight size={14} className={T.muted} />
                            <Chip label="Net" value={fmt(data?.net_salary)} valColor={T.success} T={T} highlight />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

/* ─────────────────────────────────────────────
   Helper micro-components
───────────────────────────────────────────── */

function Row({ label, value, valClr, T }) {
    return (
        <div className="flex justify-between items-center">
            <span className={`text-xs ${T.muted}`}>{label}</span>
            <span className={`text-sm font-bold tabular-nums ${valClr || T.text}`}>{value}</span>
        </div>
    );
}

function FlowBox({ label, value, color, bg, T, featured }) {
    return (
        <div className={`flex-1 rounded-xl p-3 text-center ${bg} border ${featured ? 'border-emerald-500/30' : T.border}`}>
            <p className={`text-[10px] uppercase tracking-widest font-semibold ${T.muted} mb-1`}>{label}</p>
            <p className={`text-sm font-bold tabular-nums ${color}`}>{value}</p>
        </div>
    );
}

function FlowArrow({ label, sub, T }) {
    return (
        <div className="flex flex-col items-center text-center gap-0.5 opacity-70 min-w-[60px]">
            <span className="text-rose-400 text-[11px] font-semibold tabular-nums">{label}</span>
            <span className={`text-[9px] uppercase tracking-wide ${T.muted}`}>{sub}</span>
            <ChevronRight size={12} className={`${T.muted} hidden sm:block`} />
        </div>
    );
}

function DetailCard({ icon, label, value, valueColor, accentClass, children, T }) {
    return (
        <div className={`${T.surface} rounded-2xl border ${T.border} overflow-hidden`}>
            <AccentBar color={accentClass} />
            <SectionHeader icon={icon} label={label} value={value} valueColor={valueColor} tokens={T} />
            <div>{children}</div>
        </div>
    );
}

function DetailRow({ title, sub, value, valClr, T }) {
    return (
        <div className={`flex items-center justify-between px-5 py-3 border-b last:border-0 ${T.border} ${T.hover} transition-all`}>
            <div>
                <p className={`text-[13px] font-medium ${T.text}`}>{title}</p>
                {sub && <p className={`text-[10px] ${T.muted} mt-0.5`}>{sub}</p>}
            </div>
            <span className={`text-[13px] font-bold tabular-nums ${valClr}`}>{value}</span>
        </div>
    );
}

function Pill({ label, amount, T }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${T.surfaceHigh} border ${T.border}`}>
            <span className={`text-[10px] uppercase tracking-wider font-bold ${T.muted}`}>{label}</span>
            <span className="text-[11px] font-bold tabular-nums text-rose-400">{amount}</span>
        </div>
    );
}

function Chip({ label, value, valColor, T, highlight }) {
    return (
        <div className={`flex flex-col items-end px-3 py-2 rounded-xl border ${highlight ? 'border-emerald-500/30 bg-emerald-500/8' : T.border + ' ' + T.surfaceHigh}`}>
            <span className={`text-[9px] uppercase tracking-widest ${T.muted}`}>{label}</span>
            <span className={`text-sm font-bold tabular-nums ${valColor || T.text}`}>{value}</span>
        </div>
    );
}