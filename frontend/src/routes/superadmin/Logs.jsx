import React, { useState, useEffect } from 'react';
import api from "../../lib/apis/axiosConfig";
import { icons } from '../../lib/icons/icons';
import { Trash2, Clock, Search, Loader2, Settings2, ArrowLeft, Activity, Calendar, User, FileText } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import DeleteConfirmModal from '../../lib/components/DeleteConfirmModal';

export default function Logs() {
    const { darkMode } = useTheme();
    const { showNotification } = useNotification();
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [limit, setLimit] = useState(10);

    // Dark mode classes
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-gray-50';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-gray-100';
    const textClass = darkMode ? 'text-gray-100' : 'text-slate-900';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-100';
    const inputClass = darkMode 
        ? 'pl-10 pr-4 py-2 bg-[#252525] border border-[#333] rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-80 shadow-sm transition-all text-white placeholder-gray-500'
        : 'pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-80 shadow-sm transition-all';

    // State dial Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        onConfirm: () => {},
        title: "",
        message: ""
    });

    const fetchActivities = async (newLimit = 10) => {
        setLoading(true);
        try {
            const response = await api.get(`/api/activity-logs?limit=${newLimit}`);
            setActivities(response.data.data || []);
            setLimit(newLimit);
        } catch (error) {
            console.error("Erreur fetch logs:", error);
            showNotification("Erreur lors du chargement des logs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(10);
    }, []);

    const closeConfirm = () => setConfirmConfig({ ...confirmConfig, isOpen: false });

    const openDeleteModal = (id) => {
        setConfirmConfig({
            isOpen: true,
            title: "Supprimer l'activité",
            message: "Êtes-vous sûr de vouloir supprimer définitivement ce log ? Cette action est irréversible.",
            onConfirm: () => handleDelete(id)
        });
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/api/activity-logs/${id}`);
            setActivities(prev => prev.filter(log => log.id !== id));
            showNotification("Log supprimé avec succès", "success");
        } catch (error) {
            console.error("Erreur suppression:", error);
            showNotification("Échec de la suppression", "error");
        } finally {
            closeConfirm();
        }
    };
    const filteredLogs = activities.filter(log => {
        const search = searchTerm.toLowerCase();
        const userName = log.user?.full_name?.toLowerCase() || "système";
        const titre = log.titre?.toLowerCase() || "";
        const type = log.action_type?.toLowerCase() || "";
        return userName.includes(search) || titre.includes(search) || type.includes(search);
    });

    // Get color based on action type
    const getActionColor = (actionType) => {
        const colors = {
            'CREATE': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
            'UPDATE': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            'DELETE': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
            'LOGIN': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            'LOGOUT': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
        };
        return colors[actionType] || 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 p-6 ${bgClass}`}>
            <div className="max-w-7xl mx-auto">
                
                {/* Header avec bouton retour */}
                <div className="mb-8">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Settings2 size={24} className="text-indigo-500" />
                            <h1 className={`text-2xl font-bold ${textClass}`}>Journal d'activités</h1>
                        </div>
                    </div>
                    <p className={`text-sm ${textMutedClass} mt-1 ml-12`}>
                        Traçabilité complète des actions effectuées sur <span className="font-bold text-indigo-600 dark:text-indigo-400">OptizaRH</span>
                    </p>
                </div>
                {/* Main Card */}
                <div className={`${cardClass} rounded-2xl border ${borderClass} shadow-sm overflow-hidden`}>
                    <div className={`p-6 border-b ${borderClass} flex justify-between items-center flex-wrap gap-4`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <Clock size={20} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className={`text-lg font-bold ${textClass}`}>Historique Système</h2>
                                <p className={`text-xs ${textMutedClass}`}>Chronologie des actions récentes</p>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <input 
                                type="text"
                                placeholder="Rechercher par utilisateur..."
                                className={inputClass}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search size={18} className={`absolute left-3 top-2.5 ${textMutedClass}`} />
                        </div>
                    </div>

                    <div className="p-6">
                        {loading ? (
                            <div className="py-20 text-center flex flex-col items-center gap-3">
                                <Loader2 className="animate-spin text-indigo-600" size={32} />
                                <span className={`font-bold uppercase tracking-widest text-xs ${textMutedClass}`}>Chargement...</span>
                            </div>
                        ) : filteredLogs.length > 0 ? (
                            <div className="space-y-6">
                                {filteredLogs.map((log) => (
                                    <div key={log.id} className={`p-5 rounded-xl border ${borderClass} hover:shadow-md transition-all group`}>
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${getActionColor(log.action_type)}`}>
                                                    <span className="text-[10px] font-black uppercase">
                                                        {log.action_type?.substring(0, 3) || 'LOG'}
                                                    </span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <h3 className={`font-bold text-base ${textClass}`}>{log.titre}</h3>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getActionColor(log.action_type)}`}>
                                                            {log.action_type || 'ACTION'}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm ${textMutedClass} leading-relaxed`}>
                                                        {log.description}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <p className={`text-[10px] font-bold flex items-center gap-1 uppercase ${textMutedClass}`}>
                                                            <span className="text-indigo-600 dark:text-indigo-400">PAR:</span> 
                                                            <span className={`font-medium ${textClass}`}>{log.user?.full_name || 'SYSTÈME'}</span>
                                                        </p>
                                                        <div className={`text-[10px] px-2 py-1 rounded-lg ${darkMode ? 'bg-[#252525] text-gray-400' : 'bg-gray-100 text-gray-600'} flex items-center gap-1`}>
                                                            <Calendar size={10} />
                                                            {new Date(log.created_at).toLocaleString('fr-FR', { 
                                                                day: '2-digit', 
                                                                month: 'short', 
                                                                year: 'numeric',
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => openDeleteModal(log.id)}
                                                className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className={`py-20 text-center border-2 border-dashed ${borderClass} rounded-2xl`}>
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${darkMode ? 'bg-[#252525]' : 'bg-gray-100'}`}>
                                    <Search size={32} className="text-gray-300" />
                                </div>
                                <p className={`font-medium ${textMutedClass}`}>Aucun log trouvé</p>
                                <p className={`text-xs ${textMutedClass} mt-1`}>Aucune activité correspondant à votre recherche</p>
                            </div>
                        )}
                    </div>

                    {/* Footer Pagination */}
                    {activities.length > 0 && (
                        <div className={`p-4 border-t ${borderClass} text-center`}>
                            {limit === 10 && activities.length >= 10 ? (
                                <button 
                                    onClick={() => fetchActivities(100)} 
                                    className="text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-widest hover:underline transition-all cursor-pointer"
                                >
                                    Voir tout ({activities.length} / {limit})
                                </button>
                            ) : limit > 10 ? (
                                <button 
                                    onClick={() => fetchActivities(10)} 
                                    className="text-gray-400 font-bold text-xs uppercase tracking-widest hover:underline transition-all cursor-pointer"
                                >
                                    Réduire
                                </button>
                            ) : null}
                        </div>
                    )}
                </div>

                {/* Modal de Confirmation */}
                <DeleteConfirmModal 
                    isOpen={confirmConfig.isOpen}
                    onClose={closeConfirm}
                    onConfirm={confirmConfig.onConfirm}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    darkMode={darkMode}
                />
            </div>
        </div>
    );
}