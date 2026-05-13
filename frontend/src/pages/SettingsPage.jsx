import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SettingsPage.css';

export default function SettingsPage() {
    const { user, updateSettings } = useAuth();
    const [lang, setLang] = useState(user?.settings?.language || 'PL');
    const [theme, setTheme] = useState(user?.settings?.theme || '#00ffd5');
    const [animations, setAnimations] = useState(user?.settings?.animations !== 'none');

    useEffect(() => {
        if (user?.settings) {
            setLang(user.settings.language || 'PL');
            setTheme(user.settings.theme || '#00ffd5');
            setAnimations(user.settings.animations !== 'none');
        }
    }, [user]);

    const translations = {
        PL: { title: "Ustawienia", theme: "Kolor Akcentu", performance: "Animacje", danger: "Usuń Konto", save: "Zapisz" },
        EN: { title: "Settings", theme: "Accent Color", performance: "Animations", danger: "Delete Account", save: "Save" }
    };

    const t = translations[lang];

    const changeTheme = async (color) => {
        setTheme(color);
        document.documentElement.style.setProperty('--accent-color', color);
        try {
            await axios.post('http://localhost:8080/api/settings', {
                userId: user.id,
                theme: color,
                language: lang,
                animations: animations ? 'block' : 'none'
            });
            updateSettings({ theme: color });
        } catch (err) {
            console.error('Błąd zapisu ustawień:', err);
        }
    };

    const toggleAnims = async (e) => {
        const val = e.target.checked;
        setAnimations(val);
        document.documentElement.style.setProperty('--display-anim', val ? 'block' : 'none');
        try {
            await axios.post('http://localhost:8080/api/settings', {
                userId: user.id,
                theme,
                language: lang,
                animations: val ? 'block' : 'none'
            });
            updateSettings({ animations: val ? 'block' : 'none' });
        } catch (err) {
            console.error('Błąd zapisu ustawień:', err);
        }
    };

    const changeLang = async (newLang) => {
        setLang(newLang);
        try {
            await axios.post('http://localhost:8080/api/settings', {
                userId: user.id,
                theme,
                language: newLang,
                animations: animations ? 'block' : 'none'
            });
            updateSettings({ language: newLang });
        } catch (err) {
            console.error('Błąd zapisu ustawień:', err);
        }
    };

    const handleDeleteAccount = async () => {
        if (window.confirm("UWAGA: Operacja nieodwracalna. Usunąć konto?")) {
            try {
                await axios.delete(`http://localhost:8080/api/users/${user.id}`);
                logout();
            } catch (err) { alert("Błąd podczas usuwania konta."); }
        }
    };

    return (
        <div className="settings-wrapper">
            <div className="settings-card">
                <h1>{t.title}</h1>
                
                <div className="setting-group">
                    <label>{t.theme}</label>
                    <div className="color-grid">
                        {['#00ffd5', '#ff2b2b', '#ffcc00', '#7000ff'].map(c => (
                            <div key={c} className="color-opt" style={{background: c}} onClick={() => changeTheme(c)} />
                        ))}
                    </div>
                </div>

                <div className="setting-group">
                    <label>Język / Language</label>
                    <select value={lang} onChange={(e) => changeLang(e.target.value)}>
                        <option value="PL">Polski</option>
                        <option value="EN">English</option>
                    </select>
                </div>

                <div className="setting-group">
                    <label>{t.performance}</label>
                    <input type="checkbox" checked={animations} onChange={toggleAnims} />
                </div>

                <div className="danger-zone">
                    <button onClick={handleDeleteAccount} className="btn-del">{t.danger}</button>
                </div>
            </div>
        </div>
    );
}