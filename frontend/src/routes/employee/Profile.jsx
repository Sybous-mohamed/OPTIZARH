import React, { useState, useEffect, useRef } from 'react';
import { 
    Camera, ChevronUp, Save, 
    Loader2, Eye, EyeOff, User, ShieldCheck, 
    Ban, ArrowLeft, Mail, Moon, Sun, 
    Languages, Lock, Users, Database, CheckCircle,
    XCircle, AlertCircle ,Palette
} from 'lucide-react';
import md5 from 'crypto-js/md5';
import api from '../../lib/apis/axiosConfig';
import { useNotification } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
    const { t, i18n } = useTranslation(['superadmin/settings', 'common']);
    const { showNotification } = useNotification();
    const { darkMode, updateTheme, theme: currentTheme } = useTheme();
    const navigate = useNavigate();

    // --- STATES ---
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);

    const [formData, setFormData] = useState({
        full_name: "",
        email: "",
        profile_image: "",
        language: "fr"
    });

    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: ""
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false, new: false, confirm: false
    });

    const [platformSettings, setPlatformSettings] = useState({
        registration_enabled: true
    });
    const [activeUsers, setActiveUsers] = useState([]);
    const [platformLoading, setPlatformLoading] = useState(false);

    // Dark mode classes
    const bgClass = darkMode ? 'bg-gradient-to-br from-[#0D0D0D] to-[#1a1a1a]' : 'bg-gradient-to-br from-gray-50 to-gray-100';
    const cardClass = darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] shadow-xl' : 'bg-white border-gray-200 shadow-lg';
    const textClass = darkMode ? 'text-gray-100' : 'text-gray-800';
    const textMutedClass = darkMode ? 'text-gray-400' : 'text-gray-500';
    const borderClass = darkMode ? 'border-[#2A2A2A]' : 'border-gray-200';
    const inputClass = darkMode ? 'bg-[#252525] border-[#333] text-white focus:ring-2 focus:ring-indigo-500' : 'bg-gray-50 border-gray-200 text-gray-800 focus:ring-2 focus:ring-indigo-500';
    const buttonSecondaryClass = darkMode ? "bg-[#252525] hover:bg-[#333] text-gray-300 border border-[#333] hover:border-indigo-500 transition-all duration-200" : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 hover:border-indigo-400 transition-all duration-200";

    // Handle theme change
    const handleThemeChange = (newTheme) => {
        updateTheme(newTheme);
    };

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/Settings/profile');
                console.log("Profile data:", res.data);
                setFormData({
                    full_name: res.data.full_name || "",
                    email: res.data.email || "",
                    profile_image: res.data.profile_image || "",
                    language: res.data.language || "fr"
                });
            } catch (err) {
                console.error("Erreur fetching profile:", err);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (activeTab === 'platform') {
            fetchPlatformData();
        }
    }, [activeTab]);

    const fetchPlatformData = async () => {
        setPlatformLoading(true);
        try {
            const res = await api.get('/api/Settings/admin/platform-data');
            setPlatformSettings(res.data.settings);
            setActiveUsers(res.data.users);
        } catch (err) {
            console.error("Erreur fetching platform data:", err);
            showNotification("Failed to load platform data", "error");
        } finally {
            setPlatformLoading(false);
        }
    };

    // Compress image function
    const compressImage = (base64String, maxWidth = 500, maxHeight = 500, quality = 0.7) => {
        return new Promise((resolve) => {
            const img = new Image();
            img.src = base64String;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const result = canvas.toDataURL('image/jpeg', quality);
                resolve(result);
            };
        });
    };

    // Handle image selection
    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                showNotification("L'image ne doit pas dépasser 2MB", "error");
                return;
            }
            
            const reader = new FileReader();
            reader.onloadend = async () => {
                setLoading(true);
                try {
                    const compressed = await compressImage(reader.result, 400, 400, 0.6);
                    setFormData({...formData, profile_image: compressed});
                    showNotification("Image chargée avec succès", "success");
                } catch (error) {
                    showNotification("Erreur lors du chargement de l'image", "error");
                } finally {
                    setLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // Handle update profile
    const handleUpdateProfile = async () => {
        if (formData.profile_image && formData.profile_image.length > 50000) {
            showNotification("L'image est trop grande, veuillez en choisir une plus petite", "error");
            return;
        }
        
        setLoading(true);
        const submitData = {
            full_name: formData.full_name,
            email: formData.email,
            profile_image: formData.profile_image,
            language: formData.language
        };
        
        try {
            const res = await api.post('/api/Settings/profile', submitData);
            const userData = res.data.user || res.data;
            // Keep current theme in user data
            userData.theme = currentTheme;
            localStorage.setItem('user', JSON.stringify(userData));
            
            window.dispatchEvent(new Event('userUpdated'));
            i18n.changeLanguage(formData.language);
            
            showNotification('Profil mis à jour avec succès', 'success');
        } catch (err) {
            console.error("Error details:", err.response?.data);
            showNotification(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        } finally { 
            setLoading(false); 
        }
    };

    const handleUpdatePassword = async () => {
        if (!passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation) {
            showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }
        if (passwordData.new_password !== passwordData.new_password_confirmation) {
            showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }
        if (passwordData.new_password.length < 6) {
            showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        setLoading(true);
        try {
            await api.post('/api/Settings/password', passwordData);
            showNotification('Mot de passe mis à jour avec succès', 'success');
            setPasswordData({ current_password: "", new_password: "", new_password_confirmation: "" });
            setIsPasswordOpen(false);
        } catch (err) {
            showNotification(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
        } finally { setLoading(false); }
    };

    const getInitials = (name) => {
        if (!name || name === "") return "??";
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name[0].toUpperCase();
    };

    const handleSetGravatar = () => {
        if (!formData.email) {
            showNotification('Veuillez renseigner votre email', 'warning');
            return;
        }
        const hash = md5(formData.email.trim().toLowerCase());
        const url = `https://www.gravatar.com/avatar/${hash}?s=200&d=identicon`;
        setFormData({ ...formData, profile_image: url });
        showNotification('Gravatar chargé avec succès', 'success');
    };

    const toggleVisibility = (field) => setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));

    return (
        <div className={`min-h-screen ${bgClass}`}>
            <div className="max-w-6xl mx-auto">
                
                {/* Header */}
                <div className="flex items-center gap-4 mb-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className={`p-2 rounded-xl ${darkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:bg-[#252525]' : 'bg-white border-gray-200 hover:bg-gray-50'} border shadow-sm transition-all duration-200 hover:scale-105`}
                    >
                        <ArrowLeft size={20} className={textClass} />
                    </button>
                    <div>
                        <h1 className={`text-2xl font-bold bg-gradient-to-r ${darkMode ? 'from-white to-gray-400' : 'from-gray-900 to-gray-600'} bg-clip-text text-transparent`}>
                            Paramètres
                        </h1>
                        <p className={`text-sm ${textMutedClass} mt-1`}>
                            Gérez votre profil et les paramètres de la plateforme
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className={`flex gap-3 mb-6 p-1.5 rounded-xl ${cardClass} border ${borderClass} w-fit shadow-sm`}>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === 'profile' 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md transform scale-105' 
                                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525] hover:scale-105`
                        }`}
                    >
                        <User size={16} />
                        <span>Mon Profil</span>
                    </button>
                    <button 
                        onClick={() => setActiveTab('platform')}
                        className={`cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                            activeTab === 'platform' 
                                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md transform scale-105' 
                                : `${textMutedClass} hover:bg-gray-100 dark:hover:bg-[#252525] hover:scale-105`
                        }`}
                    >
                        <ShieldCheck size={16} />
                        <span>Plateforme</span>
                    </button>
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className={`${cardClass} rounded-2xl border ${borderClass} overflow-hidden shadow-2xl`}>
                        
                        {/* Avatar Section */}
                        <div className={`p-8 border-b ${borderClass} bg-gradient-to-r from-indigo-50/10 to-transparent dark:from-indigo-900/5`}>
                            <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="relative group">
                                    <div className={`w-28 h-28 rounded-2xl overflow-hidden border-2 ${borderClass} flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-[#252525] to-[#1a1a1a]' : 'bg-gradient-to-br from-gray-100 to-gray-200'} shadow-lg transition-all duration-300 group-hover:shadow-xl`}>
                                        {formData.profile_image ? (
                                            <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                                {getInitials(formData.full_name)}
                                            </span>
                                        )}
                                    </div>
                                    <label className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110">
                                        <Camera size={14} />
                                        <input type="file" className="hidden" accept="image/jpeg,image/png,image/jpg" onChange={handleImageSelect} />
                                    </label>
                                </div>
                                
                                <div className="flex-1 text-center md:text-left">
                                    <h2 className={`text-xl font-bold ${textClass} flex items-center justify-center md:justify-start gap-2`}>
                                        {formData.full_name || 'Nom non défini'}
                                        <CheckCircle size={16} className="text-green-500" />
                                    </h2>
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-sm mt-2">
                                        <Mail size={14} className={textMutedClass} />
                                        <span className={textClass}>{formData.email || 'Email non défini'}</span>
                                    </div>
                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                                        <button onClick={() => setFormData({...formData, profile_image: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.full_name || 'User')}&background=6366f1&color=fff&bold=true&length=2&rounded=true`})}
                                            className={`text-xs px-3 py-1.5 rounded-xl cursor-pointer ${buttonSecondaryClass}`}>
                                            Initiales
                                        </button>
                                        <button onClick={handleSetGravatar} className={`text-xs px-3 py-1.5 rounded-xl cursor-pointer ${buttonSecondaryClass}`}>
                                            Gravatar
                                        </button>
                                        <button onClick={() => setFormData({...formData, profile_image: ""})} 
                                            className={`text-xs px-3 py-1.5 rounded-xl cursor-pointer ${darkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-800' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}>
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="p-8 space-y-6">
                            {/* Informations */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                    <h3 className={`text-base font-semibold ${textClass}`}>Informations personnelles</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-2 block flex items-center gap-1`}>
                                            <User size={12} />
                                            Nom complet
                                        </label>
                                        <input type="text" value={formData.full_name || ''} onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                                            className={`w-full px-4 py-2.5 rounded-xl border ${inputClass} ${borderClass} outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200`} 
                                            placeholder="Votre nom complet"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Préférences */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                    <h3 className={`text-base font-semibold ${textClass}`}>Préférences</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-2 block flex items-center gap-1`}>
                                            <Palette size={12} />
                                            Thème
                                        </label>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleThemeChange('light')}
                                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all duration-200 hover:scale-105 ${
                                                    currentTheme === 'light' 
                                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-lg' 
                                                        : buttonSecondaryClass
                                                }`}>
                                                <Sun size={14} /> Clair
                                            </button>
                                            <button onClick={() => handleThemeChange('dark')}
                                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all duration-200 hover:scale-105 ${
                                                    currentTheme === 'dark' 
                                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-lg' 
                                                        : buttonSecondaryClass
                                                }`}>
                                                <Moon size={14} /> Sombre
                                            </button>
                                            <button onClick={() => handleThemeChange('system')}
                                                className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all duration-200 hover:scale-105 ${
                                                    currentTheme === 'system' 
                                                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white border-indigo-600 shadow-lg' 
                                                        : buttonSecondaryClass
                                                }`}>
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                                </svg>
                                                Système
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={`text-xs font-medium ${textMutedClass} mb-2 block flex items-center gap-1`}>
                                            <Languages size={12} />
                                            Langue
                                        </label>
                                        <select value={formData.language} onChange={(e) => setFormData({...formData, language: e.target.value})}
                                            className={`cursor-pointer w-full px-4 py-2.5 rounded-xl border ${inputClass} ${borderClass} outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all duration-200`}>
                                            <option value="fr">Français</option>
                                            <option value="en">English</option>
                                            <option value="ar">العربية</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full"></div>
                                    <h3 className={`text-base font-semibold ${textClass}`}>Sécurité</h3>
                                </div>
                                <div className={`rounded-xl border ${borderClass} overflow-hidden shadow-sm`}>
                                    <button onClick={() => setIsPasswordOpen(!isPasswordOpen)}
                                        className={`cursor-pointer w-full px-5 py-3.5 flex justify-between items-center text-sm font-medium ${textClass} ${darkMode ? 'hover:bg-[#252525]' : 'hover:bg-gray-50'} transition-all duration-200`}>
                                        <span className="flex items-center gap-2">
                                            <Lock size={16} className="text-indigo-500" />
                                            Changer le mot de passe
                                        </span>
                                        <ChevronUp size={16} className={`transition-transform duration-200 ${!isPasswordOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isPasswordOpen && (
                                        <div className={`p-5 border-t ${borderClass} space-y-3 bg-opacity-50`}>
                                            <div className="relative">
                                                <input type={showPasswords.current ? "text" : "password"} 
                                                    placeholder="Mot de passe actuel"
                                                    value={passwordData.current_password}
                                                    onChange={(e) => setPasswordData({...passwordData, current_password: e.target.value})}
                                                    className={`w-full px-4 py-2.5 pr-10 rounded-xl border ${inputClass} ${borderClass} outline-none focus:ring-2 focus:ring-indigo-500 text-sm`} />
                                                <button onClick={() => toggleVisibility('current')} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                                                    {showPasswords.current ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input type={showPasswords.new ? "text" : "password"} 
                                                    placeholder="Nouveau mot de passe"
                                                    value={passwordData.new_password}
                                                    onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                                                    className={`w-full px-4 py-2.5 pr-10 rounded-xl border ${inputClass} ${borderClass} outline-none focus:ring-2 focus:ring-indigo-500 text-sm`} />
                                                <button onClick={() => toggleVisibility('new')} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                                                    {showPasswords.new ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <input type={showPasswords.confirm ? "text" : "password"} 
                                                    placeholder="Confirmer le mot de passe"
                                                    value={passwordData.new_password_confirmation}
                                                    onChange={(e) => setPasswordData({...passwordData, new_password_confirmation: e.target.value})}
                                                    className={`w-full px-4 py-2.5 pr-10 rounded-xl border ${inputClass} ${borderClass} outline-none focus:ring-2 focus:ring-indigo-500 text-sm`} />
                                                <button onClick={() => toggleVisibility('confirm')} className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-500 transition-colors">
                                                    {showPasswords.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                            <div className="flex justify-end pt-2">
                                                <button onClick={handleUpdatePassword} disabled={loading}
                                                    className="cursor-pointer px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2 transition-all duration-200 hover:scale-105">
                                                    {loading && <Loader2 size={14} className="animate-spin" />}
                                                    Mettre à jour
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className={`flex justify-end pt-4 border-t ${borderClass}`}>
                                <button onClick={handleUpdateProfile} disabled={loading}
                                    className="cursor-pointer px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    Enregistrer les modifications
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}