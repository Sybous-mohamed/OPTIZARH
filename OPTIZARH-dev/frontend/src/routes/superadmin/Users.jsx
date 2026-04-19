import React, { useState, useEffect } from "react";
import { z } from "zod";
import { icons } from "../../lib/icons/icons";
import axiosClient from "../../lib/apis/axiosConfig";

// 1. Schema dyal Validation
const employeeSchema = z.object({
  // --- Informations Personnelles ---
  prenom: z.string().min(2, "Le prénom doit avoir au moins 2 caractères"),
  nom: z.string().min(2, "Le nom est obligatoire"),
  email: z.string().email("Format d'email invalide"),
  telephone: z.string().regex(/^(05|06|07)\d{8}$/, "Numéro invalide (ex: 06...)"),
  
  // Date de naissance: khassha t-koun date m9adda
  date_naissance: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Date de naissance invalide",
  }),
  
  adresse: z.string().min(5, "L'adresse doit être plus détaillée"),
  
  situation_familiale: z.enum(["Célibataire", "Marié(e)", "Divorcé(e)", "Veuf(ve)"], {
    errorMap: () => ({ message: "Veuillez choisir une situation familiale" }),
  }),

  // --- Informations Professionnelles ---
  departement: z.string().min(1, "Veuillez choisir un département"),
  poste: z.string().min(2, "Le poste est obligatoire"),
  
  date_embauche: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Date d'embauche invalide",
  }),
  
  type_contrat: z.enum(["CDI", "CDD", "Apprenti", "Stage"], {
    errorMap: () => ({ message: "Veuillez choisir le type de contrat" }),
  }),

  // --- Classification (Grades & Échelles) ---
  // Hado dert lihom .optional() wla .or(z.literal("")) bach ila knti mazal ma-3mrtihomch may-7bsouch l-form
  // Ila bghitihom darouriyin, khllihom ghir z.string().min(1, ...)
  grade: z.string().min(1, "Le grade est obligatoire"),
  echelle: z.string().min(1, "L'échelle est obligatoire"),
  echelon: z.string().min(1, "L'échelon est obligatoire"),
});

// Component sghir l-Stats
const StatCard = ({ title, value, subValue, badge }) => (
    <div className="bg-white p-5 rounded-[15px] border border-gray-100 shadow-sm text-left">
        <p className="text-[11px] font-bold text-gray-400 mb-2.5 uppercase">{title}</p>
        <div className="flex items-baseline gap-2.5">
            <span className="text-[28px] font-extrabold text-gray-800">{value}</span>
            {subValue && <span className="text-[12px] text-green-600 font-semibold">+{subValue}</span>}
            {badge && <span className="text-[10px] bg-indigo-50 text-[#4B42C8] px-2 py-0.5 rounded-full">{badge}</span>}
        </div>
    </div>
);

// Component l-koul Input bach n9ssu l-ktiba
const FormField = ({ label, name, type = "text", value, onChange, error, options, className = "" }) => (
    <div className={`flex flex-col gap-1.5 ${className}`}>
        <label className="text-[11px] font-bold text-gray-700 uppercase">{label}</label>
        {options ? (
            <select 
                name={name} 
                value={value} 
                onChange={onChange}
                className={`w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none border transition-all
                ${error ? 'border-red-500 ring-1 ring-red-100' : 'border-transparent focus:border-[#4B42C8]'}`}
            >
                {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
        ) : (
            <input
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                className={`w-full p-[10px_12px] bg-[#DDE9FB] rounded-lg text-[13px] outline-none border transition-all
                ${error ? 'border-red-500 ring-1 ring-red-100' : 'border-transparent focus:border-[#4B42C8]'}`}
            />
        )}
        {error && <span className="text-red-500 text-[10px] font-semibold tracking-wide">{error}</span>}
    </div>
);

export default function Users() {
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [employeesList, setEmployeesList] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [errors, setErrors] = useState({}); // <--- State dyal l-errors
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

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // N-ms7u l-error dyal dak l-field fach y-bda y-kteb fih l-user
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleEdit = (emp) => {
        setFormData(emp);
        setCurrentId(emp.id);
        setIsEdit(true);
        setErrors({});
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Êtes-vous sûr de vouloir supprimer cet employé ?")) {
            try {
                await axiosClient.delete(`/api/employees/${id}`);
                fetchEmployees(currentPage);
                fetchStats();
            } catch (err) {
                console.error("Erreur delete:", err);
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({}); 

        
        const result = employeeSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            const formattedErrors = result.error.flatten().fieldErrors;
            
            Object.keys(formattedErrors).forEach((key) => {
                fieldErrors[key] = formattedErrors[key][0];
            });

            setErrors(fieldErrors);
            console.log("Validation fchelt:", fieldErrors);
            return;
        }

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
                // Reset form
                setFormData({
                    prenom: "", nom: "", email: "", telephone: "",
                    date_naissance: "", adresse: "", situation_familiale: "",
                    departement: "", date_embauche: "", poste: "",
                    type_contrat: "", grade: "", echelle: "", echelon: ""
                });
            }
        } catch (error) {
            // Ila daz l-frontend w l9a l-backend chi mouchkil (ex: email déjà pris)
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors);
            } else {
                console.error("Erreur Backend:", error.response?.data);
            }
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
                    <button className="bg-[#EEEDFE] text-[#4B42C8] px-[18px] py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2" onClick={handleExportPDF} disabled={loading}>
                        {loading ? "..." : <>{icons.export} Exporter</>}
                    </button>
                    <button className="bg-[#4B42C8] text-white px-[18px] py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 hover:bg-[#3f37a8]" onClick={() => { setIsEdit(false); setErrors({}); setShowModal(true); }}>
                        {icons.plus} Ajouter
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
            <div className="bg-[#F0F5FF] px-[25px] py-[15px] rounded-t-[15px] flex justify-between items-center border border-[#e0e6ed] border-bottom-0">
                <div className="flex gap-[15px] items-center">
                    <span className="text-[13px] font-bold flex items-center gap-1">{icons.filter} Filtres:</span>
                    <select onChange={(e) => setFilters({ ...filters, departement: e.target.value })} className="p-2 rounded-lg border border-gray-300 text-[13px] outline-none bg-white">
                        <option value="Tous">Tous les Départements</option>
                        <option value="IT">IT</option>
                        <option value="RH">RH</option>
                    </select>
                </div>
                <div className="relative flex items-center bg-white rounded-full px-[15px] w-[300px] border border-gray-200">
                    <span className="text-gray-400">{icons.search}</span>
                    <input type="text" placeholder="Rechercher..." className="border-none p-2.5 text-[13px] outline-none w-full bg-transparent" onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-b-[12px] border border-gray-200 border-t-0 overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-[#F8FAFF] border-b border-gray-100">
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">EMPLOYÉ</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">POSTE</th>
                            <th className="text-left p-[15px_20px] text-[11px] font-bold text-gray-400 uppercase">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeesList.map((emp) => (
                            <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="p-[15px_20px] text-[13px] text-gray-700">
                                    <div className="font-semibold">{emp.prenom} {emp.nom}</div>
                                    <div className="text-[11px] text-gray-400">{emp.email}</div>
                                </td>
                                <td className="p-[15px_20px] text-[13px] text-gray-700">{emp.poste}</td>
                                <td className="p-[15px_20px] text-[13px] text-gray-700">
                                    <div className="flex gap-2.5">
                                        <button onClick={() => handleEdit(emp)} className="p-1.5 rounded-md text-[#4B42C8] bg-[#EEEDFE]">{icons.edit}</button>
                                        <button onClick={() => handleDelete(emp.id)} className="p-1.5 rounded-md text-red-600 bg-red-50">{icons.delete}</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-5">
                <span className="text-[13px] text-gray-500">Page {currentPage} sur {paginationData.last_page || 1}</span>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="bg-[#F0F5FF] p-2 rounded-lg text-[#4B42C8] disabled:opacity-30" disabled={currentPage === 1}>{"<"}</button>
                    <button onClick={() => setCurrentPage(p => Math.min(p + 1, paginationData.last_page))} className="bg-[#F0F5FF] p-2 rounded-lg text-[#4B42C8] disabled:opacity-30" disabled={currentPage === paginationData.last_page}>{">"}</button>
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]">
                    <div className="bg-white p-[30px] rounded-[20px] w-[600px] max-h-[90vh] shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center mb-5">
                            <h2 className="text-[18px] font-bold">{isEdit ? "Modifier" : "Ajouter"} un Employé</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-black">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-[25px] max-h-[70vh] overflow-y-auto pr-2">
                            {/* Section 1 */}
                            <div className="grid grid-cols-2 gap-[15px]">
                                <FormField label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} error={errors.prenom} />
                                <FormField label="Nom" name="nom" value={formData.nom} onChange={handleChange} error={errors.nom} />
                                <FormField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} className="col-span-2" />
                                <FormField label="Téléphone" name="telephone" value={formData.telephone} onChange={handleChange} error={errors.telephone} />
                                <FormField label="Situation" name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} options={[{label:"Choisir...", value:""}, {label:"Célibataire", value:"Célibataire"}, {label:"Marié(e)", value:"Marié(e)"}]} />
                                <FormField label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} className="col-span-2" />
                            </div>

                            {/* Section 2 */}
                            <div className="grid grid-cols-2 gap-[15px] border-t pt-5">
                                <FormField label="Département" name="departement" value={formData.departement} onChange={handleChange} error={errors.departement} options={[{label:"Choisir...", value:""}, {label:"IT", value:"IT"}, {label:"RH", value:"RH"}]} />
                                <FormField label="Poste" name="poste" value={formData.poste} onChange={handleChange} error={errors.poste} />
                                <FormField label="Date Embauche" name="date_embauche" type="date" value={formData.date_embauche} onChange={handleChange} />
                                <FormField label="Contrat" name="type_contrat" value={formData.type_contrat} onChange={handleChange} options={[{label:"Choisir...", value:""}, {label:"CDI", value:"CDI"}, {label:"CDD", value:"CDD"}]} />
                            </div>

                            {/* Section 3: Classification */}
                            <div className="bg-gray-50 p-4 rounded-xl grid grid-cols-3 gap-3">
                                <FormField label="Grade" name="grade" value={formData.grade} onChange={handleChange} />
                                <FormField label="Échelle" name="echelle" value={formData.echelle} onChange={handleChange} />
                                <FormField label="Échelon" name="echelon" value={formData.echelon} onChange={handleChange} />
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-3 bg-gray-100 text-gray-600 rounded-xl font-bold">Annuler</button>
                                <button type="submit" disabled={loading} className="flex-1 p-3 bg-[#4B42C8] text-white rounded-xl font-bold disabled:opacity-50">
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