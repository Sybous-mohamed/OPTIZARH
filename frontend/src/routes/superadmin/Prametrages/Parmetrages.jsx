import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Settings, 
  CreditCard, 
  FileText, 
  Calculator, 
  ArrowLeft,
  Gift,
  TrendingUp,
  Car
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

const Parmetrages = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { darkMode } = useTheme();

    const sections = [
        {
            id: 1,
            title: "Gestion d'État",
            desc: "Configuration des années budgétaires, rôles et échelons.",
            icon: <ShieldCheck className="w-8 h-8" />,
            path: "GestionEtat",
            status: "ACTIF",
            color: "indigo"
        },
        {
            id: 2,
            title: "Gestion Indemnités",
            desc: "Moteur de calcul des primes et indemnités de fonction.",
            icon: <Gift className="w-8 h-8" />,
            path: "GestionIndemenitee",
            status: "ACTIF",
            color: "green"
        },
        {
            id: 3,
            title: "Cotisations",
            desc: "Paramétrage des taux de cotisations sociales et mutuelles.",
            icon: <CreditCard className="w-8 h-8" />,
            path: "Cotisation",
            status: "ACTIF",
            color: "blue"
        },
        {
            id: 4,
            title: "RCAR",
            desc: "Gestion de la retraite collective et affiliation des agents.",
            icon: <Car className="w-8 h-8" />,
            path: "RCAR",
            status: "ACTIF",
            color: "purple"
        },
        {
            id: 5,
            title: "IR Fiscalité",
            desc: "Calcul des tranches de l'impôt sur le revenu (IR).",
            icon: <Calculator className="w-8 h-8" />,
            path: "GesionIR",
            status: "ACTIF",
            color: "orange"
        },
        {
            id: 6,
            title: "Crédits",
            desc: "Gestion des crédits et facilités pour les employés.",
            icon: <TrendingUp className="w-8 h-8" />,
            path: "Credit",
            status: "ACTIF",
            color: "red"
        }
    ];

    // Dark mode classes
    const bgClass = darkMode ? 'bg-[#0D0D0D]' : 'bg-[#F8FAFC]';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-indigo-800' : 'bg-white border-transparent hover:border-indigo-100';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-500' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-100';
    const buttonClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] text-gray-300 hover:bg-[#252525]' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50';

    const isMainPage = location.pathname === "/SuperAdmin/Parametrages";

    if (!isMainPage) {
        return (
            <div className="p-6 min-h-screen bg-gray-50 dark:bg-[#0D0D0D]">
                <button 
                    onClick={() => navigate(-1)} 
                    className="mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                    <ArrowLeft size={20} /> Retour aux Paramétrages
                </button>
                <div className={`rounded-2xl shadow-sm border ${borderClass} p-6 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
                    <Outlet />
                </div>
            </div>
        );
    }

    return (
        <div className={`p-3 min-h-screen transition-colors duration-300 ${bgClass}`}>
            <div className="mb-8">
                <h1 className={`text-2xl font-bold ${textClass}`}>Paramétrages du Système</h1>
                <p className={`${textMutedClass} mt-1`}>Gérez les configurations globales de l'application OptizaRH</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sections.map((section) => {
                    const getColorStyles = () => {
                        switch(section.color) {
                            case 'indigo': return { bg: 'bg-indigo-50 dark:bg-indigo-900/30', hover: 'group-hover:bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' };
                            case 'green': return { bg: 'bg-green-50 dark:bg-green-900/30', hover: 'group-hover:bg-green-600', text: 'text-green-600 dark:text-green-400' };
                            case 'blue': return { bg: 'bg-blue-50 dark:bg-blue-900/30', hover: 'group-hover:bg-blue-600', text: 'text-blue-600 dark:text-blue-400' };
                            case 'purple': return { bg: 'bg-purple-50 dark:bg-purple-900/30', hover: 'group-hover:bg-purple-600', text: 'text-purple-600 dark:text-purple-400' };
                            case 'orange': return { bg: 'bg-orange-50 dark:bg-orange-900/30', hover: 'group-hover:bg-orange-600', text: 'text-orange-600 dark:text-orange-400' };
                            case 'red': return { bg: 'bg-red-50 dark:bg-red-900/30', hover: 'group-hover:bg-red-600', text: 'text-red-600 dark:text-red-400' };
                            default: return { bg: 'bg-indigo-50 dark:bg-indigo-900/30', hover: 'group-hover:bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400' };
                        }
                    };
                    
                    const colorStyles = getColorStyles();
                    
                    return (
                        <div 
                            key={section.id}
                            onClick={() => navigate(section.path)}
                            className={`group p-8 rounded-2xl shadow-sm border cursor-pointer relative overflow-hidden transition-all duration-300 ${cardClass} ${borderClass} hover:shadow-xl`}
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-4 rounded-2xl transition-all duration-300 ${colorStyles.bg} ${colorStyles.hover}`}>
                                    {React.cloneElement(section.icon, { 
                                        className: `w-8 h-8 transition-colors duration-300 ${colorStyles.text} group-hover:text-white` 
                                    })}
                                </div>
                                <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full">
                                    {section.status}
                                </span>
                            </div>

                            <h3 className={`text-xl font-bold mb-2 transition-colors ${textClass}`}>{section.title}</h3>
                            <p className={`text-sm leading-relaxed ${textMutedClass}`}>
                                {section.desc}
                            </p>

                            {/* Effet de fond animé */}
                            <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-300 ${colorStyles.bg}`} />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Parmetrages;