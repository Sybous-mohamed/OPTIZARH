import React, { useState, useEffect } from "react";
import { icons } from "../../lib/icons/icons";
import axiosClient from "../../lib/apis/axiosConfig";

// StatCard Component - Adaptive Dark Mode
const StatCard = ({ title, value, subValue, badge }) => (
    <div className="bg-white dark:bg-[#121212] p-5 rounded-[15px] border border-gray-100 dark:border-[#262626] shadow-sm transition-colors duration-300">
        <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mb-2.5 uppercase">{title}</p>
        <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-extrabold text-gray-800 dark:text-gray-100">{value}</span>
            {subValue && <span className="text-[12px] text-green-600 dark:text-green-400 font-semibold">+{subValue}</span>}
            {badge && (
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-500/10 text-[#4B42C8] dark:text-indigo-400 px-2 py-0.5 rounded-full">
                    {badge}
                </span>
            )}
        </div>
    </div>
);

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
            const res = await axiosClient.get('/api/employees/stats');
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchEmployees = async (page = 1) => {
        try {
            const res = await axiosClient.get(`/api/employees?page=${page}`, { params: filters });
            setEmployeesList(res.data.data || []);
            setPaginationData(res.data);
        } catch (err) { console.error("Erreur fetch:", err); }
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
                await axiosClient.delete(`/api/employees/${id}`);
                fetchEmployees(currentPage);
                fetchStats();
            } catch (err) { console.error(err); }
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            let response;
            if (isEdit) {
                response = await axiosClient.put(`/api/employees/${currentId}`, formData);
            } else {
                response = await axiosClient.post('/api/employees', formData);
            }

            if (response.status === 200 || response.status === 201) {
                setShowModal(false);
                fetchEmployees(currentPage);
                fetchStats();
                setFormData({
                    prenom: "", nom: "", email: "", telephone: "",
                    date_naissance: "", adresse: "", situation_familiale: "",
                    departement: "", date_embauche: "", poste: "",
                    type_contrat: "", grade: "", echelle: "", echelon: ""
                });
            }
        } catch (error) {
            console.error("Erreur:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleExportPDF = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get('/api/employees/export-pdf', {
                params: filters,
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'liste-employes.pdf');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erreur PDF:", error);
        } finally { setLoading(false); }
    };

    return (
        <div className="py-2.5 transition-colors duration-300">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-[30px]">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0">Gestion des Employés</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez les effectifs et organisez les départements.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="bg-[#EEEDFE] dark:bg-[#1c1c1c] text-[#4B42C8] dark:text-indigo-400 px-[18px] py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 disabled:opacity-50 border border-transparent dark:border-[#262626] cursor-pointer"
                        onClick={handleExportPDF}
                        disabled={loading}
                    >
                        {loading ? "Génération..." : <>{icons.export} Exporter</>}
                    </button>
                    <button 
                        className="bg-[#4B42C8] dark:bg-indigo-600 text-white px-[18px] py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 hover:bg-[#3f37a8] dark:hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/10 cursor-pointer"
                        onClick={() => { setIsEdit(false); setShowModal(true); }}
                    >
                        {icons.plus} Ajouter un Employé
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-5 mb-[30px]">
                <StatCard title="EFFECTIF TOTAL" value={stats.total} />
                <StatCard title="ACTIFS" value={stats.actifs} subValue={stats.total > 0 ? `${((stats.actifs / stats.total) * 100).toFixed(0)}%` : "0%"} />
                <StatCard title="EN CONGÉ" value={stats.conge} badge="Saison" />
                <StatCard title="DÉPARTS (MOIS)" value={stats.departs} />
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F0F5FF] dark:bg-[#121212] px-[25px] py-[15px] rounded-t-[15px] flex justify-between items-center border border-[#e0e6ed] dark:border-[#262626] border-bottom-0">
                <div className="flex gap-[15px] items-center">
                    <span className="text-[13px] font-bold flex items-center gap-1 dark:text-gray-300">{icons.filter} Filtres:</span>
                    <select 
                        onChange={(e) => setFilters({ ...filters, departement: e.target.value })} 
                        className="p-2 rounded-lg border border-gray-300 dark:border-[#262626] text-[13px] outline-none bg-white dark:bg-[#1c1c1c] dark:text-gray-200 cursor-pointer"
                    >
                        <option value="Tous">Département: Tous</option>
                        <option value="IT">IT</option>
                        <option value="RH">RH</option>
                    </select>
                    <select 
                        onChange={(e) => setFilters({ ...filters, statut: e.target.value })} 
                        className="p-2 rounded-lg border border-gray-300 dark:border-[#262626] text-[13px] outline-none bg-white dark:bg-[#1c1c1c] dark:text-gray-200 cursor-pointer"
                    >
                        <option value="Tous">Statut: Tous</option>
                        <option value="ACTIF">Actif</option>
                        <option value="CONGÉ">Congé</option>
                    </select>
                </div>
                <div className="relative flex items-center bg-white dark:bg-[#1c1c1c] rounded-full px-[15px] w-[300px] border border-gray-200 dark:border-[#262626]">
                    <span className="text-gray-400">{icons.search}</span>
                    <input
                        type="text"
                        placeholder="Rechercher un employé..."
                        className="border-none p-2.5 text-[13px] outline-none w-full bg-transparent dark:text-gray-200"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-[#121212] rounded-b-[12px] border border-gray-200 dark:border-[#262626] border-t-0 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#F8FAFF] dark:bg-[#1c1c1c]/50 border-b border-gray-100 dark:border-[#262626]">
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">EMPLOYÉ</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">MATRICULE</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">POSTE</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">STATUT</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeesList.length > 0 ? (
                            employeesList.map((emp) => (
                                <tr key={emp.id} className="border-b border-gray-50 dark:border-[#1c1c1c] hover:bg-gray-50 dark:hover:bg-[#1c1c1c]/30 transition-colors">
                                    <td className="p-[15px_20px] text-[13px]">
                                        <div className="font-semibold text-gray-700 dark:text-gray-200">{emp.prenom} {emp.nom}</div>
                                        <div className="text-[11px] text-gray-400 dark:text-gray-500">{emp.email}</div>
                                    </td>
                                    <td className="p-[15px_20px] text-[13px] text-gray-700 dark:text-gray-400">{emp.id}</td>
                                    <td className="p-[15px_20px] text-[13px] text-gray-700 dark:text-gray-400">{emp.poste || "Non spécifié"}</td>
                                    <td className="p-[15px_20px] text-[13px]">
                                        <span className="bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 py-1 rounded-full text-[10px] font-bold">ACTIF</span>
                                    </td>
                                    <td className="p-[15px_20px]">
                                        <div className="flex gap-2.5">
                                            <button onClick={() => handleEdit(emp)} className="p-1.5 rounded-md text-[#4B42C8] dark:text-indigo-400 bg-[#EEEDFE] dark:bg-indigo-500/10 hover:scale-110 transition-transform">
                                                {icons.edit}
                                            </button>
                                            <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-md text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:scale-110 transition-transform">
                                                {icons.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center p-[30px] text-gray-400 italic">Aucun employé trouvé.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-5 px-2.5">
                <span className="text-[13px] text-gray-500 dark:text-gray-400">
                    Affichage de {paginationData.from || 0} à {paginationData.to || 0} sur {paginationData.total || 0}
                </span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="bg-[#F0F5FF] dark:bg-[#1c1c1c] disabled:opacity-50 rounded-lg w-8 h-8 flex items-center justify-center text-[#4B42C8] dark:text-indigo-400">
                        {icons.chevronLeft || "<"}
                    </button>
                    <button className="bg-[#4B42C8] dark:bg-indigo-600 text-white rounded-lg w-8 h-8 font-bold text-[13px]">{currentPage}</button>
                    <button onClick={() => setCurrentPage(prev => (prev < paginationData.last_page ? prev + 1 : prev))} disabled={currentPage === paginationData.last_page} className="bg-[#F0F5FF] dark:bg-[#1c1c1c] disabled:opacity-50 rounded-lg w-8 h-8 flex items-center justify-center text-[#4B42C8] dark:text-indigo-400">
                        {icons.chevronRight || ">"}
                    </button>
                </div>
            </div>

      {/* Form Modal */}
{showModal && (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000]">
        <div className="bg-white dark:bg-[#121212] p-[30px] rounded-[20px] w-[600px] max-h-[90vh] shadow-2xl z-[1001] overflow-hidden border border-transparent dark:border-[#262626]">
            <div className="flex justify-between items-center mb-1">
                <h2 className="text-[18px] font-bold m-0 dark:text-white">{isEdit ? "Modifier l'Employé" : "Ajouter un Employé"}</h2>
                <button onClick={() => setShowModal(false)} className="border-none bg-none cursor-pointer text-xl text-gray-500 dark:hover:text-white transition-colors">✕</button>
            </div>
            <p className="text-gray-400 text-[13px] mb-[25px]">Remplissez toutes les informations ci-dessous.</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-[25px] max-h-[75vh] overflow-y-auto pr-2.5 custom-scrollbar">
                
                {/* Section 1: INFORMATIONS PERSONNELLES */}
                <div className="flex flex-col gap-[15px]">
                    <div className="text-[12px] font-extrabold text-gray-600 dark:text-gray-400 flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#F0F0FF] dark:bg-indigo-500/10 text-[#4B42C8] dark:text-indigo-400 flex items-center justify-center text-[14px]">{icons.users}</span>
                        INFORMATIONS PERSONNELLES
                    </div>
                    <div className="grid grid-cols-2 gap-[15px]">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">PRÉNOM</label>
                            <input name="prenom" value={formData.prenom} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626] focus:border-[#4B42C8]" type="text" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">NOM</label>
                            <input name="nom" value={formData.nom} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626] focus:border-[#4B42C8]" type="text" required />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">EMAIL PERSONNEL</label>
                            <input name="email" value={formData.email} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]" type="email" required />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">TÉLÉPHONE</label>
                            <input name="telephone" value={formData.telephone} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]" type="text" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">SITUATION FAMILIALE</label>
                            <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]">
                                <option value="">Choisir...</option>
                                <option value="Célibataire">Célibataire</option>
                                <option value="Marié(e)">Marié(e)</option>

                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">DATE DE NAISSANCE</label>
                            <input name="date_naissance" value={formData.date_naissance} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]" type="date" />
                        </div>
                        <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">ADRESSE</label>
                            <input name="adresse" value={formData.adresse} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]" type="text" />
                        </div>
                    </div>
                </div>

                {/* Section 2: INFORMATIONS PROFESSIONNELLES */}
                <div className="flex flex-col gap-[15px]">
                    <div className="text-[12px] font-extrabold text-gray-600 dark:text-gray-400 flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-[#EEEDFE] dark:bg-blue-500/10 text-[#4B42C8] dark:text-blue-400 flex items-center justify-center text-[14px]">{icons.rcar}</span>
                        INFORMATIONS PROFESSIONNELLES
                    </div>
                    <div className="grid grid-cols-2 gap-[15px]">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">DÉPARTEMENT</label>
                            <select name="departement" value={formData.departement} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]">
                                <option value="">Choisir...</option>
                                <option value="IT">IT</option>
                                <option value="RH">RH</option>
                                <option value="Finance">Finance</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">POSTE</label>
                            <input name="poste" value={formData.poste} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]" type="text" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">DATE D'EMBAUCHE</label>
                            <input name="date_embauche" value={formData.date_embauche} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]" type="date" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-500 uppercase">TYPE DE CONTRAT</label>
                            <select name="type_contrat" value={formData.type_contrat} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] dark:bg-[#1c1c1c] dark:text-white rounded-lg text-[13px] outline-none border border-transparent dark:border-[#262626]">
                                <option value="">Choisir...</option>
                                <option value="CDI">CDI</option>
                                <option value="CDD">CDD</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Section 3: CLASSIFICATION */}
                <div className="bg-[#F0F5FF] dark:bg-[#1c1c1c]/50 p-5 rounded-xl border border-transparent dark:border-[#262626]">
                    <div className="grid grid-cols-2 gap-[15px]">
                        <div className="flex flex-col gap-1.5 col-span-2">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400 uppercase">Grade / Classe</label>
                            <input name="grade" value={formData.grade} onChange={handleChange} className="w-full p-[10px_12px] bg-white dark:bg-[#121212] dark:text-white border border-gray-100 dark:border-[#262626] rounded-lg text-[13px] outline-none focus:border-[#4B42C8]" type="text" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400 uppercase">Échelle</label>
                            <input name="echelle" value={formData.echelle} onChange={handleChange} className="w-full p-[10px_12px] bg-white dark:bg-[#121212] dark:text-white border border-gray-100 dark:border-[#262626] rounded-lg text-[13px] outline-none focus:border-[#4B42C8]" type="text" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[11px] font-bold text-gray-700 dark:text-gray-400 uppercase">Échelon</label>
                            <input name="echelon" value={formData.echelon} onChange={handleChange} className="w-full p-[10px_12px] bg-white dark:bg-[#121212] dark:text-white border border-gray-100 dark:border-[#262626] rounded-lg text-[13px] outline-none focus:border-[#4B42C8]" type="text" />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-[15px] mt-2.5 pb-2.5">
                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 bg-[#DDE9FB] dark:bg-[#1c1c1c] text-[#4B42C8] dark:text-gray-400 rounded-[10px] font-bold cursor-pointer hover:bg-[#cfdff7] dark:hover:bg-[#262626] transition-colors uppercase text-[12px]">Annuler</button>
                    <button type="submit" disabled={loading} className="flex-1 p-3 bg-[#4B42C8] dark:bg-indigo-600 text-white rounded-[10px] font-bold cursor-pointer hover:bg-[#3f37a8] dark:hover:bg-indigo-500 transition-colors disabled:opacity-50 uppercase text-[12px]">
                        {loading ? "Enregistrement..." : "Enregistrer"}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
        </div>
    );
}