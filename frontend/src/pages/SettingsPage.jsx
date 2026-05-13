import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./SettingsPage.css";

export default function SettingsPage() {
    const { user, logout } = useAuth();
    const [themeColor, setThemeColor] = useState("#00ffd5");
    const [lang, setLang] = useState("PL");
    const [animations, setAnimations] = useState(true);

    const t = {
        PL: { title: "Ustawienia Systemu", theme: "Motyw i Kolory", lang: "Język", danger: "Strefa Zagrożenia", del: "Usuń Konto" },
        EN: { title: "System Settings", theme: "Theme & Colors", lang: "Language", danger: "Danger Zone", del: "Delete Account" }
    }[lang];

    const handleThemeChange = (color) => {
        setThemeColor(color);
        document.documentElement.style.setProperty('--accent-color', color);
    };

    const toggleAnimations = () => {
        setAnimations(!animations);
        document.documentElement.style.setProperty('--enable-animations', animations ? "0" : "1");
    };

    return (
        <div className="settings-container">
            <div className="settings-content">
                <h1>{t.title}</h1>
                
                <section className="settings-section horizontal">
                    <div className="setting-item">
                        <label>{t.theme}</label>
                        <div className="color-picker">
                            {['#00ffd5', '#ff2b2b', '#ffcc00', '#0088ff'].map(c => (
                                <div 
                                    key={c} 
                                    className={`color-circle ${themeColor === c ? 'active' : ''}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => handleThemeChange(c)}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="setting-item">
                        <label>{t.lang}</label>
                        <select value={lang} onChange={(e) => setLang(e.target.value)}>
                            <option value="PL">Polski</option>
                            <option value="EN">English</option>
                        </select>
                    </div>

                    <div className="setting-item">
                        <label>Animacje (Performance)</label>
                        <button 
                            className={`toggle-btn ${animations ? 'on' : 'off'}`}
                            onClick={toggleAnimations}
                        >
                            {animations ? "WŁĄCZONE" : "WYŁĄCZONE"}
                        </button>
                    </div>
                </section>

                <section className="settings-section danger-zone">
                    <h2>{t.danger}</h2>
                    <p>Usunięcie konta spowoduje bezpowrotne wymazanie danych z bazy SQL.</p>
                    <button className="delete-btn" onClick={() => {
                        if(window.confirm("Czy na pewno chcesz usunąć konto?")) {
                            // Tutaj wywołanie axios.delete('/api/user')
                            logout();
                        }
                    }}>
                        {t.del}
                    </button>
                </section>
            </div>
        </div>
    );
}