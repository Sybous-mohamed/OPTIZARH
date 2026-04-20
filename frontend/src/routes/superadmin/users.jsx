import React, { useState, useEffect } from "react";
import { icons } from "../../lib/icons/icons";
import axiosClient from "../../lib/apis/axiosConfig";


// StatCard Component b Tailwind
const StatCard = ({ title, value, subValue, badge }) => (
    <div className="bg-white p-5 rounded-[15px] border border-gray-100 shadow-sm">
        <p className="text-[11px] font-bold text-gray-400 mb-2.5 uppercase">{title}</p>
        <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-extrabold text-gray-800">{value}</span>
            {subValue && <span className="text-[12px] text-green-600 font-semibold">+{subValue}</span>}
            {badge && <span className="text-[10px] bg-indigo-50 text-[#4B42C8] px-2 py-0.5 rounded-full">{badge}</span>}
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
        const res = await axiosClient.get('/api/employees/stats');
        setStats(res.data);
    };

    const fetchEmployees = async (page = 1) => {
        try {
            const res = await axiosClient.get(`/api/employees?page=${page}`, { params: filters });
            setEmployeesList(res.data.data || []);
            setPaginationData(res.data);
        } catch (err) {
            console.error("Erreur fetch:", err);
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
                await axiosClient.delete(`/api/employees/${id}`);
                alert("Employé supprimé !");
                fetchEmployees(currentPage);
                fetchStats();
            } catch (err) {
                console.error("Erreur delete:", err);
            }
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
                alert(isEdit ? "Modifié avec succès !" : "Ajouté avec succès !");
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
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erreur PDF:", error);
            alert("Erreur lors de la génération du PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-2.5">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-[30px]">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 m-0">Gestion des Employés</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez les effectifs et organisez les départements.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="bg-[#EEEDFE] text-[#4B42C8] px-[18px] py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer flex items-center gap-2 disabled:opacity-50"
                        onClick={handleExportPDF}
                        disabled={loading}
                    >
                        {loading ? "Génération..." : <>{icons.export} Exporter</>}
                    </button>
                    <button 
                        className="bg-[#4B42C8] text-white px-[18px] py-2.5 rounded-lg text-[13px] font-semibold cursor-pointer flex items-center gap-2 hover:bg-[#3f37a8] transition-colors"
                        onClick={() => { setIsEdit(false); setShowModal(true); }}
                    >
                        {icons.plus} Ajouter un Employé
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-5 mb-[30px]">
                <StatCard title="EFFECTIF TOTAL" value={stats.total} color="#4B42C8" />
                <StatCard title="ACTIFS" value={stats.actifs} subValue={stats.total > 0 ? `${((stats.actifs / stats.total) * 100).toFixed(0)}%` : "0%"} color="#2E7D32" />
                <StatCard title="EN CONGÉ" value={stats.conge} badge="Saison" color="#f57c00" />
                <StatCard title="DÉPARTS (MOIS)" value={stats.departs} color="#d32f2f" />
            </div>

            {/* Filter Bar */}
            <div className="bg-[#F0F5FF] px-[25px] py-[15px] rounded-t-[15px] flex justify-between items-center border border-[#e0e6ed] border-bottom-0">
                <div className="flex gap-[15px] items-center">
                    <span className="text-[13px] font-bold flex items-center gap-1">{icons.filter} Filtres:</span>
                    <select 
                        onChange={(e) => setFilters({ ...filters, departement: e.target.value })} 
                        className="p-2 rounded-lg border border-gray-300 text-[13px] outline-none bg-white"
                    >
                        <option value="Tous">Département: Tous</option>
                        <option value="IT">IT</option>
                        <option value="RH">RH</option>
                    </select>
                    <select 
                        onChange={(e) => setFilters({ ...filters, statut: e.target.value })} 
                        className="p-2 rounded-lg border border-gray-300 text-[13px] outline-none bg-white"
                    >
                        <option value="Tous">Statut: Tous</option>
                        <option value="ACTIF">Actif</option>
                        <option value="CONGÉ">Congé</option>
                    </select>
                </div>
                <div className="relative flex items-center bg-white rounded-full px-[15px] w-[300px] border border-gray-200">
                    <span className="text-gray-400">{icons.search}</span>
                    <input
                        type="text"
                        placeholder="Rechercher un employé..."
                        className="border-none p-2.5 text-[13px] outline-none w-full bg-transparent"
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-b-[12px] border border-gray-200 border-t-0 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#F8FAFF] border-b border-gray-100">
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">EMPLOYÉ</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">MATRICULE</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">POSTE</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">STATUT</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeesList.length > 0 ? (
                            employeesList.map((emp) => (
                                <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-[15px_20px] text-[13px] text-gray-700">
                                        <div className="font-semibold">{emp.prenom} {emp.nom}</div>
                                        <div className="text-[11px] text-gray-400">{emp.email}</div>
                                    </td>
                                    <td className="p-[15px_20px] text-[13px] text-gray-700">{emp.id}</td>
                                    <td className="p-[15px_20px] text-[13px] text-gray-700">{emp.poste || "Non spécifié"}</td>
                                    <td className="p-[15px_20px] text-[13px] text-gray-700">
                                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-[10px] font-bold">ACTIF</span>
                                    </td>
                                    <td className="p-[15px_20px] text-[13px] text-gray-700">
                                        <div className="flex gap-2.5">
                                            <button
                                                onClick={() => handleEdit(emp)}
                                                className="p-1.5 rounded-md cursor-pointer transition-all text-[#4B42C8] bg-[#EEEDFE] hover:bg-[#e4e2fe]"
                                            >
                                                {icons.edit}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(emp.id)}
                                                className="p-1.5 rounded-md cursor-pointer transition-all text-red-600 bg-red-50 hover:bg-red-100"
                                            >
                                                {icons.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-[30px] text-gray-400 italic">
                                    Aucun employé trouvé.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-5 px-2.5">
                <span className="text-[13px] text-gray-500">
                    Affichage de {paginationData.from || 0} à {paginationData.to || 0} sur {paginationData.total || 0} employés
                </span>
                <div className="flex gap-2 items-center">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="bg-[#F0F5FF] disabled:opacity-50 rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[#4B42C8]"
                    >
                        {icons.chevronLeft || "<"}
                    </button>
                    <button className="bg-[#4B42C8] text-white rounded-lg w-8 h-8 font-bold text-[13px]">
                        {currentPage}
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => (prev < paginationData.last_page ? prev + 1 : prev))}
                        disabled={currentPage === paginationData.last_page}
                        className="bg-[#F0F5FF] disabled:opacity-50 rounded-lg w-8 h-8 flex items-center justify-center cursor-pointer text-[#4B42C8]"
                    >
                        {icons.chevronRight || ">"}
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
                    <div className="bg-white p-[30px] rounded-[20px] w-[600px] max-h-[90vh] shadow-2xl z-[1001] overflow-hidden">
                        <div className="flex justify-between items-center mb-1">
                            <h2 className="text-[18px] font-bold m-0">{isEdit ? "Modifier l'Employé" : "Ajouter un Employé"}</h2>
                            <button onClick={() => setShowModal(false)} className="border-none bg-none cursor-pointer text-xl text-gray-500 hover:text-black transition-colors">✕</button>
                        </div>
                        <p className="text-gray-400 text-[13px] mb-[25px]">Remplissez les informations ci-dessous.</p>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-[25px] max-h-[75vh] overflow-y-auto pr-2.5">
                            
                            {/* Section 1: INFORMATIONS PERSONNELLES */}
                            <div className="flex flex-col gap-[15px]">
                                <div className="text-[12px] font-extrabold text-gray-600 flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-[#F0F0FF] text-[#4B42C8] flex items-center justify-center text-[14px]">{icons.users}</span>
                                    INFORMATIONS PERSONNELLES
                                </div>
                                <div className="grid grid-cols-2 gap-[15px]">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">PRÉNOM</label>
                                        <input name="prenom" value={formData.prenom} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="text" required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">NOM</label>
                                        <input name="nom" value={formData.nom} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="text" required />
                                    </div>
                                    <div className="flex flex-col gap-1.5 col-span-2">
                                        <label className="text-[11px] font-bold text-gray-700">EMAIL PERSONNEL</label>
                                        <input name="email" value={formData.email} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="email" required />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">TÉLÉPHONE</label>
                                        <input name="telephone" value={formData.telephone} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="text" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">DATE DE NAISSANCE</label>
                                        <input name="date_naissance" value={formData.date_naissance} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="date" />
                                    </div>
                                    <div className="flex flex-col gap-1.5 col-span-2">
                                        <label className="text-[11px] font-bold text-gray-700">ADRESSE</label>
                                        <input name="adresse" value={formData.adresse} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="text" />
                                    </div>
                                    <div className="flex flex-col gap-1.5 col-span-2">
                                        <label className="text-[11px] font-bold text-gray-700">SITUATION FAMILIALE</label>
                                        <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none">
                                            <option value="">Choisir...</option>
                                            <option value="Célibataire">Célibataire</option>
                                            <option value="Marié(e)">Marié(e)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 2: INFORMATIONS PROFESSIONNELLES */}
                            <div className="flex flex-col gap-[15px]">
                                <div className="text-[12px] font-extrabold text-gray-600 flex items-center gap-2.5">
                                    <span className="w-7 h-7 rounded-lg bg-[#EEEDFE] text-[#4B42C8] flex items-center justify-center text-[14px]">{icons.rcar}</span>
                                    INFORMATIONS PROFESSIONNELLES
                                </div>
                                <div className="grid grid-cols-2 gap-[15px]">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">DÉPARTEMENT</label>
                                        <select name="departement" value={formData.departement} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none">
                                            <option value="">Choisir...</option>
                                            <option value="IT">IT</option>
                                            <option value="RH">RH</option>
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">DATE D'EMBAUCHE</label>
                                        <input name="date_embauche" value={formData.date_embauche} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="date" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">POSTE</label>
                                        <input name="poste" value={formData.poste} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none" type="text" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700">TYPE DE CONTRAT</label>
                                        <select name="type_contrat" value={formData.type_contrat} onChange={handleChange} className="w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none">
                                            <option value="">Choisir...</option>
                                            <option value="CDI">CDI</option>
                                            <option value="CDD">CDD</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Section 3: CLASSIFICATION */}
                            <div className="bg-[#F0F5FF] p-5 rounded-xl">
                                <div className="grid grid-cols-2 gap-[15px]">
                                    <div className="flex flex-col gap-1.5 col-span-2">
                                        <label className="text-[11px] font-bold text-gray-700 uppercase">Grade / Classe</label>
                                        <input name="grade" value={formData.grade} onChange={handleChange} className="w-full p-[10px_12px] bg-white border border-gray-100 rounded-lg text-[13px] outline-none focus:border-[#4B42C8]" type="text" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700 uppercase">Échelle</label>
                                        <input name="echelle" value={formData.echelle} onChange={handleChange} className="w-full p-[10px_12px] bg-white border border-gray-100 rounded-lg text-[13px] outline-none focus:border-[#4B42C8]" type="text" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700 uppercase">Échelon</label>
                                        <input name="echelon" value={formData.echelon} onChange={handleChange} className="w-full p-[10px_12px] bg-white border border-gray-100 rounded-lg text-[13px] outline-none focus:border-[#4B42C8]" type="text" />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="flex gap-[15px] mt-2.5 pb-2.5">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 bg-[#DDE9FB] text-[#4B42C8] rounded-[10px] font-bold cursor-pointer hover:bg-[#cfdff7] transition-colors">Annuler</button>
                                <button type="submit" disabled={loading} className="flex-1 p-3 bg-[#4B42C8] text-white rounded-[10px] font-bold cursor-pointer hover:bg-[#3f37a8] transition-colors disabled:opacity-50">
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