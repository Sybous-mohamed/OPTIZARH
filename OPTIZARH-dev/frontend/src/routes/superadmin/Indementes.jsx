import React, { useState, useEffect } from 'react';
import api from "../../lib/apis/axiosConfig";
import { icons } from '../../lib/icons/icons';

export default function Indementes() {
    // 1. States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [indemnites, setIndemnites] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [availableYears, setAvailableYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [activities, setActivities] = useState([]);
    const [limit, setLimit] = useState(10);

    const [formData, setFormData] = useState({
        nom: "",
        type: "FIXE",
        valeur: "",
        annee: new Date().getFullYear(),
        tous_employes: false,
        grade: "",
        echelle: "",
        echelon: "",
        statut: true
    });

    // Données pour les sélections
    const grades = ["A", "B", "C", "D"];
    const echelles = Array.from({ length: 12 }, (_, i) => i + 1);
    const echelons = Array.from({ length: 10 }, (_, i) => i + 1);

    // 2. Fetch Data from DB
    const fetchIndemnites = async () => {
        try {
            const response = await api.get('/api/indemnites');
            const years = response.data.available_years || [];
            setIndemnites(response.data.data || []); 
            setAvailableYears(years);
            if (years.length > 0) {
                setSelectedYear(prev => prev === "" ? years[0].toString() : prev);
            }
            setLoading(false);
        } catch (error) {
            console.error("Erreur fetch:", error);
            setLoading(false);
        }
    };

    const fetchActivities = async (newLimit = 10) => {
        try {
            const response = await api.get(`/api/activity-logs?limit=${newLimit}`);
            setActivities(response.data.data); 
            setLimit(newLimit);
        } catch (error) {
            console.error("Erreur fetch logs:", error);
        }
    };

    useEffect(() => {
        fetchIndemnites();
        fetchActivities(10);
    }, []);

    const filteredIndemnites = indemnites.filter(item => 
        item.annee.toString() === selectedYear
    );

    const totalMasse = filteredIndemnites
        .filter(item => item.statut && item.type === 'FIXE')
        .reduce((sum, item) => sum + parseFloat(item.valeur || 0), 0);

    // 4. Handlers
    const handleToggleStatut = async (id) => {
        try {
            await api.patch(`/api/indemnites/${id}/toggle-statut`);
            setIndemnites(prev => 
                prev.map(item => 
                    item.id === id ? { ...item, statut: !item.statut } : item
                )
            );
            fetchActivities();
        } catch (error) {
            console.error("Erreur Toggle Statut:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cette indemnité")) {
            try {
                await api.delete(`/api/indemnites/${id}`);
                fetchIndemnites();
                fetchActivities();
            } catch (error) {
                console.error("Erreur Delete:", error);
            }
        }
    };

    const openEditModal = (item) => {
        setIsEditing(true);
        setCurrentId(item.id);
        setFormData({
            nom: item.nom,
            type: item.type,
            valeur: item.valeur,
            annee: item.annee,
            tous_employes: !!item.tous_employes,
            grade: item.grade || "",
            echelle: item.echelle || "",
            echelon: item.echelon || "",
            statut: !!item.statut
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (isEditing) {
                await api.put(`/api/indemnites/${currentId}`, formData);
            } else {
                await api.post('/api/indemnites', formData);
            }
            setIsModalOpen(false);
            fetchIndemnites();
            fetchActivities(limit);
            setFormData({
                nom: "", type: "FIXE", valeur: "", annee: new Date().getFullYear(),
                tous_employes: false, grade: "", echelle: "", echelon: "", statut: true
            });
        } catch (error) {
            console.error("Erreur Save:", error);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen font-sans">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Gestion des Indemnités</h1>
                    <p className="text-gray-500 text-sm mt-1">Exercice fiscal en cours : <span className="font-bold text-indigo-600">{selectedYear}</span></p>
                </div>
                
                {/* Dynamique Years Filter */}
                <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
                    {availableYears.length > 0 ? (
                        availableYears.map((year) => (
                            <button 
                                key={year} 
                                onClick={() => setSelectedYear(year.toString())}
                                className={`px-4 py-1 rounded-md text-sm transition ${year.toString() === selectedYear ? "bg-indigo-100 text-indigo-700 font-bold" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                {year}
                            </button>
                        ))
                    ) : (
                        <span className="px-4 py-1 text-sm text-gray-300 italic">Aucune donnée</span>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Indemnités Actives ({selectedYear})</p>
                    <div className="flex items-baseline gap-2 mt-2">
                        <span className="text-3xl font-black text-indigo-900">
                            {filteredIndemnites.filter(i => i.statut).length}
                        </span>
                        <span className="text-gray-400 text-xs">sur {filteredIndemnites.length} total</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl border-l-4 border-l-indigo-500 border border-gray-100 shadow-sm">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Masse Salariale Mensuelle (Fixe)</p>
                    <div className="mt-2 text-3xl font-black text-slate-800">
                        {totalMasse.toLocaleString()} <span className="text-lg font-bold text-gray-400">DH</span>
                    </div>
                    <p className="text-[10px] text-indigo-400 font-bold mt-2 italic">Basé sur les éléments actifs de {selectedYear}</p>
                </div>
            </div>

            {/* Main Table Section */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800">Détails des Indemnités - {selectedYear}</h2>
                    <button 
                        onClick={() => { setIsEditing(false); setIsModalOpen(true); }}
                        className="bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-800 transition"
                    >
                        + Ajouter
                    </button>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-y border-gray-100 text-[10px] uppercase text-gray-400 tracking-widest font-black">
                        <tr>
                            <th className="px-6 py-4">Nom</th>
                            <th className="px-6 py-4 text-center">Type</th>
                            <th className="px-6 py-4">Valeur</th>
                            <th className="px-6 py-4">Cible</th>
                            <th className="px-6 py-4">Statut</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10">Chargement...</td></tr>
                        ) : filteredIndemnites.length > 0 ? (
                            filteredIndemnites.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-bold text-slate-700">{item.nom}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded text-[9px] font-black ${item.type === 'FIXE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-black text-slate-800">{item.valeur} {item.type === 'FIXE' ? 'DH' : '%'}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[11px] font-bold">
                                            {item.tous_employes ? "Tous les employés" : `Grade ${item.grade || '-'}/Echelle ${item.echelle || '-'} /Echelon ${item.echelon || '-'}`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div 
                                            onClick={() => handleToggleStatut(item.id)}
                                            className={`w-10 h-5 rounded-full relative cursor-pointer transition-all duration-300 ${item.statut ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                        >
                                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300 ${item.statut ? 'left-6' : 'left-1'}`}></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 text-lg">
                                        <button onClick={() => openEditModal(item)} className="mr-3 hover:text-indigo-600 transition">✎</button>
                                        <button onClick={() => handleDelete(item.id)} className="hover:text-red-500 transition">🗑</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-400">Aucune donnée pour {selectedYear}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            
            {/* --- MODAL SECTION --- */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-slate-800">
                                {isEditing ? "Modifier l'indemnité" : "Nouvelle Indemnité"}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>

                        {/* Form Body */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Nom de l'indemnité</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                                    placeholder="Ex: Prime de transport"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Type</label>
                                    <select 
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="FIXE">FIXE (DH)</option>
                                        <option value="POURCENTAGE">POURCENTAGE (%)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Valeur</label>
                                    <input 
                                        type="number" 
                                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                        value={formData.valeur}
                                        onChange={(e) => setFormData({...formData, valeur: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-1">Année d'application</label>
                                <input 
                                    type="number" 
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                                    value={formData.annee}
                                    onChange={(e) => setFormData({...formData, annee: e.target.value})}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                                <input 
                                    type="checkbox" 
                                    id="tous"
                                    checked={formData.tous_employes}
                                    onChange={(e) => setFormData({...formData, tous_employes: e.target.checked})}
                                    className="w-4 h-4 accent-indigo-600"
                                />
                                <label htmlFor="tous" className="text-sm font-bold text-indigo-900 leading-none">Appliquer à tous les employés</label>
                            </div>

                            {!formData.tous_employes && (
                                <div className="grid grid-cols-3 gap-2 animate-in slide-in-from-top-2 duration-300">
                                    <select 
                                        className="border border-gray-200 rounded-lg px-2 py-2 text-sm"
                                        value={formData.grade}
                                        onChange={(e) => setFormData({...formData, grade: e.target.value})}>
                                        <option value="">Grade</option>
                                        {grades.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                    <select 
                                        className="border border-gray-200 rounded-lg px-2 py-2 text-sm"
                                        value={formData.echelle}
                                        onChange={(e) => setFormData({...formData, echelle: e.target.value})}>
                                        <option value="">Echelle</option>
                                        {echelles.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                    <select 
                                        className="border border-gray-200 rounded-lg px-2 py-2 text-sm"
                                        value={formData.echelon}
                                        onChange={(e) => setFormData({...formData, echelon: e.target.value})}>
                                        <option value="">Echelon</option>
                                        {echelons.map(e => <option key={e} value={e}>{e}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Statut de l'indemnité</p>
                                    <p className="text-[10px] text-gray-400 uppercase font-black">Activer ou désactiver immédiatement</p>
                                </div>
                                <div 
                                    onClick={() => setFormData({...formData, statut: !formData.statut})}
                                    className={`w-12 h-6 rounded-full relative cursor-pointer transition-all duration-300 ${formData.statut ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${formData.statut ? 'left-7' : 'left-1'}`}></div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg transition">
                                Annuler
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-lg shadow-indigo-200 transition">
                                {isEditing ? "Mettre à jour" : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mt-10">
                <div className="flex items-center gap-3 mb-8">
                    <span className="text-2xl text-indigo-900">{icons.ClockIcon}</span>
                    <h2 className="text-xl font-black text-indigo-950">Historique des modifications</h2>
                </div>

                <div className="space-y-8">
                    {activities.length > 0 ? (
                        activities.map((log) => (
                            <div key={log.id} className="flex items-start justify-between group">
                                <div className="flex gap-6">
                                    <div className="w-12 h-12 rounded-full border-2 border-indigo-50 flex items-center justify-center text-xs font-black text-indigo-600 bg-indigo-50/30">
                                        {log.annee || new Date(log.created_at).getFullYear()}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-800 text-sm">{log.titre}</h3>
                                        <p className="text-xs text-gray-400 mt-1">{log.description}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[11px] font-black text-slate-800">
                                        {log.created_at ? new Date(log.created_at).toLocaleDateString('fr-FR') : 'Date inconnue'}
                                    </p>
                                    <p className="text-[10px] text-gray-300 uppercase font-bold mt-1">
                                        Par {log.user ? log.user.name : 'Admin'}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-10 text-center border-2 border-dashed border-gray-100 rounded-xl">
                            <p className="text-gray-400 text-sm italic">Aucun historique disponible pour le moment.</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-center">
                    {limit === 10 && activities.length >= 10 ? (
                        <button 
                            onClick={() => fetchActivities(100)} 
                            className="text-indigo-600 font-black text-xs uppercase tracking-widest hover:underline">
                            Voir tout l'historique
                        </button>
                    ) : limit > 10 ? (
                        <button 
                            onClick={() => fetchActivities(10)} 
                            className="text-gray-400 font-black text-xs uppercase tracking-widest hover:underline">
                            Réduire à 10 derniers
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}