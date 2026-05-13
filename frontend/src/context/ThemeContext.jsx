import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            return savedTheme;
        }
        return 'light';
    });

    const [systemIsDark, setSystemIsDark] = useState(() => 
        window.matchMedia('(prefers-color-scheme: dark)').matches
    );

    const darkMode = useMemo(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        return systemIsDark;
    }, [theme, systemIsDark]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setSystemIsDark(e.matches);
            if (theme === 'system') {
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.add('light');
        }
        
        localStorage.setItem('theme', theme);
    }, [darkMode, theme]);

    const updateTheme = useCallback((newTheme) => {
        if (!newTheme || !['light', 'dark', 'system'].includes(newTheme)) return;
        
        if (newTheme === theme) return;
        
        setTheme(newTheme);
        
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else if (newTheme === 'light') {
            root.classList.add('light');
        } else {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.add(isDark ? 'dark' : 'light');
        }
        
        localStorage.setItem('theme', newTheme);
        
        window.dispatchEvent(new CustomEvent('themeChanged', { 
            detail: { theme: newTheme, darkMode: newTheme === 'dark' || (newTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) } 
        }));
    }, [theme]);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme' && e.newValue && e.newValue !== theme) {
                setTheme(e.newValue);
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, darkMode, updateTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};