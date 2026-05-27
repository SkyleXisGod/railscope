import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SettingsPage.css';
import { translations } from './constants/translations';

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
    const [backgroundMode, setBackgroundMode] = useState(user?.settings?.background_mode || user?.settings?.backgroundMode || DEFAULT_SETTINGS.backgroundMode);
    const [mapTheme, setMapTheme] = useState(user?.settings?.map_theme || user?.settings?.mapTheme || DEFAULT_SETTINGS.mapTheme);
    const [animations, setAnimations] = useState(user?.settings?.animations !== 'none');

    // EASTER EGG STATE: Kontrola widoczności sekretnych języków w select
    const [showSecretLanguages, setShowSecretLanguages] = useState(
        user?.settings?.language === 'PIRATE' || user?.settings?.language === 'WINGDINGS'
    );

    useEffect(() => {
        if (user?.settings) {
            const currentBgMode = user.settings.background_mode || user.settings.backgroundMode || DEFAULT_SETTINGS.backgroundMode;
            
            // Jeśli tryb to jasny, automatycznie wymuszamy czarny tekst, w przeciwnym wypadku bierzemy z bazy
            const currentTextColor = currentBgMode === 'light' ? '#000000' : (user.settings.text_color || user.settings.textColor || DEFAULT_SETTINGS.textColor);
            const currentAnimations = user.settings.animations;
            setLang(user.settings.language || 'PL');
            setTheme(user.settings.theme || DEFAULT_SETTINGS.theme);
            setAccentColor(user.settings.accent_color || user.settings.accentColor || DEFAULT_SETTINGS.accentColor);
            setTextColor(currentTextColor);
            setBackgroundMode(currentBgMode);
            setMapTheme(user.settings.map_theme || user.settings.mapTheme || DEFAULT_SETTINGS.mapTheme);
            setAnimations(user.settings.animations !== 'none');
            
            if (user.settings.language === 'PIRATE') {
                setShowSecretLanguages(true);
            }
        }
    }, [user]);

    const t = translations[lang]?.settings || translations['EN'].settings;

    const applyThemeImmediately = (settings) => {
        const newTheme = settings.theme ?? theme;
        const newAccent = settings.accentColor ?? accentColor;
        const newText = settings.textColor ?? textColor;
        const newBgMode = settings.backgroundMode ?? backgroundMode;
        const newMapTheme = settings.mapTheme ?? mapTheme;
        
        const animSetting = settings.animations !== undefined ? settings.animations : (animations ? 'block' : 'none');
        const areAnimationsDisabled = animSetting === 'none' || animSetting === false;

        if (areAnimationsDisabled) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }

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
        
        applyThemeImmediately(settings);

        const payload = {
            userId: user.id,
            language: settings.language ?? lang,
            theme: settings.theme ?? theme,
            accentColor: settings.accentColor ?? accentColor,
            animations: settings.animations ?? (animations ? 'block' : 'none'),
            textColor: settings.textColor ?? textColor,
            textOutline: user?.settings?.text_outline ?? user?.settings?.textOutline ?? 0, // zachowanie starego pola bez zmian
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
            
            saveSettings({
                theme: DEFAULT_SETTINGS.theme,
                accentColor: DEFAULT_SETTINGS.accentColor,
                textColor: DEFAULT_SETTINGS.textColor,
                backgroundMode: DEFAULT_SETTINGS.backgroundMode,
                mapTheme: DEFAULT_SETTINGS.mapTheme
            });
        }
    };

    const handleSecretTrigger = async () => {
        if (!showSecretLanguages) {
            setShowSecretLanguages(true);

            try {
                await axios.post('http://localhost:8080/api/secret-unlock', {
                    userId: user?.id,
                    message: "🔓 GASTER & PIRATES UNLOCKED. DARK... DARKER... YET DARKER..."
                });
            } catch (err) {
                console.error('Nie udało się powiadomić serwera o sekrecie:', err);
            }
        }
    };

    // Obsługa zmiany trybu tła z automatycznym przełączaniem tekstu na czarny w trybie jasnym
    const handleBackgroundChange = (newMode) => {
        setBackgroundMode(newMode);
        
        if (newMode === 'light') {
            setTextColor('#000000');
            saveSettings({ backgroundMode: newMode, textColor: '#000000' });
        } else {
            setTextColor(DEFAULT_SETTINGS.textColor);
            saveSettings({ backgroundMode: newMode, textColor: DEFAULT_SETTINGS.textColor });
        }
    };

    return (
        <div className="settings-wrapper">
            <div className="settings-card">
                <h1>{t.title}</h1>

                <div className="settings-section">
                    <h2 className="section-header">{t.title_header}</h2>
                    
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
                            disabled={backgroundMode === 'light'} /* Zablokowane w trybie jasnym, bo tekst MUSI być wtedy czarny */
                            onChange={(e) => {
                                setTextColor(e.target.value);
                                saveSettings({ textColor: e.target.value });
                            }}
                            className="color-input"
                        />
                    </div>

                    <div className="setting-group">
                        <label>{t.background}</label>
                        <select
                            value={backgroundMode}
                            onChange={(e) => handleBackgroundChange(e.target.value)}
                        >
                            <option value="dark">{t.dark_theme}</option>
                            <option value="light">{t.light_theme}</option>
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
                            <option value="dark">{t.dark_theme}</option>
                            <option value="light">{t.light_theme}</option>
                        </select>
                    </div>

                    <button className="btn btn-reset" onClick={resetToDefault}>
                        ↺ {t.reset}
                    </button>
                </div>

                <div className="settings-section">
                    <h2 className="section-header">{t.preferences}</h2>
                    
                    <div className="setting-group">
                        <label>
                            {t.language} 
                            <span className="secret-trigger" onClick={handleSecretTrigger}>.</span>
                        </label>
                        
                        <select
                            value={lang}
                            onChange={(e) => {
                                setLang(e.target.value);
                                saveSettings({ language: e.target.value });
                            }}
                        >
                            <option value="PL"> 🇵🇱 Polski</option>
                            <option value="EN"> 🇬🇧 English</option>
                            <option value="DE"> 🇩🇪 Deutsch</option>
                            <option value="RU"> 🇷🇺 Русский</option>
                            <option value="IT"> 🇮🇹 Italiano</option>
                            <option value="ES"> 🇪🇸 Español</option>
                            <option value="JP"> 🇯🇵 日本語</option>
                
                            {showSecretLanguages && (
                                <>
                                    <option value="US_FREEDOM"> 🇺🇸 Freedom Speak (USA)</option>
                                    <option value="OLD_PL"> 🇵🇱 Staropolski</option>
                                    <option value="PIRATE"> 🏴‍☠️ Pirate Speak (Arr!)</option>
                                </>
                            )}
                        </select>
                    </div>

                    <div className="setting-group checkbox-group disabled-group">
                        <label style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            <input
                                type="checkbox"
                                checked={animations}
                                disabled={true} /* <--- Blokada klikania w checkbox */
                                onChange={(e) => {
                                    // Kod wewnątrz się nie wykona, dopóki jest disabled, 
                                    // ale zostawiamy go lub możemy zakomentować
                                    const next = e.target.checked;
                                    setAnimations(next);
                                    saveSettings({ animations: next ? 'block' : 'none' });
                                }}
                            />
                            {t.performance} <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', marginLeft: '8px' }}>{t.coming_soon}</span>
                        </label>
                    </div>
                </div>

            </div>
        </div>
    );
}