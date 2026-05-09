import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Initialize theme from localStorage once
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
    const darkMode = useMemo(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        return systemIsDark;
    }, [theme, systemIsDark]);

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
                setTheme(e.newValue);
            }
        };
        
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