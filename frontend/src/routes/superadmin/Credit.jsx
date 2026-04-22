import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/apis/axiosConfig';
import { Plus, Home, Car, User, PieChart, FileText, X, MoreVertical, Settings2, Trash2, Power, Calculator, TrendingUp, Clock } from 'lucide-react';
import {useNotification} from '../../context/NotificationContext';
const GestionCredits = () => {
    const [credits, setCredits] = useState([]);
    const [activeTab, setActiveTab] = useState('TOUS');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCredit, setSelectedCredit] = useState(null);

    const fetchCredits = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/credits');
            setCredits(Array.isArray(response.data) ? response.data : []);
        } catch (error) { 
            console.error(error); 
        } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchCredits(); }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("waaach ghadiii tmsseee7 "))
             return;
        try {
            await api.delete(`/api/credits/${id}`);
            fetchCredits();
        } catch (error) { console.error(error); }
    };

    const toggleStatus = async (credit) => {
        try {
            await api.patch(`/api/credits/${credit.id}/toggle`);
            fetchCredits();
        } catch (error) { console.error(error); }
    };

    const filteredCredits = credits.filter(c => activeTab === 'TOUS' || c.category.toUpperCase() === activeTab);

    return (
     <div className="bg-white min-h-screen font-sans text-slate-800 dark:bg-black dark:text-white">
    <main className="max-w-[1600px] mx-auto p-8">
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-3xl font-bold text-[#1B2559] mb-2 dark:text-white">Gestion des Crédits</h1>
                <p className="text-slate-500 text-sm max-w-2xl dark:text-gray-400">
                    Configurez les produits financiers, définissez les plafonds et gérez les conditions d'éligibilité pour l'ensemble des collaborateurs.
                </p>
            </div>
            <button onClick={() => { setSelectedCredit(null); setIsModalOpen(true); }}
                className="bg-[#4318FF] hover:bg-[#3311CC] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer">
                <Plus size={20} strokeWidth={3} /> Ajouter un crédit
            </button>
        </div>

        <div className="grid grid-cols-6">
            <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="bg-white rounded-[20px] p-6 shadow-sm border border-slate-100 dark:bg-[#111111] dark:border-white/5 dark:shadow-none">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-black text-[#1B2559] uppercase tracking-wider flex items-center gap-2 dark:text-white">
                            <div className="w-1 h-4 bg-indigo-500 rounded-full" /> PRODUITS DE CRÉDIT ACTIFS
                        </h3>
                        <div className="flex bg-[#F4F7FE] p-1 rounded-xl gap-1 dark:bg-black dark:border dark:border-white/5">
                            {['TOUS', 'IMMOBILIER', 'CONSOMMATION','TRANSPORT'].map(tab => (
                                <button key={tab} onClick={() => setActiveTab(tab)} 
                                    className={`px-4 py-1.5 rounded-lg text-[10px] cursor-pointer font-bold transition-all 
                                    ${activeTab === tab 
                                        ? 'bg-white text-[#4318FF] shadow-sm dark:bg-[#1A1A1A] dark:text-white' 
                                        : 'text-slate-400 dark:text-gray-500'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-white/5 dark:text-gray-500">
                                    <th className="pb-4 font-bold">Nom du produit</th>
                                    <th className="pb-4 font-bold">Catégorie</th>
                                    <th className="pb-4 font-bold text-center">Montant Max</th>
                                    <th className="pb-4 font-bold text-center">Durée</th>
                                    <th className="pb-4 font-bold">Statut</th>
                                    <th className="pb-4 font-bold text-right pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/[0.02]">
                                {filteredCredits.map((credit) => (
                                    <CreditRow key={credit.id} credit={credit} onEdit={() => {setSelectedCredit(credit); setIsModalOpen(true);}} onDelete={handleDelete} onToggle={toggleStatus} />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </main>

    {isModalOpen && (
        <CreditModal credit={selectedCredit} credits={credits} onClose={() => setIsModalOpen(false)} onSuccess={fetchCredits} />
    )}
</div>
    );
};


const CreditRow = ({ credit, onEdit, onDelete, onToggle }) => {
    const [open, setOpen] = useState(false);
    const icons = { Immobilier: <Home size={18}/>, Transport: <Car size={18}/>, Consommation: <User size={18}/> };

    return (
       <tr className="group hover:bg-slate-50 transition-all dark:hover:bg-white/[0.02] border-b border-slate-50 dark:border-white/5">
        <td className="py-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#F4F7FE] text-indigo-500 flex items-center justify-center border border-indigo-50 dark:bg-[#1A1A1A] dark:border-white/5 dark:text-indigo-400">
                {icons[credit.category] || <FileText size={18} />}
            </div>
            <div>
                <p className="text-sm font-bold text-[#1B2559] dark:text-white">{credit.name}</p>
                <p className="text-[10px] text-slate-400 font-medium dark:text-gray-500">{credit.type}</p>
            </div>
        </td>
        <td className="py-6">
            <span className="px-3 py-1 rounded-full bg-[#F4F7FE] text-indigo-500 text-[10px] font-bold dark:bg-[#1A1A1A] dark:text-indigo-300">
                {credit.category}
            </span>
        </td>
        <td className="py-6 text-center text-sm font-black text-[#1B2559] dark:text-white">
            {new Intl.NumberFormat('fr-MA').format(credit.max_amount)} DH
        </td>
        <td className="py-6 text-center text-[11px] font-bold text-slate-500 dark:text-gray-400">
            {credit.max_duration / 12} ans
        </td>
        <td className="py-6">
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${credit.status === 'Actif' ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                <span className={`text-[10px] font-bold uppercase ${credit.status === 'Actif' ? 'text-emerald-500' : 'text-orange-400'}`}>
                    {credit.status}
                </span>
            </div>
        </td>
        <td className="py-6 text-right pr-4 relative">
            <div className="flex flex-row justify-end gap-2">
                <button onClick={() => {onToggle(credit);}} className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all cursor-pointer">
                    <Power size={14}/> 
                </button>
                <button onClick={() => {onEdit();}} className="p-2 text-slate-400 hover:text-indigo-500 dark:text-gray-500 rounded-lg transition-all cursor-pointer">
                    <Settings2 size={14}/>
                </button>
                <button onClick={() => {onDelete(credit.id);}} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer">
                    <Trash2 size={14}/>
                </button>
            </div>
        </td>
    </tr>
    );
};



const CreditModal = ({ credit, onClose, onSuccess }) => {
    const { showNotification } = useNotification();
    const [data, setData] = useState(credit || { 
        name: '', 
        type: 'Crédit Principal', 
        category: 'Immobilier', 
        max_amount: '', 
        interest_rate: '', 
        max_duration: '',
        status: 'Actif'
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (data.max_amount <= 0) {
            showNotification("Le montant maximum doit être supérieur à 0", "error");
            return;
        }
        if (parseFloat(data.max_amount) > 90999999999) {
            showNotification("Le montant est trop élevé, veuillez saisir une valeur raisonnable.", "error");
            return;
        }
        if (data.interest_rate < 0 || data.interest_rate > 100) {
            showNotification("Le taux d'intérêt doit être entre 0% et 100%", "error");
            return;
        }
        if (data.max_duration <= 0) {
            showNotification("La durée doit être d'au moins 1 mois", "error");
            return;
        }

        if (!data.name.trim()) {
            showNotification("Le nom du crédit est obligatoire", "error");
            return;
        }

        try {
            const payload = {
                ...data,
                max_amount: parseFloat(data.max_amount),
                interest_rate: parseFloat(data.interest_rate || 0),
                max_duration: parseInt(data.max_duration)
            };

            if (credit) {
                await api.put(`/api/credits/${credit.id}`, payload);
                showNotification(`Le crédit ${data.name} a été modifié !`, "success");
            } else {
                await api.post('/api/credits', payload);
                showNotification(`Le crédit ${data.name} a été créé !`, "success");
            }
            
            onSuccess(); 
            onClose();
        } catch (error) {
            if (error.response && error.response.status === 422) {
                const errors = error.response.data.errors;
                const firstError = Object.values(errors)[0][0];
                showNotification(firstError, "error");
            } else {
                showNotification("Une erreur serveur est survenue", "error");
            }
        }
    };
    const preventMinus = (e) => {
        if (e.key === '-' || e.key === 'e' || e.key === 'E') {
            e.preventDefault();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex justify-center items-center z-[100] p-4 ">
            <form onSubmit={handleSubmit} className="bg-white dark:bg-[#0D0D0D] w-full max-w-[500px] rounded-[24px] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border dark:border-white/10">
                
                {/* Header Modal */}
                <div className="p-8 pb-4 flex justify-between items-start border-b border-slate-100 dark:border-white/5 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-[#1B2559] dark:text-white tracking-tight">
                            {credit ? 'Modifier le Produit' : 'Nouveau Produit de Crédit'}
                        </h2>
                        <p className="text-slate-400 dark:text-gray-500 text-sm mt-1">Configuration des paramètres et éligibilité</p>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg text-slate-400 transition-all cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                    <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-[#4318FF] dark:text-indigo-400 uppercase tracking-[0.1em]">Informations Générales</h3>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#1B2559] dark:text-gray-300 ml-1">Nom du crédit</label>
                            <input value={data.name} onChange={e => setData({...data, name: e.target.value})} 
                                className="w-full bg-[#F4F7FE] dark:bg-[#1A1A1A] border-2 border-transparent focus:border-[#4318FF] rounded-[16px] p-4 text-sm font-medium text-[#1B2559] dark:text-white outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-gray-600" 
                                placeholder="ex: Crédit Fêtes Religieuses" required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1B2559] dark:text-gray-300 ml-1">Type</label>
                                <select value={data.type} onChange={e => setData({...data, type: e.target.value})} 
                                    className="w-full bg-[#F4F7FE] dark:bg-[#1A1A1A] rounded-[16px] p-4 text-sm font-medium text-[#1B2559] dark:text-white outline-none appearance-none cursor-pointer border-2 border-transparent focus:border-[#4318FF]">
                                    <option value="Crédit Principal">Crédit Principal</option>
                                    <option value="Sous Crédit">Sous Crédit</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1B2559] dark:text-gray-300 ml-1">Catégorie</label>
                                <select value={data.category} onChange={e => setData({...data, category: e.target.value})} 
                                    className="w-full bg-[#F4F7FE] dark:bg-[#1A1A1A] rounded-[16px] p-4 text-sm font-medium text-[#1B2559] dark:text-white outline-none appearance-none cursor-pointer border-2 border-transparent focus:border-[#4318FF]">
                                    <option value="Immobilier">Immobilier</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Consommation">Consommation</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-[11px] font-black text-[#4318FF] dark:text-indigo-400 uppercase tracking-[0.1em]">Paramètres Financiers</h3>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[#1B2559] dark:text-gray-300 ml-1">Plafond Maximum (DH)</label>
                            <div className="relative">
                                <input value={data.max_amount} type="number" onChange={e => setData({...data, max_amount: e.target.value})} 
                                    className="w-full bg-[#F4F7FE] dark:bg-[#1A1A1A] rounded-[16px] p-4 text-sm font-bold text-[#1B2559] dark:text-white outline-none border-2 border-transparent focus:border-[#4318FF]" 
                                    placeholder="0.00" required min="0" onKeyDown={preventMinus}/>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#1B2559] dark:text-gray-500">DH</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1B2559] dark:text-gray-300 ml-1">Taux d'intérêt (%)</label>
                                <input value={data.interest_rate} type="number" step="0.01" onChange={e => setData({...data, interest_rate: e.target.value})} 
                                    className="w-full bg-[#F4F7FE] dark:bg-[#1A1A1A] rounded-[16px] p-4 text-sm font-bold text-[#1B2559] dark:text-white outline-none border-2 border-transparent focus:border-[#4318FF]" 
                                    placeholder="0.0" min="0" onKeyDown={preventMinus}/>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-[#1B2559] dark:text-gray-300 ml-1">Durée Max (Mois)</label>
                                <input value={data.max_duration} type="number" onChange={e => setData({...data, max_duration: e.target.value})} 
                                    className="w-full bg-[#F4F7FE] dark:bg-[#1A1A1A] rounded-[16px] p-4 text-sm font-bold text-[#1B2559] dark:text-white outline-none border-2 border-transparent focus:border-[#4318FF]" 
                                    placeholder="60" min="0" onKeyDown={preventMinus}/>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Footer Modal */}
                <div className="p-8 pt-4 flex gap-3 border-t border-slate-100 dark:border-white/5 shrink-0 bg-white dark:bg-[#0D0D0D]">
                    <button type="button" onClick={onClose} 
                        className="flex-1 bg-[#E9EDF7] dark:bg-[#1A1A1A] text-[#1B2559] dark:text-white py-4 rounded-[16px] font-bold text-sm hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-all active:scale-95 cursor-pointer">
                        Annuler
                    </button>
                    <button type="submit" 
                        className="flex-1 bg-[#4318FF] text-white py-4 rounded-[16px] font-bold text-sm shadow-[0_10px_20px_rgba(67,24,255,0.2)] hover:shadow-none transition-all active:scale-95 cursor-pointer">
                        Enregistrer
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GestionCredits;