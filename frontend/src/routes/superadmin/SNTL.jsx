import React, { useState } from 'react';
import { Settings, Car, Fuel, MapPin, Plus, Save, History, ShieldCheck } from 'lucide-react';

const ParametrageSNTL = () => {
  const [activeSection, setActiveSection] = useState('GENERAL');

  return (
    <div className="bg-[#F8FAFC] dark:bg-[#0a0a0a] min-h-screen font-sans text-slate-900 dark:text-white transition-colors duration-300 p-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Paramétrage SNTL</h1>
          <p className="text-slate-400 dark:text-gray-500 font-medium text-sm mt-1 max-w-md">
            Configuration des plafonds de transport, gestion des indemnités kilométriques et frais de déplacement.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white dark:bg-[#121212] text-slate-600 dark:text-gray-300 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#262626] font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all">
            <History size={16}/> Historique
          </button>
          <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all">
            <Save size={16}/> Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* Sidebar de Navigation Interne */}
        <div className="col-span-12 lg:col-span-3 space-y-2">
          <NavButton 
            active={activeSection === 'GENERAL'} 
            onClick={() => setActiveSection('GENERAL')} 
            icon={<Settings size={18}/>} 
            label="Paramètres Généraux" 
          />
          <NavButton 
            active={activeSection === 'PLAFONDS'} 
            onClick={() => setActiveSection('PLAFONDS')} 
            icon={<Car size={18}/>} 
            label="Plafonds par Catégorie" 
          />
          <NavButton 
            active={activeSection === 'CARBURANT'} 
            onClick={() => setActiveSection('CARBURANT')} 
            icon={<Fuel size={18}/>} 
            label="Grille Carburant & IK" 
          />
          <NavButton 
            active={activeSection === 'MISSIONS'} 
            onClick={() => setActiveSection('MISSIONS')} 
            icon={<MapPin size={18}/>} 
            label="Zones de Mission" 
          />
        </div>

        {/* Form Content */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white dark:bg-[#121212] rounded-[2.5rem] border border-slate-100 dark:border-[#262626] p-8 shadow-sm">
            
            {activeSection === 'GENERAL' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <SectionHeader title="Configuration Globale" subtitle="Définissez les règles de base pour le module SNTL" />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Délai de soumission (jours)" placeholder="15" type="number" help="Jours max après mission pour soumettre les frais" />
                  <InputGroup label="TVA Récupérable (%)" placeholder="20" type="number" />
                  
                  <div className="md:col-span-2 p-6 bg-indigo-50/50 dark:bg-indigo-500/5 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 flex items-center justify-between">
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-[#1c1c1c] flex items-center justify-center shadow-sm">
                        <ShieldCheck className="text-indigo-600" size={20}/>
                      </div>
                      <div>
                        <p className="text-sm font-black dark:text-white">Validation Automatique</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Approuver les frais inférieurs au plafond sans intervention</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-[#262626] peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'PLAFONDS' && (
              <div className="space-y-6 animate-in fade-in duration-500">
                <SectionHeader title="Plafonds de Remboursement" subtitle="Limites par catégorie de véhicule et grade" />
                
                <div className="overflow-hidden border border-slate-100 dark:border-[#262626] rounded-3xl">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-[#1c1c1c]">
                      <tr>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Catégorie</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plafond Mensuel</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entretien Max</th>
                        <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-[#262626]">
                      <TableRow category="Direction" plafond="5,000 DH" entretien="12,000 DH" status="Active" />
                      <TableRow category="Cadre Supérieur" plafond="3,500 DH" entretien="8,000 DH" status="Active" />
                      <TableRow category="Service" plafond="2,000 DH" entretien="5,000 DH" status="Inactive" />
                    </tbody>
                  </table>
                </div>
                <button className="flex items-center gap-2 text-indigo-600 font-black text-[11px] uppercase tracking-widest hover:underline">
                  <Plus size={16}/> Ajouter une catégorie
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components (Helpers) ---

const NavButton = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
      active 
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none' 
      : 'text-slate-400 hover:bg-white dark:hover:bg-[#121212] hover:text-slate-600'
    }`}
  >
    {icon} {label}
  </button>
);

const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h3 className="text-xl font-black text-slate-800 dark:text-white">{title}</h3>
    <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{subtitle}</p>
  </div>
);

const InputGroup = ({ label, placeholder, type = "text", help }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      className="w-full bg-slate-50 dark:bg-[#1c1c1c] dark:text-white border-2 border-transparent focus:border-indigo-500 rounded-2xl p-4 outline-none font-bold transition-all text-sm"
    />
    {help && <p className="text-[9px] text-slate-400 font-medium ml-1 italic">{help}</p>}
  </div>
);

const TableRow = ({ category, plafond, entretien, status }) => (
  <tr className="dark:text-gray-300">
    <td className="p-4 font-black text-sm">{category}</td>
    <td className="p-4 font-bold">{plafond}</td>
    <td className="p-4 font-bold">{entretien}</td>
    <td className="p-4">
      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
        status === 'Active' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 text-slate-400'
      }`}>
        {status}
      </span>
    </td>
  </tr>
);

export default ParametrageSNTL;