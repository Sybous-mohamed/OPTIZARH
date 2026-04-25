// lib/components/DeleteConfirmModal.jsx
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, title, message, darkMode = false }) => {
    if (!isOpen) return null;

    // Dark mode classes
    const modalBgClass = darkMode ? 'bg-[#1A1A1A]' : 'bg-white';
    const textTitleClass = darkMode ? 'text-gray-100' : 'text-gray-900';
    const textMessageClass = darkMode ? 'text-gray-400' : 'text-gray-600';
    const closeButtonClass = darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600';
    const cancelButtonClass = darkMode 
        ? 'border-[#333] text-gray-300 hover:bg-[#252525]' 
        : 'border-gray-300 text-gray-700 hover:bg-gray-50';
    const overlayClass = 'fixed inset-0 z-50 flex items-center justify-center';
    const backdropClass = 'absolute inset-0 bg-black/60 backdrop-blur-sm';

    return (
        <div className={overlayClass}>
            <div className={backdropClass} onClick={onClose}></div>
            <div className={`relative ${modalBgClass} rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-fadeIn border ${darkMode ? 'border-[#2A2A2A]' : 'border-gray-100'}`}>
                <button 
                    onClick={onClose} 
                    className={`absolute top-4 right-4 ${closeButtonClass} transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#252525]`}
                >
                    <X size={20}/>
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-full ${darkMode ? 'bg-red-900/30' : 'bg-red-100'}`}>
                        <AlertCircle className={darkMode ? 'text-red-400' : 'text-red-600'} size={24}/>
                    </div>
                    <h3 className={`text-lg font-bold ${textTitleClass}`}>{title}</h3>
                </div>
                
                <p className={`${textMessageClass} mb-6 text-sm`}>{message}</p>
                
                <div className="flex gap-3 justify-end">
                    <button 
                        onClick={onClose} 
                        className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${cancelButtonClass}`}
                    >
                        Annuler
                    </button>
                    <button 
                        onClick={() => { 
                            onConfirm(); 
                            onClose(); 
                        }} 
                        className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-medium text-sm hover:from-red-700 hover:to-red-800 transition-all shadow-md"
                    >
                        Supprimer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;