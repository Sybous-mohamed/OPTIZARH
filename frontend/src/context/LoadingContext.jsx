import React, { createContext, useContext, useState } from "react";

const LoadingContext = createContext();

export const LoadingProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);

    return (
        <LoadingContext.Provider value={{ loading, setLoading }}>
            {children}

            {loading && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                </div>
            )}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => useContext(LoadingContext);