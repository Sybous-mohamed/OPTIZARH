import React, { useEffect, useState } from 'react';
import api from '../../lib/apis/axiosConfig'; 
import { DollarSign, AlertCircle, Loader2, ChevronRight, User, Phone, Mail, Calendar, Baby, Briefcase, X, Wallet, Building, FileText, CreditCard, MinusCircle } from 'lucide-react';

const SalariesSummaryPage = () => {
    const [salaries, setSalaries] = useState([]);
    const [selectedEmp, setSelectedEmp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/api/rh/all-salaries', {
                    headers: { 'Accept': 'application/json' }
                });
                
                if (Array.isArray(response.data)) {
                    setSalaries(response.data);
                } else {
                    setError("Le format des données est incorrect.");
                }
            } catch (err) {
                setError("Erreur lors du chargement des salaires");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const fmt = (val) => new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(val || 0);

    // Fonction utilitaire pour s'assurer qu'on a bien un tableau (au cas où les données arrivent en string JSON)
    const getArray = (data) => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        try { return JSON.parse(data); } catch (e) { return []; }
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
    );

    if (error) return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 m-6">
            <AlertCircle size={20} /> {error}
        </div>
    );

    return (
        <div className="p-6 bg-gray-50 dark:bg-[#0f0f0f] min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white italic">DASHBOARD RH</h1>
                    <p className="text-gray-500">Gestion centralisée de la paie et des carrières</p>
                </div>

                {/* --- TABLEAU CLASSIC --- */}
                <div className="bg-white dark:bg-[#181818] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 text-gray-400 text-[11px] uppercase tracking-widest font-bold">
                                <th className="p-4 border-b dark:border-gray-800">Employé</th>
                                <th className="p-4 border-b dark:border-gray-800">Grade</th>
                                <th className="p-4 border-b dark:border-gray-800 text-indigo-600">Net à Payer</th>
                                <th className="p-4 border-b dark:border-gray-800">Statut</th>
                                <th className="p-4 border-b dark:border-gray-800 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {salaries.map((emp) => (
                                <tr key={emp.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            {emp.info_perso?.profile_image ? (
                                                <img src={emp.info_perso.profile_image} alt={emp.full_name} className="w-10 h-10 rounded-xl object-cover shadow-lg" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                                                    {emp.full_name.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-white">{emp.full_name}</div>
                                                <div className="text-xs text-gray-500 italic">{emp.age} ans</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm font-medium dark:text-gray-300">{emp.grade}</td>
                                    <td className="p-4 font-bold text-emerald-600">{fmt(emp.details?.net_salary)}</td>
                                    <td className="p-4">
                                        <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${emp.statut === 'ACTIF' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {emp.statut || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button 
                                            onClick={() => setSelectedEmp(emp)}
                                            className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600 transition-colors"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL MODERN (DETAILS COMPLETS) --- */}
            {selectedEmp && (
                <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-sm">
                    <div className="h-full w-full max-w-2xl bg-white dark:bg-[#121212] shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                        
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Dossier de Paie Complet</h2>
                            <button onClick={() => setSelectedEmp(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"><X size={24} className="dark:text-white" /></button>
                        </div>

                        {/* Card Header Info */}
                        <div className="flex gap-6 mb-8 p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                            {selectedEmp.info_perso?.profile_image ? (
                                <img src={selectedEmp.info_perso.profile_image} alt={selectedEmp.full_name} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-indigo-200" />
                            ) : (
                                <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                                    {selectedEmp.full_name.charAt(0)}
                                </div>
                            )}
                            <div>
                                <h3 className="text-2xl font-bold dark:text-white">{selectedEmp.full_name}</h3>
                                <p className="text-indigo-600 font-medium">{selectedEmp.grade}</p>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1"><Calendar size={14}/> {selectedEmp.age} ans</span>
                                    <span className="flex items-center gap-1"><Briefcase size={14}/> Embauche: {selectedEmp.info_perso?.date_embauche}</span>
                                </div>
                            </div>
                        </div>

                        <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">

                            <User size={16}/> Informations Personnelles

                        </h4>

                        <div className="grid grid-cols-2 gap-4 mb-8">

                            <InfoCard icon={<Mail size={16}/>} label="Email" value={selectedEmp.info_perso?.email} />

                            <InfoCard icon={<Phone size={16}/>} label="Téléphone" value={selectedEmp.info_perso?.telephone} />

                            <InfoCard icon={<User size={16}/>} label="Situation" value={selectedEmp.info_perso?.situation} />

                            <InfoCard icon={<Baby size={16}/>} label="Enfants" value={selectedEmp.info_perso?.enfants} />

                        </div>



                        {/* Infos Administratives */}

                        <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">

                            <FileText size={16}/> Grade & Échelon

                        </h4>

                        <div className="grid grid-cols-3 gap-4 mb-8">

                            <InfoCard label="Échelle" value={selectedEmp.admin_info?.echelle || '-'} />

                            <InfoCard label="Échelon" value={selectedEmp.admin_info?.echelon || '-'} />

                            <InfoCard label="Indice" value={selectedEmp.admin_info?.indice || '-'} />

                        </div>

                        {/* =========================================
                            NOUVELLE SECTION : SALAIRE DE BASE & INDEMNITÉS
                        ========================================= */}
                        <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                            <Wallet className="text-emerald-500" size={16}/> Salaire de base et indemnités
                        </h4>
                        <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 space-y-3 border border-gray-100 dark:border-gray-800 mb-8">
                            
                            <SalaryLine label="Salaire de base" value={fmt(selectedEmp.details?.base_salary)} />
                            
                            {getArray(selectedEmp.details?.indemnites?.details).length > 0 && (
                                <>
                                    <div className="pt-2 text-[11px] text-gray-400 uppercase font-bold tracking-widest">Indemnités appliquées :</div>
                                    {getArray(selectedEmp.details.indemnites.details).map((indemnite, index) => (
                                        <SalaryLine 
                                            key={`ind-${index}`} 
                                            label={`${indemnite.name || indemnite.label} ${indemnite.type ? `(${indemnite.type})` : ''}`} 
                                            value={`+ ${fmt(indemnite.montant || indemnite.value)}`} 
                                        />
                                    ))}
                                </>
                            )}
                            
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                                <SalaryLine label="Total indemnités" value={`+ ${fmt(selectedEmp.details?.indemnites?.total)}`} />
                            </div>
                            
                            <div className="pt-2 mt-2 border-t-2 border-gray-200 dark:border-gray-700">
                                <SalaryLine label="Salaire brut" value={fmt(selectedEmp.details?.brut_salary)} bold />
                            </div>
                        </div>

                        {/* =========================================
                            NOUVELLE SECTION : DÉDUCTIONS (DÉTAILLÉES)
                        ========================================= */}
                        <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                            <MinusCircle className="text-orange-500" size={16}/> Déductions
                        </h4>
                        
                        <div className="bg-orange-50 dark:bg-orange-900/10 rounded-2xl p-6 space-y-4 border border-orange-100 dark:border-orange-900/30 mb-8">
                            
                            {/* COTISATIONS SOCIALES */}
                            <div>
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">Cotisations sociales</div>
                                {getArray(selectedEmp.details?.cotisations?.details).map((cot, index) => (
                                    <SalaryLine 
                                        key={`cot-${index}`} 
                                        label={`${cot.name || cot.label} (${cot.taux || cot.percentage}%)`} 
                                        value={`- ${fmt(cot.montant || cot.value)}`} 
                                        red 
                                    />
                                ))}
                                <div className="mt-1">
                                    <SalaryLine label="Total cotisations" value={`- ${fmt(selectedEmp.details?.cotisations?.total)}`} red bold />
                                </div>
                            </div>

                            {/* IR (IMPÔT SUR LE REVENU) */}
                            <div className="border-t border-orange-200/50 dark:border-orange-800/30 pt-3">
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">IR (Impôt sur le revenu)</div>
                                <SalaryLine 
                                    label={`Taux: ${selectedEmp.details?.ir?.taux || '0.00'}%`} 
                                    value={`- ${fmt(selectedEmp.details?.ir?.total)}`} 
                                    red 
                                />
                            </div>

                            {/* RCAR */}
                            <div className="border-t border-orange-200/50 dark:border-orange-800/30 pt-3">
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">RCAR (Retraite)</div>
                                {getArray(selectedEmp.details?.rcar?.details).map((r, index) => (
                                    <SalaryLine 
                                        key={`rcar-${index}`} 
                                        label={`${r.name || r.label} (${r.taux || r.percentage}%)`} 
                                        value={`- ${fmt(r.montant || r.value)}`} 
                                        red 
                                    />
                                ))}
                                <div className="mt-1">
                                    <SalaryLine label="Total RCAR" value={`- ${fmt(selectedEmp.details?.rcar?.total)}`} red bold />
                                </div>
                            </div>

                            {/* SNTL */}
                            <div className="border-t border-orange-200/50 dark:border-orange-800/30 pt-3">
                                <div className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-widest mb-2">SNTL</div>
                                {getArray(selectedEmp.details?.sntl?.details).map((s, index) => (
                                    <SalaryLine 
                                        key={`sntl-${index}`} 
                                        label={`${s.name || s.label} (${s.taux || 'undefined'}%)`} 
                                        value={`- ${fmt(s.montant || s.value)}`} 
                                        red 
                                    />
                                ))}
                                <div className="mt-1">
                                    <SalaryLine label="Total SNTL" value={`- ${fmt(selectedEmp.details?.sntl?.total)}`} red bold />
                                </div>
                            </div>

                            {/* TOTAL DES DÉDUCTIONS */}
                            <div className="border-t-2 border-orange-200 dark:border-orange-800 pt-3 mt-4">
                                <SalaryLine label="Total des déductions" value={`- ${fmt(selectedEmp.details?.total_deductions)}`} red bold />
                            </div>
                        </div>

                        {/* Détails Crédits (S'il y en a) */}
                        {getArray(selectedEmp.details?.credits?.details).length > 0 && (
                            <>
                                <h4 className="font-bold mb-4 dark:text-white flex items-center gap-2 text-sm uppercase tracking-wider text-gray-500">
                                    <CreditCard className="text-red-500" size={16}/> Situations de Crédit
                                </h4>
                                <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 space-y-3 border border-red-100 dark:border-red-900/30 mb-8">
                                    {getArray(selectedEmp.details.credits.details).map((credit, idx) => (
                                        <div key={idx} className="mb-4 pb-4 border-b border-red-100 dark:border-red-800/30 last:border-0 last:pb-0 last:mb-0">
                                            <div className="font-bold text-gray-800 dark:text-gray-200 mb-2">{credit.name}</div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <div className="text-[10px] text-gray-400 uppercase font-bold">Reste à Payer</div>
                                                    <div className="font-semibold dark:text-gray-300">{fmt(credit.reste)}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[10px] text-gray-400 uppercase font-bold">Mensualité retenue</div>
                                                    <div className="font-semibold text-red-500">- {fmt(credit.mensualite)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="pt-2 border-t border-red-200 dark:border-red-800/50">
                                        <SalaryLine label="Total retenues crédit" value={`- ${fmt(selectedEmp.details?.credits?.total)}`} red bold />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* NET A PAYER FINAL */}
                        <div className="flex justify-between items-center p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                            <div>
                                <span className="block font-bold text-lg">NET À VIRER</span>
                                <span className="block text-emerald-100 text-xs">Après toutes déductions</span>
                            </div>
                            <span className="text-3xl font-black">{fmt(selectedEmp.details?.net_salary)}</span>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
const InfoCard = ({ icon, label, value }) => (

    <div className="p-3 border border-gray-100 dark:border-gray-800 rounded-xl bg-white dark:bg-[#1a1a1a]">

        {icon && <div className="text-indigo-500 mb-1">{icon}</div>}

        <div className="text-[10px] text-gray-400 uppercase font-bold">{label}</div>

        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{value || '-'}</div>

    </div>

);

const SalaryLine = ({ label, value, bold, red }) => (
    <div className="flex justify-between items-center text-sm py-1">
        <span className={`${bold ? 'font-semibold text-gray-800 dark:text-gray-200' : 'text-gray-600 dark:text-gray-400'}`}>
            {label}
        </span>
        <span className={`font-mono ${bold ? 'font-black text-base' : ''} ${red ? 'text-red-500 font-medium' : 'text-gray-900 dark:text-gray-200'}`}>
            {value}
        </span>
    </div>
);

export default SalariesSummaryPage;