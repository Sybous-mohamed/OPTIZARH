import React from 'react';

const ProfilePage = () => {
    // // 1. Kan-parse-i l-object 'user' li 3ndek f l-image
    // const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    // // 2. Kan-jbdou l-data l-hqi9iya
    // const fullName = userData.full_name || "Utilisateur"; 
    // const email = userData.email || "Email non spécifié";
    // const role = localStorage.getItem('role') || "Rôle non défini";

    // const handleLogout = () => {
    //     localStorage.clear();
    //     window.location.href = '/login';
    // };

    // return (
    //     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-900">
    //         <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                
    //             {/* Header b-color indigo pro */}
    //             <div className="bg-indigo-600 p-8 text-center text-white">
    //                 <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center text-4xl font-bold mb-4 shadow-inner">
    //                     {fullName.charAt(0).toUpperCase()}
    //                 </div>
    //                 <h2 className="text-2xl font-bold tracking-tight">{fullName}</h2>
    //                 <div className="mt-2">
    //                     <span className="px-4 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
    //                         {role}
    //                     </span>
    //                 </div>
    //             </div>

    //             {/* Infos Section */}
    //             <div className="p-8 space-y-8">
    //                 <div className="flex flex-col gap-1">
    //                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-left">Nom et Prénom</span>
    //                     <p className="text-lg font-semibold border-b border-gray-50 pb-2 text-left">{fullName}</p>
    //                 </div>

    //                 <div className="flex flex-col gap-1">
    //                     <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-left">Adresse Electronique</span>
    //                     <p className="text-lg font-semibold border-b border-gray-50 pb-2 text-left">{email}</p>
    //                 </div>

    //                 <div className="pt-4">
    //                     <button 
    //                         onClick={handleLogout}
    //                         className="w-full py-4 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-200 hover:bg-red-600 hover:shadow-none transition-all duration-300 flex items-center justify-center gap-3 cursor-pointer"
    //                     >
    //                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    //                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    //                         </svg>
    //                         Se déconnecter
    //                     </button>
    //                 </div>
    //             </div>

    //             <div className="bg-gray-50/50 p-6 text-center">
    //                 <p className="text-gray-400 text-[10px] font-medium tracking-widest uppercase">OptizaRH • Guelmim</p>
    //             </div>
    //         </div>
    //     </div>
    // );
};

export default ProfilePage;