import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const applyTheme = (settings = {}) => {
    const theme = settings.theme || settings.primary || '#00ffd5';
    const accent = settings.accentColor || settings.accent_color || theme;
    const textColor = settings.textColor || settings.text_color || '#FFFFFF';
    const textOutline = settings.textOutline !== undefined ? settings.textOutline : settings.text_outline || 0;

    document.documentElement.style.setProperty('--primary-color', theme);
    document.documentElement.style.setProperty('--accent-color', accent);
    document.documentElement.style.setProperty('--primary-hover', theme);
    document.documentElement.style.setProperty('--text-color', textColor);
    document.documentElement.style.setProperty('--text-outline', textOutline ? '1' : '0');
    if (textOutline) document.documentElement.classList.add('text-outline'); else document.documentElement.classList.remove('text-outline');
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theme, setTheme] = useState('#00ffd5');

    useEffect(() => {
        const savedUser = localStorage.getItem('railscope_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            applyTheme(parsedUser.settings || {});
            if (parsedUser.settings?.theme) setTheme(parsedUser.settings.theme);
        }
        setLoading(false);
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('railscope_user', JSON.stringify(userData));
        applyTheme(userData.settings || {});
        if (userData.settings?.theme) setTheme(userData.settings.theme);
    };

    const logout = () => {
        setUser(null);
        setTheme('#00ffd5');
        applyTheme('#00ffd5');
        localStorage.removeItem('railscope_user');
    };

    const updateUser = (newFields) => {
        const updatedUser = { ...user, ...newFields };
        setUser(updatedUser);
        localStorage.setItem('railscope_user', JSON.stringify(updatedUser));
    };

    const updateSettings = (newSettings) => {
        const updatedUser = { ...user, settings: { ...user.settings, ...newSettings } };
        setUser(updatedUser);
        localStorage.setItem('railscope_user', JSON.stringify(updatedUser));
        applyTheme(updatedUser.settings || {});
        if (newSettings.theme) setTheme(newSettings.theme);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, theme, updateSettings, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);