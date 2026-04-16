import React, { useState , useEffect} from "react";
import { icons } from "../assets/icons";
import axiosClient from "../api/axios"; 

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
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
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
        <div style={{ padding: "10px 0" }}>
            {/* Header Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 30 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Gestion des Employés</h1>
                    <p style={{ color: "#666", fontSize: 14, marginTop: 4 }}>Gérez les effectifs et organisez les départements.</p>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                    <button 
                        style={secondaryBtnStyle} 
                        onClick={handleExportPDF} 
                        disabled={loading}>
                        {loading ? "Génération..." : <>{icons.export} Exporter</>}
                    </button>
                    <button style={primaryBtnStyle} onClick={() => setShowModal(true)}>
                        {icons.plus} Ajouter un Employé
                    </button>
                </div>
            </div>

            <div style={statsGridStyle}>
                <StatCard title="EFFECTIF TOTAL" value={stats.total} color="#4B42C8" />
                <StatCard title="ACTIFS" value={stats.actifs} subValue={`${((stats.actifs/stats.total)*100).toFixed(0)}%`} color="#2E7D32" />
                <StatCard title="EN CONGÉ" value={stats.conge} badge="Saison" color="#f57c00" />
                <StatCard title="DÉPARTS (MOIS)" value={stats.departs} color="#d32f2f" />
            </div>

            <div style={filterBarStyle}>
                <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: "700" }}>{icons.filter} Filtres:</span>
                    <select onChange={(e) => setFilters({...filters, departement: e.target.value})} style={selectStyle}>
                        <option value="Tous">Département: Tous</option>
                        <option value="IT">IT</option>
                        <option value="RH">RH</option>
                    </select>
                    <select onChange={(e) => setFilters({...filters, statut: e.target.value})} style={selectStyle}>
                        <option value="Tous">Statut: Tous</option>
                        <option value="ACTIF">Actif</option>
                        <option value="CONGÉ">Congé</option>
                    </select>
                </div>
                <div style={searchWrapperStyle}>
                    {icons.search}
                    <input 
                        type="text" 
                        placeholder="Rechercher un employé..." 
                        style={searchInputStyle}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
            </div>

            {/* Stats & Table */}
            <div style={tableContainerStyle}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={theadStyle}>
                            <th style={thStyle}>EMPLOYÉ</th>
                            <th style={thStyle}>MATRICULE</th>
                            <th style={thStyle}>POSTE</th>
                            <th style={thStyle}>STATUT</th>
                            <th style={thStyle}>ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employeesList.length > 0 ? (
                            employeesList.map((emp) => (
                                <tr key={emp.id} style={trStyle}>
                                    <td style={tdStyle}>
                                        <div style={{ fontWeight: 600 }}>{emp.prenom} {emp.nom}</div>
                                        <div style={{ fontSize: 11, color: "#888" }}>{emp.email}</div>
                                    </td>
                                    <td style={tdStyle}>{emp.id}</td> 
                                    <td style={tdStyle}>{emp.poste || "Non spécifié"}</td>
                                    <td style={tdStyle}>
                                        <span style={activeBadgeStyle}>ACTIF</span>
                                    </td>
                                    <td style={tdStyle}>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button 
                                                onClick={() => handleEdit(emp)} 
                                                style={{ ...iconBtnStyle, color: "#4B42C8", background: "#EEEDFE" }}>
                                                {icons.edit}
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(emp.id)} 
                                                style={{ ...iconBtnStyle, color: "#e53935", background: "#ffebee" }}>
                                                {icons.delete}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                                    Aucun employé trouvé.
                                </td>
                            </tr>
                            
                        )}
                    </tbody>
                </table>
            </div>

            <div style={paginationContainerStyle}>
                <span style={{ fontSize: "13px", color: "#666" }}>
                    Affichage de {paginationData.from || 0} à {paginationData.to || 0} sur {paginationData.total || 0} employés
                </span>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    {/* Bouton Précédent */}
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={pageBtnIconStyle}
                    >
                        {icons.chevronLeft || "<"}
                    </button>

                    {/* numero de page */}
                    <button style={activePageBtnStyle}>
                        {currentPage}
                    </button>

                    {/* Bouton Suivant */}
                    <button 
                        onClick={() => setCurrentPage(prev => (prev < paginationData.last_page ? prev + 1 : prev))}
                        disabled={currentPage === paginationData.last_page}
                        style={pageBtnIconStyle}
                    >
                        {icons.chevronRight || ">"}
                    </button>
                </div>
            </div>

            {/* Form Modal */}
            {showModal && (
            <div style={modalOverlayStyle}>
                <div style={modalContentFullStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Ajouter un Employé</h2>
                        <button onClick={() => setShowModal(false)} style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20 }}>✕</button>
                    </div>
                    <p style={{ color: "#888", fontSize: 13, marginBottom: 25 }}>Remplissez les informations ci-dessous.</p>

                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 25, maxHeight: "75vh", overflowY: "auto", paddingRight: "10px" }}>
                        
                        {/* Section 1: INFORMATIONS PERSONNELLES */}
                        <div style={sectionContainerStyle}>
                            <div style={sectionTitleStyle}>
                                <span style={iconCircleStyle}>{icons.users}</span>
                                INFORMATIONS PERSONNELLES
                            </div>
                            <div style={gridStyle}>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>PRÉNOM</label>
                                    <input name="prenom" value={formData.prenom} onChange={handleChange} style={inputFullStyle} type="text" required />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>NOM</label>
                                    <input name="nom" value={formData.nom} onChange={handleChange} style={inputFullStyle} type="text" required />
                                </div>
                                <div style={{...groupStyle, gridColumn: "span 2"}}>
                                    <label style={labelStyle}>EMAIL PERSONNEL</label>
                                    <input name="email" value={formData.email} onChange={handleChange} style={inputFullStyle} type="email" required />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>TÉLÉPHONE</label>
                                    <input name="telephone" value={formData.telephone} onChange={handleChange} style={inputFullStyle} type="text" />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>DATE DE NAISSANCE</label>
                                    <input name="date_naissance" value={formData.date_naissance} onChange={handleChange} style={inputFullStyle} type="date" />
                                </div>
                                <div style={{...groupStyle, gridColumn: "span 2"}}>
                                    <label style={labelStyle}>ADRESSE</label>
                                    <input name="adresse" value={formData.adresse} onChange={handleChange} style={inputFullStyle} type="text" />
                                </div>
                                <div style={{...groupStyle, gridColumn: "span 2"}}>
                                    <label style={labelStyle}>SITUATION FAMILIALE</label>
                                    <select name="situation_familiale" value={formData.situation_familiale} onChange={handleChange} style={inputFullStyle}>
                                        <option value="">Choisir...</option>
                                        <option value="Célibataire">Célibataire</option>
                                        <option value="Marié(e)">Marié(e)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: INFORMATIONS PROFESSIONNELLES */}
                        <div style={sectionContainerStyle}>
                            <div style={sectionTitleStyle}>
                                <span style={{...iconCircleStyle, background: "#EEEDFE"}}>{icons.rcar}</span>
                                INFORMATIONS PROFESSIONNELLES
                            </div>
                            <div style={gridStyle}>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>DÉPARTEMENT</label>
                                    <select name="departement" value={formData.departement} onChange={handleChange} style={inputFullStyle}>
                                        <option value="">Choisir...</option>
                                        <option value="IT">IT</option>
                                        <option value="RH">RH</option>
                                    </select>
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>DATE D'EMBAUCHE</label>
                                    <input name="date_embauche" value={formData.date_embauche} onChange={handleChange} style={inputFullStyle} type="date" />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>POSTE</label>
                                    <input name="poste" value={formData.poste} onChange={handleChange} style={inputFullStyle} type="text" />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>TYPE DE CONTRAT</label>
                                    <select name="type_contrat" value={formData.type_contrat} onChange={handleChange} style={inputFullStyle}>
                                        <option value="">Choisir...</option>
                                        <option value="CDI">CDI</option>
                                        <option value="CDD">CDD</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: CLASSIFICATION */}
                        <div style={classificationBoxStyle}>
                            <div style={gridStyle}>
                                <div style={{...groupStyle, gridColumn: "span 2"}}>
                                    <label style={labelStyle}>GRADE / CLASSE</label>
                                    <input name="grade" value={formData.grade} onChange={handleChange} style={inputWhiteStyle} type="text" />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>ÉCHELLE</label>
                                    <input name="echelle" value={formData.echelle} onChange={handleChange} style={inputWhiteStyle} type="text" />
                                </div>
                                <div style={groupStyle}>
                                    <label style={labelStyle}>ÉCHELON</label>
                                    <input name="echelon" value={formData.echelon} onChange={handleChange} style={inputWhiteStyle} type="text" />
                                </div>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div style={{ display: "flex", gap: 15, marginTop: 10, paddingBottom: 10 }}>
                            <button type="button" onClick={() => setShowModal(false)} style={cancelBtnFullStyle}>Annuler</button>
                            <button type="submit" disabled={loading} style={saveBtnFullStyle}>
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

const primaryBtnStyle = { background: "#4B42C8", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 };
const secondaryBtnStyle = { background: "#EEEDFE", color: "#4B42C8", border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 };
const tableContainerStyle = { background: "#fff", borderRadius: 12, border: "1px solid #eee", overflow: "hidden" };
const theadStyle = { background: "#F8FAFF", borderBottom: "1px solid #eee" };
const thStyle = { textAlign: "left", padding: "15px 20px", fontSize: 11, fontWeight: 700, color: "#888" };
const trStyle = { borderBottom: "1px solid #f9f9f9" };
const tdStyle = { padding: "15px 20px", fontSize: 13, color: "#444" };
const activeBadgeStyle = { background: "#E8F5E9", color: "#2E7D32", padding: "4px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700 };
const actionBtnStyle = { border: "none", background: "none", cursor: "pointer", color: "#aaa" };
const modalOverlayStyle = { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 };
const modalContentFullStyle = { background: "#fff", padding: "30px", borderRadius: "20px", width: "600px", maxHeight: "90vh", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", zIndex: 1001, overflow: "hidden" };
const sectionContainerStyle = { display: "flex", flexDirection: "column", gap: 15 };
const sectionTitleStyle = { fontSize: "12px", fontWeight: "800", color: "#555", display: "flex", alignItems: "center", gap: "10px" };
const iconCircleStyle = { width: "28px", height: "28px", borderRadius: "8px", background: "#F0F0FF", color: "#4B42C8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" };
const gridStyle = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" };
const groupStyle = { display: "flex", flexDirection: "column", gap: "6px" };
const labelStyle = { fontSize: "11px", fontWeight: "700", color: "#444", marginBottom: 5, display: "block" };
const inputFullStyle = { width: "100%", padding: "10px 12px", background: "#DDE9FB", border: "none", borderRadius: "8px", fontSize: "13px", outline: "none" };
const classificationBoxStyle = { background: "#F0F5FF", padding: "20px", borderRadius: "12px" };
const inputWhiteStyle = { ...inputFullStyle, background: "#fff", border: "1px solid #eee" };
const cancelBtnFullStyle = { flex: 1, padding: "12px", background: "#DDE9FB", color: "#4B42C8", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" };
const saveBtnFullStyle = { flex: 1, padding: "12px", background: "#4B42C8", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700", cursor: "pointer" };
const iconBtnStyle = {
    border: "none",
    padding: "6px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "0.2s"
};
const statsGridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "20px",
    marginBottom: "30px"
};

const filterBarStyle = {
    background: "#F0F5FF",
    padding: "15px 25px",
    borderRadius: "15px 15px 0 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e0e6ed",
    borderBottom: "none"
};

const selectStyle = {
    padding: "8px 12px",
    borderRadius: "8px",
    border: "1px solid #ddd",
    fontSize: "13px",
    outline: "none",
    background: "#fff"
};

const searchWrapperStyle = {
    position: "relative",
    display: "flex",
    alignItems: "center",
    background: "#fff",
    borderRadius: "20px",
    padding: "0 15px",
    width: "300px",
    border: "1px solid #eee"
};

const searchInputStyle = {
    border: "none",
    padding: "10px",
    fontSize: "13px",
    outline: "none",
    width: "100%"
};
// Component sghir l-StatCard
const StatCard = ({ title, value, subValue, badge, color }) => (
    <div style={{ background: "#fff", padding: "20px", borderRadius: "15px", border: "1px solid #eee", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
        <p style={{ fontSize: "11px", fontWeight: "700", color: "#888", marginBottom: "10px" }}>{title}</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
            <span style={{ fontSize: "28px", fontWeight: "800", color: "#333" }}>{value}</span>
            {subValue && <span style={{ fontSize: "12px", color: "#4caf50", fontWeight: "600" }}>+{subValue}</span>}
            {badge && <span style={{ fontSize: "10px", background: "#f0f0ff", color: "#4B42C8", padding: "2px 8px", borderRadius: "10px" }}>{badge}</span>}
        </div>
    </div>
);

const paginationContainerStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "20px",
    padding: "0 10px"
};

const pageBtnIconStyle = {
    background: "#F0F5FF",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#4B42C8",
    opacity: (props) => props.disabled ? 0.5 : 1
};

const activePageBtnStyle = {
    background: "#4B42C8",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    width: "32px",
    height: "32px",
    fontWeight: "700",
    fontSize: "13px"
};