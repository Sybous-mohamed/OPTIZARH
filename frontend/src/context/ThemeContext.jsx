import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
<<<<<<< HEAD
    // Initialize theme from localStorage once
=======
>>>>>>> bouray/main
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

<<<<<<< HEAD
    // Listen to system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            setSystemIsDark(e.matches);
            // If theme is 'system', update automatically
            if (theme === 'system') {
                const root = document.documentElement;
                if (e.matches) {
                    root.classList.add('dark');
                    root.classList.remove('light');
                } else {
                    root.classList.add('light');
                    root.classList.remove('dark');
                }
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Calculate darkMode boolean
=======
>>>>>>> bouray/main
    const darkMode = useMemo(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        return systemIsDark;
    }, [theme, systemIsDark]);

<<<<<<< HEAD
    // Apply theme to DOM
    useEffect(() => {
        const root = document.documentElement;
        if (darkMode) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [darkMode]);

    // Update theme function - broadcasts to all components
    const updateTheme = useCallback((newTheme) => {
        if (!newTheme || !['light', 'dark', 'system'].includes(newTheme)) return;
        
        // Save to localStorage
        localStorage.setItem('theme', newTheme);
        
        // Update state
        setTheme(newTheme);
        
        // Force immediate DOM update
        const root = document.documentElement;
        let isDark = false;
        
        if (newTheme === 'dark') {
            isDark = true;
        } else if (newTheme === 'light') {
            isDark = false;
        } else { // system
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        if (isDark) {
            root.classList.add('dark');
            root.classList.remove('light');
        } else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
        
        // Dispatch custom event to notify all components
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme, darkMode: isDark } }));
    }, []);

    // Sync across tabs and components
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'theme' && e.newValue) {
=======
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
>>>>>>> bouray/main
                setTheme(e.newValue);
            }
        };
        
<<<<<<< HEAD
        const handleThemeChanged = (e) => {
            if (e.detail) {
                setTheme(e.detail.theme);
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('themeChanged', handleThemeChanged);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('themeChanged', handleThemeChanged);
        };
    }, []);
=======
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [theme]);
>>>>>>> bouray/main

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