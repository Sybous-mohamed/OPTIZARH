// resources/js/routes/superadmin/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
    Users, Calendar, TrendingUp, TrendingDown,
    DollarSign, CreditCard, Shield, Building2,
    Activity, RefreshCw, ChevronDown, Briefcase,
    Percent, Truck, Wallet
} from 'lucide-react';
import axiosClient from "../../lib/apis/axiosConfig";
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import {
    AreaChart, Area, BarChart, Bar, PieChart as RePieChart,
    Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function Dashboard() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [availableYears, setAvailableYears] = useState([]);
    const [isYearOpen, setIsYearOpen] = useState(false);
    const yearRef = React.useRef(null);
    
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
    
    const darkClasses = darkMode ? {
        bg: 'bg-[#0D0D0D]',
        card: 'bg-[#1A1A1A] border-[#2A2A2A]',
        text: 'text-gray-100',
        textMuted: 'text-gray-500',
        border: 'border-[#2A2A2A]',
        hover: 'hover:bg-[#252525]'
    } : {
        bg: 'bg-gray-50',
        card: 'bg-white border-gray-200',
        text: 'text-gray-800',
        textMuted: 'text-gray-500',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-50'
    };
    
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
        fetchDashboardData();
    }, [selectedYear]);
    
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/api/superadmin/dashboard-stats', {
                params: { year: selectedYear }
            });
            setData(res.data);
            
            const years = res.data.available_years || [];
            setAvailableYears(years);
            
            if (years.length > 0 && !years.includes(selectedYear)) {
                setSelectedYear(years[0]);
            }
        } catch (err) {
            console.error("Erreur API:", err);
            showNotification("Erreur chargement dashboard", "error");
            setAvailableYears([new Date().getFullYear()]);
        } finally {
            setLoading(false);
        }
    };
    
    const handleYearChange = (year) => {
        setSelectedYear(year);
        setIsYearOpen(false);
    };
    
    const formatMoney = (num) => {
        if (!num || num === 0) return '0 DH';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M DH';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k DH';
        return num.toLocaleString('fr-FR') + ' DH';
    };
    
    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toLocaleString('fr-FR');
    };
    
    const stats = data?.stats || {};
    const charts = data?.charts || {};
    
    const monthlyData = charts.monthly_evolution || [];
    const cotisationsData = charts.cotisations_details || [];
    const statusData = charts.employee_status || [];
    const salaryByGrade = charts.salary_by_grade || [];
    const creditsByYear = charts.credits_by_year || [];
    
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-500 border-t-transparent"></div>
                    <p className={`text-sm ${darkClasses.textMuted}`}>Chargement...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-5 pb-8">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                        <Activity size={20} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h1 className={`text-xl font-semibold ${darkClasses.text}`}>Tableau de bord</h1>
                        <p className={`text-xs ${darkClasses.textMuted} mt-0.5`}>
                            Vue d'ensemble - Année {selectedYear}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative" ref={yearRef}>
                        <button
                            onClick={() => setIsYearOpen(!isYearOpen)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${darkClasses.card} ${darkClasses.text} cursor-pointer text-sm`}
                        >
                            <Calendar size={14} className="text-blue-500" />
                            <span>{selectedYear}</span>
                            <ChevronDown size={12} className={`transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isYearOpen && availableYears.length > 0 && (
                            <div className={`absolute top-full right-0 mt-1 rounded-lg border ${darkClasses.border} ${darkClasses.card} z-50 min-w-[120px] shadow-md max-h-48 overflow-y-auto`}>
                                {availableYears.map(year => (
                                    <div
                                        key={year}
                                        onClick={() => handleYearChange(year)}
                                        className={`px-3 py-2 cursor-pointer text-sm transition-colors ${selectedYear === year ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : darkClasses.textMuted} ${darkClasses.hover}`}
                                    >
                                        {year}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        className={`p-1.5 rounded-lg border ${darkClasses.card} ${darkClasses.hover} transition-all cursor-pointer`}
                        title="Rafraîchir"
                    >
                        <RefreshCw size={14} className={darkClasses.textMuted} />
                    </button>
                </div>
            </div>
            
            {/* Cartes principales */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`${darkClasses.card} rounded-lg p-3 border ${darkClasses.border}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${darkClasses.textMuted}`}>Employés</span>
                        <Users size={16} className="text-blue-500" />
                    </div>
                    <p className={`text-xl font-semibold ${darkClasses.text} mt-1`}>{stats.total_employees || 0}</p>
                    <div className="flex gap-3 mt-2 text-xs">
                        <span className={darkClasses.textMuted}>Actifs: {stats.active_employees || 0}</span>
                        <span className={darkClasses.textMuted}>Congé: {stats.conge_employees || 0}</span>
                    </div>
                </div>
                
                <div className={`${darkClasses.card} rounded-lg p-3 border ${darkClasses.border}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${darkClasses.textMuted}`}>Masse salariale</span>
                        <DollarSign size={16} className="text-emerald-500" />
                    </div>
                    <p className={`text-xl font-semibold ${darkClasses.text} mt-1`}>
                        {formatMoney(stats.total_salary)}
                    </p>
                    <div className="mt-2 text-xs">
                        <span className={darkClasses.textMuted}>
                            Salaire brut total: {formatMoney(stats.total_salary)}
                        </span>
                    </div>
                </div>
                
                <div className={`${darkClasses.card} rounded-lg p-3 border ${darkClasses.border}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${darkClasses.textMuted}`}>Crédits actifs</span>
                        <CreditCard size={16} className="text-purple-500" />
                    </div>
                    <p className={`text-xl font-semibold ${darkClasses.text} mt-1`}>{stats.active_credits || 0}</p>
                    <div className="mt-2 text-xs">
                        <span className={darkClasses.textMuted}>Montant: {formatMoney(stats.total_credit_amount)}</span>
                    </div>
                </div>
                
                <div className={`${darkClasses.card} rounded-lg p-3 border ${darkClasses.border}`}>
                    <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${darkClasses.textMuted}`}>Total déductions</span>
                        <TrendingDown size={16} className="text-rose-500" />
                    </div>
                    <p className={`text-xl font-semibold ${darkClasses.text} mt-1`}>
                        {formatMoney(stats.total_deductions_salarie)}
                    </p>
                    <div className="mt-2 text-xs">
                        <div className="flex justify-between">
                            <span className={darkClasses.textMuted}>IR: {formatMoney(stats.total_ir)}</span>
                            <span className={darkClasses.textMuted}>Crédits: {formatMoney(stats.total_credits_mensualites)}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Détails charges - 4 petites cartes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`${darkClasses.card} rounded-lg p-2 border ${darkClasses.border} text-center`}>
                    <Shield size={14} className="text-blue-500 mx-auto mb-1" />
                    <p className={`text-xs font-medium ${darkClasses.text}`}>RCAR</p>
                    <p className={`text-sm font-semibold ${darkClasses.text}`}>{formatMoney(stats.total_rcar)}</p>
                </div>
                <div className={`${darkClasses.card} rounded-lg p-2 border ${darkClasses.border} text-center`}>
                    <Building2 size={14} className="text-emerald-500 mx-auto mb-1" />
                    <p className={`text-xs font-medium ${darkClasses.text}`}>Assurances</p>
                    <p className={`text-sm font-semibold ${darkClasses.text}`}>{formatMoney(stats.total_assurances)}</p>
                </div>
                <div className={`${darkClasses.card} rounded-lg p-2 border ${darkClasses.border} text-center`}>
                    <Truck size={14} className="text-orange-500 mx-auto mb-1" />
                    <p className={`text-xs font-medium ${darkClasses.text}`}>SNTL</p>
                    <p className={`text-sm font-semibold ${darkClasses.text}`}>{formatMoney(stats.total_sntl)}</p>
                </div>
                <div className={`${darkClasses.card} rounded-lg p-2 border ${darkClasses.border} text-center`}>
                    <Percent size={14} className="text-purple-500 mx-auto mb-1" />
                    <p className={`text-xs font-medium ${darkClasses.text}`}>Taux charge</p>
                    <p className={`text-sm font-semibold ${darkClasses.text}`}>
                        {stats.total_salary > 0 ? Math.round((stats.total_charges_patronales / stats.total_salary) * 100) : 0}%
                    </p>
                </div>
            </div>
            
            {/* Graphiques Ligne 1 */}
{/* Graphiques Ligne 1 */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
    
    {/* Répartition des déductions (Pie Chart) */}
    <div className={`${darkClasses.card} rounded-lg border ${darkClasses.border} p-3`}>
        <div className="flex items-center gap-2 mb-3">
            <Percent size={14} className="text-purple-500" />
            <h3 className={`text-sm font-medium ${darkClasses.text}`}>Répartition des déductions</h3>
        </div>
        {(
            (stats.total_cotisations > 0 || stats.total_rcar > 0 || stats.total_credits_mensualites > 0 || stats.total_ir > 0)
        ) ? (
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RePieChart>
                        <Pie
                            data={[
                                { name: 'Cotisations', value: stats.total_cotisations, color: '#f59e0b' },
                                { name: 'RCAR', value: stats.total_rcar, color: '#ef4444' },
                                { name: 'Crédits', value: stats.total_credits_mensualites, color: '#8b5cf6' },
                                { name: 'IR', value: stats.total_ir, color: '#10b981' }
                            ].filter(item => item.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={75}
                            dataKey="value"
                            label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                            labelLine={{ stroke: darkMode ? '#444' : '#ccc', strokeWidth: 0.5 }}
                        >
                            {[
                                { name: 'Cotisations', value: stats.total_cotisations, color: '#f59e0b' },
                                { name: 'RCAR', value: stats.total_rcar, color: '#ef4444' },
                                { name: 'Crédits', value: stats.total_credits_mensualites, color: '#8b5cf6' },
                                { name: 'IR', value: stats.total_ir, color: '#10b981' }
                            ].filter(item => item.value > 0).map((entry, idx) => (
                                <Cell key={entry.name} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(v) => [formatMoney(v), '']} contentStyle={{ fontSize: '11px', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </RePieChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-[240px] flex items-center justify-center">
                <p className={`text-sm ${darkClasses.textMuted}`}>Aucune donnée</p>
            </div>
        )}
    </div>
    
    {/* Cotisations par organisme */}
    <div className={`${darkClasses.card} rounded-lg border ${darkClasses.border} p-3`}>
        <div className="flex items-center gap-2 mb-3">
            <Wallet size={14} className="text-emerald-500" />
            <h3 className={`text-sm font-medium ${darkClasses.text}`}>Cotisations par organisme</h3>
        </div>
        {cotisationsData.length > 0 ? (
            <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cotisationsData} layout="vertical" margin={{ left: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#e5e7eb'} />
                        <XAxis type="number" tickFormatter={(v) => formatNumber(v)} fontSize={10} stroke={darkMode ? '#6b7280' : '#9ca3af'} />
                        <YAxis type="category" dataKey="name" width={50} fontSize={10} stroke={darkMode ? '#6b7280' : '#9ca3af'} />
                        <Tooltip formatter={(v) => [formatMoney(v), '']} contentStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-[240px] flex items-center justify-center">
                <p className={`text-sm ${darkClasses.textMuted}`}>Aucune donnée</p>
            </div>
        )}
    </div>
</div>
            
            {/* Graphiques Ligne 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Statut employés */}
                <div className={`${darkClasses.card} rounded-lg border ${darkClasses.border} p-3`}>
                    <div className="flex items-center gap-2 mb-3">
                        <Users size={14} className="text-blue-500" />
                        <h3 className={`text-sm font-medium ${darkClasses.text}`}>Statut des employés</h3>
                    </div>
                    {statusData.length > 0 && statusData.some(s => s.value > 0) ? (
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={statusData.filter(s => s.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={45}
                                        outerRadius={75}
                                        dataKey="value"
                                        label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                        labelLine={{ stroke: darkMode ? '#444' : '#ccc', strokeWidth: 0.5 }}
                                    >
                                        {statusData.filter(s => s.value > 0).map((entry, idx) => (
                                            <Cell key={entry.name} fill={entry.color || COLORS[idx % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [`${v} employés`, '']} />
                                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[240px] flex items-center justify-center">
                            <p className={`text-sm ${darkClasses.textMuted}`}>Aucune donnée</p>
                        </div>
                    )}
                </div>
                
                {/* Salaire par grade */}
                <div className={`${darkClasses.card} rounded-lg border ${darkClasses.border} p-3`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Briefcase size={14} className="text-purple-500" />
                            <h3 className={`text-sm font-medium ${darkClasses.text}`}>Masse salariale par grade</h3>
                        </div>
                        <span className={`text-[10px] ${darkClasses.textMuted}`}>
                            Total: {formatMoney(salaryByGrade.reduce((sum, g) => sum + (g.total || 0), 0))}
                        </span>
                    </div>
                    
                    {salaryByGrade.length > 0 ? (
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={salaryByGrade.slice(0, 8)} 
                                    layout="horizontal" 
                                    margin={{ top: 10, right: 10, left: 10, bottom: 50 }}
                                    barSize={40}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#e5e7eb'} vertical={false} />
                                    <XAxis 
                                        dataKey="name" 
                                        fontSize={11} 
                                        angle={-35} 
                                        textAnchor="end" 
                                        height={65} 
                                        tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }}
                                        interval={0}
                                    />
                                    <YAxis fontSize={11} tickFormatter={(v) => formatNumber(v)} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#6b7280' }} width={50}/>
                                    <Tooltip 
                                        formatter={(value) => [formatMoney(value), 'Masse salariale']}
                                        contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                                    />
                                    <Bar 
                                        dataKey="total" 
                                        name="Masse salariale"
                                        fill="#8b5cf6" 
                                        radius={[6, 6, 0, 0]} 
                                        maxBarSize={50}
                                        label={{ 
                                            position: 'top', 
                                            fontSize: 9,
                                            formatter: (v) => formatNumber(v),
                                            fill: darkMode ? '#9ca3af' : '#6b7280'
                                        }}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[240px] flex flex-col items-center justify-center gap-2">
                            <Briefcase size={32} className={darkClasses.textMuted} />
                            <p className={`text-sm ${darkClasses.textMuted}`}>Aucune donnée disponible</p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Crédits par année */}
            {creditsByYear && creditsByYear.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    <div className={`${darkClasses.card} rounded-lg border ${darkClasses.border} p-3`}>
                        <div className="flex items-center gap-2 mb-3">
                            <CreditCard size={14} className="text-purple-500" />
                            <h3 className={`text-sm font-medium ${darkClasses.text}`}>Crédits par année</h3>
                        </div>
                        <div className="h-[260px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart 
                                    data={[...creditsByYear].sort((a, b) => a.year - b.year)} 
                                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#e5e7eb'} />
                                    <XAxis dataKey="year" fontSize={12} tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                                    <YAxis fontSize={12} tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#6b7280' }} />
                                    <Tooltip formatter={(value) => [`${value} crédits`, 'Total']} contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                                    <Bar dataKey="total" name="Nombre de crédits" fill="#8b5cf6" radius={[6, 6, 0, 0]} label={{ position: 'top', fontSize: 11, fill: darkMode ? '#a78bfa' : '#6d28d9' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}