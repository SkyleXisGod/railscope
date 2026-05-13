import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './SettingsPage.css';

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [lang, setLang] = useState(localStorage.getItem('rs_lang') || 'PL');

    const translations = {
        PL: { title: "Ustawienia", theme: "Kolor Akcentu", performance: "Animacje", danger: "Usuń Konto" },
        EN: { title: "Settings", theme: "Accent Color", performance: "Animations", danger: "Delete Account" }
    };

    const t = translations[lang];

    const changeTheme = (color) => {
        document.documentElement.style.setProperty('--accent-color', color);
        localStorage.setItem('rs_theme', color);
    };

    const toggleAnims = (e) => {
        const val = e.target.checked ? 'block' : 'none';
        document.documentElement.style.setProperty('--display-anim', val);
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
                            <div key={c} className="color-opt" style={{bg: c}} onClick={() => changeTheme(c)} />
                        ))}
                    </div>
                </div>

                <div className="setting-group">
                    <label>Język / Language</label>
                    <select value={lang} onChange={(e) => {setLang(e.target.value); localStorage.setItem('rs_lang', e.target.value);}}>
                        <option value="PL">Polski</option>
                        <option value="EN">English</option>
                    </select>
                </div>

                <div className="setting-group">
                    <label>{t.performance}</label>
                    <input type="checkbox" defaultChecked onChange={toggleAnims} />
                </div>

                <div className="danger-zone">
                    <button onClick={handleDeleteAccount} className="btn-del">{t.danger}</button>
                </div>
            </div>
        </div>
    );
}