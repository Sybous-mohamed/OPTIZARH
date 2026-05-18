import React, { useState, useEffect, useRef } from 'react';
import {
    Users, UserCheck, DollarSign, Calendar, Clock, CheckCircle,
    Eye, ChevronRight, Activity, Wallet, Briefcase, Building2,
    Award, ArrowUp, ArrowDown, RefreshCw, Loader2, ChevronDown,
    BarChart3, UserMinus, UserX
} from 'lucide-react';
import api from '../../lib/apis/axiosConfig';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const fmtMoney = (n = 0) => n.toLocaleString('fr-MA', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' MAD';

const Avatar = ({ name = '?', size = 36, color = 'indigo' }) => {
    const colorClass = {
        indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
        emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        amber: 'bg-amber-50 border-amber-200 text-amber-700',
        rose: 'bg-rose-50 border-rose-200 text-rose-700',
    }[color] || 'bg-indigo-50 border-indigo-200 text-indigo-700';
    
    return (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${colorClass} flex-shrink-0`} style={{ width: size, height: size, fontSize: size * 0.35 }}>
            {name.charAt(0).toUpperCase()}
        </div>
    );
};

const Badge = ({ children, color = 'indigo' }) => {
    const colorClass = {
        indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
        rose: 'bg-rose-50 text-rose-700 border-rose-200',
        sky: 'bg-sky-50 text-sky-700 border-sky-200',
        violet: 'bg-violet-50 text-violet-700 border-violet-200',
    }[color] || 'bg-indigo-50 text-indigo-700 border-indigo-200';
    
    return (
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${colorClass}`}>
            {children}
        </span>
    );
};

const KpiCard = ({ icon: Icon, title, value, sub, trend, trendUp, accentColor, dark }) => {
    const accent = {
        indigo: 'from-indigo-500 to-indigo-600',
        emerald: 'from-emerald-500 to-emerald-600',
        sky: 'from-sky-500 to-sky-600',
        rose: 'from-rose-500 to-rose-600',
    }[accentColor] || 'from-indigo-500 to-indigo-600';
    
    return (
        <div className={`rounded-xl border p-5 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-[#161616] border-[#252525]' : 'bg-white border-gray-200'}`}>
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accent}`} />
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${accent} shadow-md`}>
                    <Icon size={18} className="text-white" />
                </div>
                <span className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trendUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                    {trend}
                </span>
            </div>
            <p className={`text-2xl font-bold ${dark ? 'text-white' : 'text-gray-800'}`}>{value}</p>
            <p className={`text-xs mt-1 font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
            <p className={`text-[10px] mt-2 opacity-75 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>
        </div>
    );
};

const Card = ({ children, dark, className = '' }) => (
    <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-[#161616] border-[#252525]' : 'bg-white border-gray-200'} ${className}`}>
        {children}
    </div>
);

const CardHeader = ({ children, dark }) => (
    <div className={`flex justify-between items-center px-5 py-4 border-b ${dark ? 'border-[#252525]' : 'border-gray-100'}`}>
        <div className={`flex items-center gap-2 text-sm font-semibold ${dark ? 'text-gray-100' : 'text-gray-800'}`}>
            {children}
        </div>
    </div>
);

const Bar = ({ label, value, max, color }) => (
    <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-500 dark:text-gray-400">{label}</span>
            <span className="font-semibold" style={{ color }}>{value}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: color + '22' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min((value / max) * 100, 100)}%`, background: color }} />
        </div>
    </div>
);

const StatRow = ({ icon: Icon, label, value, color }) => (
    <div className="flex justify-between py-2.5 border-b border-gray-100 dark:border-gray-800">
        <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Icon size={13} style={{ color }} />
            {label}
        </span>
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{value}</span>
    </div>
);

const ChartRenderer = ({ data, type, dark }) => {
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        // Attendre que le DOM soit prêt
        if (!data || !canvasRef.current) return;

        // Détruire l'ancien chart s'il existe
        if (chartRef.current) {
            try {
                chartRef.current.destroy();
                chartRef.current = null;
            } catch (err) {
                console.warn('Error destroying chart:', err);
            }
        }

        // Nettoyer le canvas (supprimer l'ancien contexte)
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Réinitialiser le canvas
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        // Configurer les couleurs
        const grid = dark ? '#2A2A2A' : '#F3F4F6';
        const tickColor = dark ? '#6B7280' : '#9CA3AF';
        
        let config;
        
        if (type === 'salary') {
            config = {
                type: 'bar',
                data: {
                    labels: data.map(d => d.grade || 'Non spécifié'),
                    datasets: [{
                        label: 'Salaire moyen brut',
                        data: data.map(d => d.average || 0),
                        backgroundColor: '#4F46E522',
                        borderColor: '#4F46E5',
                        borderWidth: 1.5,
                        borderRadius: 6,
                        barPercentage: 0.7,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { 
                            grid: { color: grid, drawBorder: true },
                            ticks: { color: tickColor, font: { size: 11 } }
                        },
                        y: { 
                            grid: { color: grid },
                            ticks: { 
                                color: tickColor, 
                                font: { size: 11 },
                                callback: v => (v / 1000).toFixed(0) + 'k'
                            }
                        },
                    },
                },
            };
        } else if (type === 'hires') {
            config = {
                type: 'line',
                data: {
                    labels: data.map(d => d.month || ''),
                    datasets: [{
                        label: 'Embauches',
                        data: data.map(d => d.count || 0),
                        borderColor: '#059669',
                        backgroundColor: '#05966922',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#059669',
                        pointBorderColor: '#fff',
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { 
                            grid: { color: grid },
                            ticks: { color: tickColor, font: { size: 11 }, autoSkip: false }
                        },
                        y: { 
                            grid: { color: grid },
                            ticks: { color: tickColor, font: { size: 11 } },
                            beginAtZero: true
                        },
                    },
                },
            };
        } else {
            config = {
                type: 'bar',
                data: {
                    labels: data.map(d => d.month || ''),
                    datasets: [
                        { 
                            label: 'Approuvées',
                            data: data.map(d => d.approved || 0),
                            backgroundColor: '#05966988',
                            borderColor: '#059669',
                            borderWidth: 1.5,
                            borderRadius: 4,
                            barPercentage: 0.6,
                        },
                        { 
                            label: 'En attente',
                            data: data.map(d => d.pending || 0),
                            backgroundColor: '#D9770688',
                            borderColor: '#D97706',
                            borderWidth: 1.5,
                            borderRadius: 4,
                            barPercentage: 0.6,
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { 
                            grid: { color: grid },
                            ticks: { color: tickColor, font: { size: 11 }, autoSkip: false }
                        },
                        y: { 
                            grid: { color: grid },
                            ticks: { color: tickColor, font: { size: 11 } },
                            beginAtZero: true
                        },
                    },
                },
            };
        }

        // Importer Chart.js et créer le graphique
        import('chart.js/auto').then(({ Chart }) => {
            if (!canvasRef.current) return;
            
            // Vérifier si le canvas a déjà un chart
            const existingChart = Chart.getChart(canvasRef.current);
            if (existingChart) {
                existingChart.destroy();
            }
            
            chartRef.current = new Chart(ctx, config);
        }).catch(err => {
            console.error('Chart.js import error:', err);
        });

        // Cleanup
        return () => {
            if (chartRef.current) {
                try {
                    chartRef.current.destroy();
                    chartRef.current = null;
                } catch (err) {
                    console.warn('Cleanup destroy error:', err);
                }
            }
        };
    }, [data, type, dark]);

    const legendItems = type === 'leaves' 
        ? [{ label: 'Approuvées', color: '#059669' }, { label: 'En attente', color: '#D97706' }] 
        : type === 'hires' 
        ? [{ label: 'Embauches', color: '#059669' }] 
        : [{ label: 'Salaire moyen brut (MAD)', color: '#4F46E5' }];
    
    return (
        <div>
            <div className="flex flex-wrap gap-4 mb-3">
                {legendItems.map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                        {l.label}
                    </span>
                ))}
            </div>
            <div className="relative h-[220px] w-full">
                <canvas 
                    ref={canvasRef} 
                    style={{ width: '100%', height: '100%' }}
                />
            </div>
        </div>
    );
};

const RHDashboard = () => {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [years, setYears] = useState([]);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('salary');
    const yearRef = useRef(null);

    const dk = darkMode;

    useEffect(() => { fetchYears(); }, []);
    useEffect(() => { fetchStats(); fetchChartData(activeTab); }, [selectedYear]);
    useEffect(() => { fetchChartData(activeTab); }, [activeTab]);
    useEffect(() => { const fn = e => { if (yearRef.current && !yearRef.current.contains(e.target)) setIsYearOpen(false); }; document.addEventListener('mousedown', fn); return () => document.removeEventListener('mousedown', fn); }, []);

    const fetchYears = async () => { try { const r = await api.get('/api/rh/employees/annees'); setYears(r.data || []); } catch { } };
    const fetchStats = async () => { setLoading(true); try { const r = await api.get('/api/rh/dashboard/stats', { params: { year: selectedYear } }); if (r.data.success) setStats(r.data.data); } catch { showNotification('Erreur chargement des statistiques', 'error'); } finally { setLoading(false); } };
    const fetchChartData = async (type) => { try { const r = await api.get('/api/rh/dashboard/chart-data', { params: { year: selectedYear, type } }); if (r.data.success) setChartData(r.data.data); } catch { } };

    if (loading || !stats) return (
        <div className={`min-h-screen flex items-center justify-center ${dk ? 'bg-black' : 'bg-gray-50'}`}>
            <div className="text-center">
                <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto" />
                <p className={`text-sm mt-3 ${dk ? 'text-gray-400' : 'text-gray-500'}`}>Chargement du dashboard…</p>
            </div>
        </div>
    );

    const { employees, salary, leaves, recent_employees, top_salaries, grade_distribution, status_distribution } = stats;

    const kpis = [
        { icon: Users, title: 'Total employés', value: employees.total, sub: `${employees.active} actifs · ${employees.on_leave} congés`, trend: '+12%', trendUp: true, accentColor: 'indigo' },
        { icon: DollarSign, title: 'Masse salariale', value: fmtMoney(salary.mass_salariale), sub: 'Brut mensuel cumulé', trend: '+5%', trendUp: true, accentColor: 'emerald' },
        { icon: Wallet, title: 'Salaire moyen', value: fmtMoney(salary.average_brut), sub: 'Brut par employé', trend: '+3%', trendUp: true, accentColor: 'sky' },
        { icon: Activity, title: "Taux d'activité", value: `${employees.activity_rate}%`, sub: `${employees.active}/${employees.total} actifs`, trend: employees.activity_rate > 80 ? 'Bon' : 'Faible', trendUp: employees.activity_rate > 80, accentColor: employees.activity_rate > 80 ? 'emerald' : 'rose' },
    ];

    const TABS = [{ key: 'salary', label: 'Salaires' }, { key: 'hires', label: 'Embauches' }, { key: 'leaves', label: 'Congés' }];

    return (
        <div className={`min-h-screen transition-colors duration-300  ${dk ? 'bg-black' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex flex-wrap justify-between items-end gap-3">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                                <BarChart3 size={18} className="text-white" />
                            </div>
                            <h1 className={`text-2xl font-bold ${dk ? 'text-white' : 'text-gray-800'}`}>Dashboard RH</h1>
                            <Badge color="indigo">{selectedYear}</Badge>
                        </div>
                        <p className={`text-sm ${dk ? 'text-gray-400' : 'text-gray-500'}`}>Vue d'ensemble · Ressources humaines</p>
                    </div>
                    
                    <div className="flex gap-2">
                        {/* Year selector */}
                        <div className="relative" ref={yearRef}>
                            <button onClick={() => setIsYearOpen(!isYearOpen)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm cursor-pointer ${dk ? 'bg-[#161616] border-[#2A2A2A] text-gray-200' : 'bg-white border-gray-200 text-gray-700'}`}>
                                <Calendar size={14} className={dk ? 'text-gray-400' : 'text-gray-500'} />
                                {selectedYear}
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && (
                                <div className={`absolute top-full right-0 mt-2 rounded-xl border shadow-lg z-50 min-w-[110px] overflow-hidden ${dk ? 'bg-[#161616] border-[#2A2A2A]' : 'bg-white border-gray-200'}`}>
                                    {years.map(y => (
                                        <div key={y.id} onClick={() => { setSelectedYear(y.year); setIsYearOpen(false); }} className={`px-4 py-2 text-sm text-center cursor-pointer transition-colors ${selectedYear === y.year ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : dk ? 'text-gray-300 hover:bg-[#252525]' : 'text-gray-600 hover:bg-gray-50'}`}>
                                            {y.year}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpis.map((k, i) => <KpiCard key={i} {...k} dark={dk} />)}
                </div>

                {/* Employee Status + Conges Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Employee breakdown - Sans lien */}
                    <Card dark={dk}>
                        <CardHeader dark={dk}>
                            <Users size={14} className="text-indigo-500" /> Répartition des effectifs
                        </CardHeader>
                        <div className="p-5">
                            {status_distribution.map((s, i) => (<Bar key={i} label={s.name} value={s.value} max={employees.total || 1} color={s.color} />))}
                            <div className="flex flex-wrap gap-2 mt-3">
                                <Badge color="rose"><UserX size={10} className="inline mr-1" />{employees.departed} Départs</Badge>
                                <Badge color="amber"><UserMinus size={10} className="inline mr-1" />{employees.on_leave} Congés</Badge>
                                <Badge color="emerald"><UserCheck size={10} className="inline mr-1" />{employees.active} Actifs</Badge>
                            </div>
                        </div>
                    </Card>

                    {/* Leaves summary - Sans lien */}
                    <Card dark={dk}>
                        <CardHeader dark={dk}>
                            <Clock size={14} className="text-amber-500" /> Demandes de congé
                            {leaves.pending > 0 && (<span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500 text-white ml-2">{leaves.pending}</span>)}
                        </CardHeader>
                        <div className="p-5">
                            <StatRow icon={Clock} label="En attente" value={leaves.pending} color="#D97706" />
                            <StatRow icon={CheckCircle} label="Approuvées" value={leaves.approved || 0} color="#059669" />
                            <StatRow icon={UserX} label="Refusées" value={leaves.rejected || 0} color="#E11D48" />
                            
                            {leaves.pending_requests.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Dernières demandes</p>
                                    {leaves.pending_requests.slice(0, 3).map((req, i) => (
                                        <div key={i} className="flex justify-between items-center py-2 hover:bg-gray-50 dark:hover:bg-[#252525] rounded-lg transition-all">
                                            <div className="flex items-center gap-2">
                                                <Avatar name={req.employee_name} size={28} color="amber" />
                                                <div>
                                                    <p className={`text-xs font-semibold ${dk ? 'text-white' : 'text-gray-800'}`}>{req.employee_name}</p>
                                                    <p className="text-[10px] text-gray-400">{req.leave_type} · {req.duration}j</p>
                                                </div>
                                            </div>
                                            {/* Supprimé le bouton Eye */}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Grade distribution - Sans lien */}
                    <Card dark={dk}>
                        <CardHeader dark={dk}>
                            <Briefcase size={14} className="text-violet-500" /> Répartition par grade
                        </CardHeader>
                        <div className="p-5 max-h-[240px] overflow-y-auto">
                            {grade_distribution.slice(0, 8).map((g, i) => {
                                const colors = ['indigo', 'violet', 'sky', 'emerald', 'amber', 'rose'];
                                return (
                                    <div key={i} className="flex justify-between items-center py-2 border-b last:border-0 border-gray-100 dark:border-gray-800">
                                        <span className={`text-xs ${dk ? 'text-gray-300' : 'text-gray-600'}`}>{g.name}</span>
                                        <Badge color={colors[i % 6]}>{g.count} emp.</Badge>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Chart section */}
                <Card dark={dk}>
                    <CardHeader dark={dk}>
                        <BarChart3 size={14} className="text-sky-500" /> Analyse graphique
                    </CardHeader>
                    <div className="flex border-b px-5 gap-1 dark:border-gray-800">
                        {TABS.map(t => (
                            <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-3 py-2 text-xs font-semibold transition-all cursor-pointer border-b-2 ${activeTab === t.key ? 'border-indigo-500 text-indigo-500' : `border-transparent ${dk ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    <div className="p-5">
                        {chartData ?<ChartRenderer 
                            key={`${activeTab}-${selectedYear}`}  // ← Ajoute cette ligne
                            data={chartData} 
                            type={activeTab} 
                            dark={dk} 
                        /> : (
                            <div className="h-[200px] flex items-center justify-center">
                                <Loader2 size={20} className="animate-spin text-indigo-500 mr-2" />
                                <span className={`text-xs ${dk ? 'text-gray-400' : 'text-gray-500'}`}>Chargement…</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Recent + Top salaries - Sans liens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Recent employees - Sans lien "Tous" */}
                    <Card dark={dk}>
                        <CardHeader dark={dk}>
                            <UserCheck size={14} className="text-emerald-500" /> Derniers arrivages
                        </CardHeader>
                        <div>
                            {recent_employees.map((emp, i) => (
                                <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-all">
                                    <div className="flex items-center gap-3">
                                        <Avatar name={emp.name} size={36} color="emerald" />
                                        <div>
                                            <p className={`text-sm font-semibold ${dk ? 'text-white' : 'text-gray-800'}`}>{emp.name}</p>
                                            <p className={`text-xs ${dk ? 'text-gray-400' : 'text-gray-500'}`}>{emp.poste}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[10px] ${dk ? 'text-gray-500' : 'text-gray-400'}`}>Embauche</p>
                                        <p className={`text-xs font-semibold ${dk ? 'text-gray-300' : 'text-gray-600'}`}>{emp.date_embauche}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Top salaries - Sans lien */}
                    <Card dark={dk}>
                        <CardHeader dark={dk}>
                            <Award size={14} className="text-amber-500" /> Top salaires
                            <span className={`text-[10px] font-normal ${dk ? 'text-gray-500' : 'text-gray-400'}`}>· Net mensuel</span>
                        </CardHeader>
                        <div>
                            {top_salaries.map((emp, i) => {
                                const medals = ['#F59E0B', '#9CA3AF', '#CD7F32'];
                                const medal = medals[i];
                                return (
                                    <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 dark:hover:bg-[#252525] transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'border-2' : `border ${dk ? 'border-gray-700' : 'border-gray-200'}`}`} style={i < 3 ? { background: medal + '22', color: medal, borderColor: medal + '55' } : {}}>
                                                {i < 3 ? ['1', '2', '3'][i] : i + 1}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-semibold ${dk ? 'text-white' : 'text-gray-800'}`}>{emp.name}</p>
                                                <p className={`text-xs ${dk ? 'text-gray-400' : 'text-gray-500'}`}>{emp.grade || emp.poste}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(emp.net_salary)}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Quick actions - SUPPRIMÉS complètement */}
            </div>
        </div>
    );
};

export default RHDashboard;