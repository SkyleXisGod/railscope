import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SettingsPage.css';

const DEFAULT_SETTINGS = {
    theme: '#00ffd5',
    accentColor: '#00ffd5',
    textColor: '#FFFFFF',
    backgroundMode: 'dark',
    mapTheme: 'dark'
};

export default function SettingsPage() {
    const { user, updateSettings } = useAuth();
    const [lang, setLang] = useState(user?.settings?.language || 'PL');
    const [theme, setTheme] = useState(user?.settings?.theme || DEFAULT_SETTINGS.theme);
    const [accentColor, setAccentColor] = useState(user?.settings?.accent_color || user?.settings?.accentColor || DEFAULT_SETTINGS.accentColor);
    const [textColor, setTextColor] = useState(user?.settings?.text_color || user?.settings?.textColor || DEFAULT_SETTINGS.textColor);
    const [textOutline, setTextOutline] = useState((user?.settings?.text_outline ?? user?.settings?.textOutline) ? true : false);
    const [backgroundMode, setBackgroundMode] = useState(user?.settings?.background_mode || user?.settings?.backgroundMode || DEFAULT_SETTINGS.backgroundMode);
    const [mapTheme, setMapTheme] = useState(user?.settings?.map_theme || user?.settings?.mapTheme || DEFAULT_SETTINGS.mapTheme);
    const [animations, setAnimations] = useState(user?.settings?.animations !== 'none');

    useEffect(() => {
        if (user?.settings) {
            setLang(user.settings.language || 'PL');
            setTheme(user.settings.theme || DEFAULT_SETTINGS.theme);
            setAccentColor(user.settings.accent_color || user.settings.accentColor || DEFAULT_SETTINGS.accentColor);
            setTextColor(user.settings.text_color || user.settings.textColor || DEFAULT_SETTINGS.textColor);
            setTextOutline((user.settings.text_outline ?? user.settings.textOutline) ? true : false);
            setBackgroundMode(user.settings.background_mode || user.settings.backgroundMode || DEFAULT_SETTINGS.backgroundMode);
            setMapTheme(user.settings.map_theme || user.settings.mapTheme || DEFAULT_SETTINGS.mapTheme);
            setAnimations(user.settings.animations !== 'none');
        }
    }, [user]);

    const translations = {
        PL: {
            title: 'Ustawienia',
            theme: 'Główny kolor (tło strony)',
            accent: 'Kolor akcentu (przyciski, ikony)',
            textColor: 'Kolor tekstu',
            textOutline: 'Obrys tekstu',
            background: 'Wygląd strony',
            mapTheme: 'Motyw mapy',
            performance: 'Animacje',
            language: 'Język / Language',
            danger: 'Usuń konto',
            save: 'Zapisz',
            reset: 'Przywróć domyślne'
        },
        EN: {
            title: 'Settings',
            theme: 'Primary color (page background)',
            accent: 'Accent color (buttons, icons)',
            textColor: 'Text color',
            textOutline: 'Text outline',
            background: 'Page appearance',
            mapTheme: 'Map theme',
            performance: 'Animations',
            language: 'Language',
            danger: 'Delete account',
            save: 'Save',
            reset: 'Reset to default'
        }
    };

    const t = translations[lang] || translations.PL;

    const applyThemeImmediately = (settings) => {
        const newTheme = settings.theme ?? theme;
        const newAccent = settings.accentColor ?? accentColor;
        const newText = settings.textColor ?? textColor;
        const newBgMode = settings.backgroundMode ?? backgroundMode;
        const newMapTheme = settings.mapTheme ?? mapTheme;

        // Apply CSS variables immediately
        const bgMain = newBgMode === 'light' ? '#f3f7fb' : '#0f121a';
        const bgCard = newBgMode === 'light' ? 'rgba(255,255,255,0.92)' : 'rgba(20,24,33,0.95)';
        const bgInput = newBgMode === 'light' ? '#f5f8ff' : '#1f2430';
        const border = newBgMode === 'light' ? '#d6dee8' : '#2c3545';
        const secondaryText = newBgMode === 'light' ? '#51657a' : '#9ba9bf';

        document.documentElement.style.setProperty('--primary-color', newTheme);
        document.documentElement.style.setProperty('--accent-color', newAccent);
        document.documentElement.style.setProperty('--primary-hover', newTheme);
        document.documentElement.style.setProperty('--text-color', newText);
        document.documentElement.style.setProperty('--text-primary', newText);
        document.documentElement.style.setProperty('--text-secondary', secondaryText);
        document.documentElement.style.setProperty('--bg-main', bgMain);
        document.documentElement.style.setProperty('--bg-card', bgCard);
        document.documentElement.style.setProperty('--bg-input', bgInput);
        document.documentElement.style.setProperty('--border-color', border);
        document.documentElement.style.setProperty('--map-theme', newMapTheme);
    };

    const saveSettings = async (settings) => {
        if (!user) return;
        
        // Apply theme immediately
        applyThemeImmediately(settings);

        const payload = {
            userId: user.id,
            language: settings.language ?? lang,
            theme: settings.theme ?? theme,
            accentColor: settings.accentColor ?? accentColor,
            animations: settings.animations ?? (animations ? 'block' : 'none'),
            textColor: settings.textColor ?? textColor,
            textOutline: settings.textOutline !== undefined ? settings.textOutline : (textOutline ? 1 : 0),
            backgroundMode: settings.backgroundMode ?? backgroundMode,
            mapTheme: settings.mapTheme ?? mapTheme
        };

        try {
            await axios.post('http://localhost:8080/api/settings', payload);
            updateSettings({
                language: payload.language,
                theme: payload.theme,
                accent_color: payload.accentColor,
                accentColor: payload.accentColor,
                animations: payload.animations,
                text_color: payload.textColor,
                textColor: payload.textColor,
                text_outline: payload.textOutline ? 1 : 0,
                textOutline: payload.textOutline ? 1 : 0,
                background_mode: payload.backgroundMode,
                backgroundMode: payload.backgroundMode,
                map_theme: payload.mapTheme,
                mapTheme: payload.mapTheme
            });
        } catch (err) {
            console.error('Błąd zapisu ustawień:', err);
        }
    };

    const resetToDefault = async () => {
        if (window.confirm(translations[lang].reset + '?')) {
            setTheme(DEFAULT_SETTINGS.theme);
            setAccentColor(DEFAULT_SETTINGS.accentColor);
            setTextColor(DEFAULT_SETTINGS.textColor);
            setBackgroundMode(DEFAULT_SETTINGS.backgroundMode);
            setMapTheme(DEFAULT_SETTINGS.mapTheme);
            setTextOutline(false);
            
            saveSettings({
                theme: DEFAULT_SETTINGS.theme,
                accentColor: DEFAULT_SETTINGS.accentColor,
                textColor: DEFAULT_SETTINGS.textColor,
                backgroundMode: DEFAULT_SETTINGS.backgroundMode,
                mapTheme: DEFAULT_SETTINGS.mapTheme,
                textOutline: 0
            });
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("UWAGA: Operacja nieodwracalna. Usunąć konto?")) {
            try {
                await axios.delete(`http://localhost:8080/api/users/${user.id}`);
                window.location.reload();
            } catch (err) {
                alert("Błąd podczas usuwania konta.");
            }
        }
    };

    return (
        <div className="settings-wrapper">
            <div className="settings-card">
                <h1>{t.title}</h1>

                <div className="settings-section">
                    <h2 className="section-header">Wygląd i Motywy</h2>
                    
                    <div className="setting-group">
                        <label>{t.theme}</label>
                        <input
                            type="color"
                            value={theme}
                            onChange={(e) => {
                                setTheme(e.target.value);
                                saveSettings({ theme: e.target.value });
                            }}
                            className="color-input"
                        />
                    </div>

                    <div className="setting-group">
                        <label>{t.accent}</label>
                        <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => {
                                setAccentColor(e.target.value);
                                saveSettings({ accentColor: e.target.value });
                            }}
                            className="color-input"
                        />
                    </div>

                    <div className="setting-group">
                        <label>{t.textColor}</label>
                        <input
                            type="color"
                            value={textColor}
                            onChange={(e) => {
                                setTextColor(e.target.value);
                                saveSettings({ textColor: e.target.value });
                            }}
                            className="color-input"
                        />
                    </div>

                    <div className="setting-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={textOutline}
                                onChange={(e) => {
                                    const next = e.target.checked;
                                    setTextOutline(next);
                                    saveSettings({ textOutline: next ? 1 : 0 });
                                }}
                            />
                            {t.textOutline}
                        </label>
                    </div>

                    <div className="setting-group">
                        <label>{t.background}</label>
                        <select
                            value={backgroundMode}
                            onChange={(e) => {
                                setBackgroundMode(e.target.value);
                                saveSettings({ backgroundMode: e.target.value });
                            }}
                        >
                            <option value="dark">Ciemny / Dark</option>
                            <option value="light">Jasny / Light</option>
                        </select>
                    </div>

                    <div className="setting-group">
                        <label>{t.mapTheme}</label>
                        <select
                            value={mapTheme}
                            onChange={(e) => {
                                setMapTheme(e.target.value);
                                saveSettings({ mapTheme: e.target.value });
                            }}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </div>

                    <button className="btn btn-reset" onClick={resetToDefault}>
                        ↺ {t.reset}
                    </button>
                </div>

                <div className="settings-section">
                    <h2 className="section-header">Preferencje</h2>
                    
                    <div className="setting-group">
                        <label>{t.language}</label>
                        <select
                            value={lang}
                            onChange={(e) => {
                                setLang(e.target.value);
                                saveSettings({ language: e.target.value });
                            }}
                        >
                            <option value="PL">Polski</option>
                            <option value="EN">English</option>
                        </select>
                    </div>

                    <div className="setting-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                checked={animations}
                                onChange={(e) => {
                                    const next = e.target.checked;
                                    setAnimations(next);
                                    saveSettings({ animations: next ? 'block' : 'none' });
                                }}
                            />
                            {t.performance}
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}
