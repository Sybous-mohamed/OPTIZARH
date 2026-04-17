import React, { useState, useEffect } from "react";
import { icons } from "../../lib/icons/icons";
import api from "../../lib/apis/axiosConfig";

export default function Users() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [employeesList, setEmployeesList] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [stats, setStats] = useState({ total: 0, actifs: 0, conge: 0, departs: 0 });
    const [filters, setFilters] = useState({ departement: "Tous", statut: "Tous", search: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [paginationData, setPaginationData] = useState({});

    const [formData, setFormData] = useState({
        prenom: "", nom: "", email: "", telephone: "",
        date_naissance: "", adresse: "", situation_familiale: "",
        departement: "", date_embauche: "", poste: "",
        type_contrat: "", grade: "", echelle: "", echelon: ""
    });

    const fetchStats = async () => {
        try {
            const res = await api.get('/employees/stats');
            setStats(res.data);
        } catch (err) { console.error("Stats Error:", err); }
    };

    const fetchEmployees = async (page = 1) => {
        try {
            const res = await api.get(`/employees?page=${page}`, { params: filters });
            setEmployeesList(res.data.data || []);
            setPaginationData(res.data);
        } catch (err) {
            console.error("Fetch Error:", err);
        }
    };

    useEffect(() => {
        fetchEmployees(currentPage);
        fetchStats();
    }, [filters, currentPage]);

    const handleEdit = (emp) => {
        setFormData(emp);
        setCurrentId(emp.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            try {
                await api.delete(`/employees/${id}`);
                fetchEmployees(currentPage);
                fetchStats();
            } catch (err) { console.error("Delete Error:", err); }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

   const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Step 1: CSRF Cookie (Khassha t-mchi l-URL bla /api prefix)
            // Ghadi n-stakhdmo api.get walakin checki config dyalha
            await api.get('../sanctum/csrf-cookie');
            
            let response;
            if (isEdit) {
                response = await api.put(`/employees/${currentId}`, formData);
            } else {
                response = await api.post('/employees', formData);
            }

            if (response.status === 200 || response.status === 201) {
                setShowModal(false);
                fetchEmployees(currentPage);
                fetchStats();
                resetForm();
                alert("Employé enregistré avec succès !");
            }
        } catch (error) {
            console.error("Submit Error Details:", error.response?.data);
            
            // Ila kant validation error (bhal email deja kayn)
            if (error.response?.status === 422) {
                const validationErrors = error.response.data.errors;
                alert("Erreur: " + Object.values(validationErrors).flat().join("\n"));
            } else {
                alert("Une erreur est survenue lors de l'enregistrement.");
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            prenom: "", nom: "", email: "", telephone: "",
            date_naissance: "", adresse: "", situation_familiale: "",
            departement: "", date_embauche: "", poste: "",
            type_contrat: "", grade: "", echelle: "", echelon: ""
        });
        setIsEdit(false);
    };

    return (
        <div className="py-2">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des Employés</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez les effectifs et organisez les départements.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-[#EEEDFE] text-[#4B42C8] px-[18px] py-2.5 rounded-lg text-sm font-semibold hover:bg-opacity-80 transition-all">
                        {icons.export} Exporter
                    </button>
                    <button 
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="flex items-center gap-2 bg-[#4B42C8] text-white px-[18px] py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg transition-all"
                    >
                        {icons.plus} Ajouter un Employé
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard title="EFFECTIF TOTAL" value={stats.total} />
                <StatCard title="ACTIFS" value={stats.actifs} subValue={`${stats.total > 0 ? ((stats.actifs / stats.total) * 100).toFixed(0) : 0}%`} color="text-green-600" />
                <StatCard title="EN CONGÉ" value={stats.conge} badge="Saison" />
                <StatCard title="DÉPARTS (MOIS)" value={stats.departs} color="text-red-600" />
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F0F5FF] border border-gray-200 border-b-0 rounded-t-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold flex items-center gap-2">{icons.filter} FILTRES:</span>
                    <select 
                        onChange={(e) => setFilters({...filters, departement: e.target.value})}
                        className="bg-white border border-gray-300 text-sm rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="Tous">Département: Tous</option>
                        <option value="IT">IT</option>
                        <option value="RH">RH</option>
                    </select>
                    <select 
                        onChange={(e) => setFilters({...filters, statut: e.target.value})}
                        className="bg-white border border-gray-300 text-sm rounded-lg p-2 outline-none"
                    >
                        <option value="Tous">Statut: Tous</option>
                        <option value="ACTIF">Actif</option>
                        <option value="CONGÉ">Congé</option>
                    </select>
                </div>
                <div className="relative w-full md:w-[300px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icons.search}</span>
                    <input 
                        type="text" 
                        placeholder="Rechercher un employé..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm outline-none focus:border-indigo-500"
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-b-2xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-[11px] font-bold text-gray-400 uppercase">Employé</th>
                            <th className="p-4 text-[11px] font-bold text-gray-400 uppercase">Matricule</th>
                            <th className="p-4 text-[11px] font-bold text-gray-400 uppercase">Poste</th>
                            <th className="p-4 text-[11px] font-bold text-gray-400 uppercase">Statut</th>
                            <th className="p-4 text-[11px] font-bold text-gray-400 uppercase text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {employeesList.length > 0 ? (
                            employeesList.map((emp) => (
                                <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-800 text-sm">{emp.prenom} {emp.nom}</div>
                                        <div className="text-[11px] text-gray-400">{emp.email}</div>
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">#{emp.id}</td>
                                    <td className="p-4 text-sm text-gray-600">{emp.poste || "Non spécifié"}</td>
                                    <td className="p-4">
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-bold">ACTIF</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <button onClick={() => handleEdit(emp)} className="p-2 bg-[#EEEDFE] text-[#4B42C8] rounded-lg hover:bg-indigo-100 transition-all">{icons.edit}</button>
                                            <button onClick={() => handleDelete(emp.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">{icons.delete}</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="p-10 text-center text-gray-400 text-sm italic">Aucun employé trouvé.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6 px-2">
                <span className="text-xs text-gray-500 font-medium">
                    Affichage de {paginationData.from || 0} à {paginationData.to || 0} sur {paginationData.total || 0} employés
                </span>
                <div className="flex gap-2">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#F0F5FF] text-[#4B42C8] rounded-lg disabled:opacity-50"
                    >
                        {icons.chevronLeft || "<"}
                    </button>
                    <button className="w-8 h-8 bg-[#4B42C8] text-white rounded-lg font-bold text-xs">{currentPage}</button>
                    <button 
                        disabled={currentPage >= paginationData.last_page}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#F0F5FF] text-[#4B42C8] rounded-lg disabled:opacity-50"
                    >
                        {icons.chevronRight || ">"}
                    </button>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[20px] w-full max-w-[600px] max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 pb-0 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Modifier l'Employé" : "Ajouter un Employé"}</h2>
                                <p className="text-xs text-gray-400 mt-1">Remplissez les informations ci-dessous.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 text-xl transition-colors">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <div className="text-[11px] font-extrabold text-gray-500 flex items-center gap-2 tracking-wider">
                                    <span className="w-7 h-7 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg">{icons.users}</span>
                                    INFORMATIONS PERSONNELLES
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">PRÉNOM</label>
                                        <input name="prenom" value={formData.prenom} onChange={handleChange} type="text" className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none border-none focus:ring-2 focus:ring-indigo-300" required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">NOM</label>
                                        <input name="nom" value={formData.nom} onChange={handleChange} type="text" className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300" required />
                                    </div>
                                    <div className="col-span-2 flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">EMAIL PERSONNEL</label>
                                        <input name="email" value={formData.email} onChange={handleChange} type="email" className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-300" required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">SITUATION FAMILIALE</label>
                                        <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none">
                                            <option value="">Choisir...</option>
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="Marié(e)">Marié(e)</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">TÉLÉPHONE</label>
                                        <input name="telephone" value={formData.telephone} onChange={handleChange} type="text" className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Pro Info */}
                            <div className="space-y-4">
                                <div className="text-[11px] font-extrabold text-gray-500 flex items-center gap-2 tracking-wider">
                                    <span className="w-7 h-7 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-lg">{icons.rcar}</span>
                                    INFORMATIONS PROFESSIONNELLES
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">DÉPARTEMENT</label>
                                        <select name="departement" value={formData.departement} onChange={handleChange} className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none">
                                            <option value="">Choisir...</option>
                                            <option value="IT">IT</option>
                                            <option value="RH">RH</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-600">POSTE</label>
                                        <input name="poste" value={formData.poste} onChange={handleChange} type="text" className="bg-[#DDE9FB] rounded-lg p-2.5 text-sm outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Classification Box */}
                            <div className="bg-[#F0F5FF] p-5 rounded-xl grid grid-cols-2 gap-4">
                                <div className="col-span-2 flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-600">GRADE / CLASSE</label>
                                    <input name="grade" value={formData.grade} onChange={handleChange} className="bg-white border border-gray-100 rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-600">ÉCHELLE</label>
                                    <input name="echelle" value={formData.echelle} onChange={handleChange} className="bg-white border border-gray-100 rounded-lg p-2.5 text-sm" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[11px] font-bold text-gray-600">ÉCHELON</label>
                                    <input name="echelon" value={formData.echelon} onChange={handleChange} className="bg-white border border-gray-100 rounded-lg p-2.5 text-sm" />
                                </div>
                            </div>

                            <div className="flex gap-4 sticky bottom-0 bg-white py-2 border-t mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-[#DDE9FB] text-[#4B42C8] rounded-xl font-bold hover:bg-opacity-80 transition-all">Annuler</button>
                                <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#4B42C8] text-white rounded-xl font-bold shadow-md hover:bg-opacity-90 transition-all">
                                    {loading ? "Chargement..." : "Enregistrer"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

const StatCard = ({ title, value, subValue, badge, color = "text-gray-800" }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <p className="text-[10px] font-extrabold text-gray-400 mb-2.5 tracking-wider">{title}</p>
        <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${color}`}>{value}</span>
            {subValue && <span className="text-[11px] text-green-500 font-bold">+{subValue}</span>}
            {badge && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{badge}</span>}
        </div>
    </div>
);