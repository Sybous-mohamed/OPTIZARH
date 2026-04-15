import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });

    const showNotification = (message, type = 'error') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            
            {/* L-UI dial l-Toast li gha tban f l-projet kaml */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-slide-in ${
                    toast.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : 'bg-red-50/90 border-red-200 text-red-800'
                }`}>
                    {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p className="text-sm font-semibold">{toast.message}</p>
                    <button onClick={() => setToast({ ...toast, show: false })} className="ml-4 p-1 hover:bg-black/5 rounded-full transition-colors">
                        <X size={16} />
                    </button>
                </div>
            )}

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in { animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            `}</style>
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);