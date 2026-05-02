// resources/js/routes/superadmin/Dashboard.jsx

import React, { useState, useEffect } from 'react';
import {
    Users, UserCheck, UserX, Calendar, TrendingUp, TrendingDown,
    DollarSign, CreditCard, Shield, Building2, PieChart,
    Activity, RefreshCw, ChevronDown,
    Briefcase, Wallet, Percent, Award, Target, Zap
} from 'lucide-react';
import axiosClient from "../../lib/apis/axiosConfig";
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart,
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
    
    // Dark mode classes
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-200';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    
    // Couleurs
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'];
    
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
            setAvailableYears(res.data.available_years || []);
        } catch (err) {
            console.error(err);
            showNotification("❌ Erreur chargement dashboard", "error");
        } finally {
            setLoading(false);
        }
    };
    
    const handleYearChange = (year) => {
        setSelectedYear(year);
        setIsYearOpen(false);
    };
    
    const formatMoney = (num) => {
        if (!num) return '0 DH';
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
    
    const monthlyData = charts.monthly_evolution?.length > 0 ? charts.monthly_evolution : [];
    const creditsData = charts.credits_by_category?.length > 0 ? charts.credits_by_category : [];
    const cotisationsData = charts.cotisations_details?.length > 0 ? charts.cotisations_details : [];
    const statusData = charts.employee_status?.length > 0 ? charts.employee_status : [];
    
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className={`text-sm ${textMutedClass}`}>Chargement...</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`min-h-screen p-6 transition-colors duration-300 ${bgClass}`}>
            <div className="max-w-7xl mx-auto">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
                                <Activity size={24} className="text-white" />
                            </div>
                            <div>
                                <h1 className={`text-2xl font-bold ${textClass}`}>Tableau de bord</h1>
                                <p className={`text-sm ${textMutedClass} mt-0.5`}>
                                    Vue d'ensemble de la gestion RH et financière
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative" ref={yearRef}>
                            <button
                                onClick={() => setIsYearOpen(!isYearOpen)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${cardClass} ${textClass} cursor-pointer hover:border-indigo-400 transition-all`}
                            >
                                <Calendar size={16} className="text-indigo-500" />
                                <span className="font-semibold">{selectedYear}</span>
                                <ChevronDown size={14} className={`text-indigo-500 transition-transform ${isYearOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isYearOpen && (
                                <div className={`absolute top-full right-0 mt-2 rounded-xl border ${borderClass} ${cardClass} z-50 min-w-[140px] shadow-lg`}>
                                    {availableYears.map(year => (
                                        <div
                                            key={year}
                                            onClick={() => handleYearChange(year)}
                                            className={`px-4 py-2.5 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm transition-colors ${selectedYear === year ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-medium' : textClass}`}
                                        >
                                            {year}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className={`p-2 rounded-xl border ${borderClass} hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer`}
                            title="Rafraîchir"
                        >
                            <RefreshCw size={18} className={textMutedClass} />
                        </button>
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                    <div className={`${cardClass} rounded-xl p-5 border ${borderClass} shadow-sm`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${textMutedClass}`}>Total Employés</p>
                                <p className={`text-3xl font-bold ${textClass} mt-1`}>{stats.total_employees || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                <Users size={22} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mt-4 pt-3 border-t dark:border-gray-700">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span className={`text-xs ${textMutedClass}`}>Actifs: {stats.active_employees || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                <span className={`text-xs ${textMutedClass}`}>Congé: {stats.conge_employees || 0}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`${cardClass} rounded-xl p-5 border ${borderClass} shadow-sm`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${textMutedClass}`}>Masse Salariale</p>
                                <p className={`text-2xl font-bold ${textClass} mt-1`}>{formatMoney(stats.total_salary)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <DollarSign size={22} className="text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                            <div className="flex items-center gap-1">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span className={`text-xs ${textMutedClass}`}>Mensuel: {formatMoney((stats.total_salary || 0) / 12)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className={`${cardClass} rounded-xl p-5 border ${borderClass} shadow-sm`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${textMutedClass}`}>Crédits Actifs</p>
                                <p className={`text-3xl font-bold ${textClass} mt-1`}>{stats.active_credits || 0}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30">
                                <CreditCard size={22} className="text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                            <span className={`text-xs ${textMutedClass}`}>Montant total: {formatMoney(stats.total_credit_amount)}</span>
                        </div>
                    </div>
                    
                    <div className={`${cardClass} rounded-xl p-5 border ${borderClass} shadow-sm`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`text-sm font-medium ${textMutedClass}`}>Total Charges</p>
                                <p className={`text-2xl font-bold ${textClass} mt-1`}>{formatMoney(stats.total_charges)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-900/30">
                                <TrendingDown size={22} className="text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t dark:border-gray-700">
                            <span className={`text-xs ${textMutedClass}`}>Cotisations: {formatMoney(stats.total_cotisations)}</span>
                        </div>
                    </div>
                </div>
                
                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    
                    {/* Évolution Mensuelle */}
                    <div className={`${cardClass} rounded-xl border ${borderClass} p-5 shadow-sm`}>
                        <div className="mb-4">
                            <h3 className={`font-semibold ${textClass}`}>Évolution mensuelle</h3>
                            <p className={`text-xs ${textMutedClass} mt-0.5`}>Salaires vs Cotisations</p>
                        </div>
                        {monthlyData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={monthlyData}>
                                    <defs>
                                        <linearGradient id="gradientSalary" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="gradientCotisation" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#e5e7eb'} />
                                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} />
                                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} fontSize={12} tickFormatter={(v) => formatNumber(v)} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: darkMode ? '#1a1a1a' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => [formatMoney(value), '']}
                                    />
                                    <Legend />
                                    <Area type="monotone" dataKey="salaires" name="Salaires" stroke="#6366f1" strokeWidth={2} fill="url(#gradientSalary)" />
                                    <Area type="monotone" dataKey="cotisations" name="Cotisations" stroke="#f43f5e" strokeWidth={2} fill="url(#gradientCotisation)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className={`text-sm ${textMutedClass}`}>Aucune donnée disponible</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Crédits par Catégorie */}
                    <div className={`${cardClass} rounded-xl border ${borderClass} p-5 shadow-sm`}>
                        <div className="mb-4">
                            <h3 className={`font-semibold ${textClass}`}>Crédits par catégorie</h3>
                            <p className={`text-xs ${textMutedClass} mt-0.5`}>Répartition des produits</p>
                        </div>
                        {creditsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RePieChart>
                                    <Pie
                                        data={creditsData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="total"
                                        label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                                        labelLine={false}
                                    >
                                        {creditsData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} crédits`, '']} />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className={`text-sm ${textMutedClass}`}>Aucune donnée disponible</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    
                    {/* Répartition des Cotisations */}
                    <div className={`${cardClass} rounded-xl border ${borderClass} p-5 shadow-sm`}>
                        <div className="mb-4">
                            <h3 className={`font-semibold ${textClass}`}>Répartition des cotisations</h3>
                            <p className={`text-xs ${textMutedClass} mt-0.5`}>Par organisme</p>
                        </div>
                        {cotisationsData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={cotisationsData} layout="vertical" margin={{ left: 80 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#333' : '#e5e7eb'} />
                                    <XAxis type="number" tickFormatter={(v) => formatNumber(v)} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                                    <YAxis type="category" dataKey="name" width={100} stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                                    <Tooltip formatter={(value) => [formatMoney(value), '']} />
                                    <Bar dataKey="total" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className={`text-sm ${textMutedClass}`}>Aucune donnée disponible</p>
                            </div>
                        )}
                    </div>
                    
                    {/* Statut des Employés */}
                    <div className={`${cardClass} rounded-xl border ${borderClass} p-5 shadow-sm`}>
                        <div className="mb-4">
                            <h3 className={`font-semibold ${textClass}`}>Statut des employés</h3>
                            <p className={`text-xs ${textMutedClass} mt-0.5`}>Répartition par statut</p>
                        </div>
                        {statusData.length > 0 && statusData.some(s => s.value > 0) ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RePieChart>
                                    <Pie
                                        data={statusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : ''}
                                        labelLine={{ stroke: darkMode ? '#444' : '#ccc', strokeWidth: 1 }}
                                    >
                                        {statusData.map((entry) => (
                                            <Cell key={entry.name} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} employés`, '']} />
                                    <Legend verticalAlign="bottom" height={40} />
                                </RePieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center">
                                <p className={`text-sm ${textMutedClass}`}>Aucune donnée disponible</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer */}
                <div className="text-center py-6">
                    <p className={`text-xs ${textMutedClass}`}>
                        Dernière mise à jour: {new Date().toLocaleString('fr-FR')}
                    </p>
                </div>
            </div>
        </div>
    );
}