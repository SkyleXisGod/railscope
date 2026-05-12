import React, { useState } from "react";
import "./SettingsPage.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    theme: "dark",
    language: "PL",
    animations: true,
    accentColor: "#00ffd5"
  });

  return (
    <div className="settings-container">
      <header className="settings-header">
        <h1 className="settings-title">Centrum Sterowania</h1>
        <p className="settings-subtitle">Dostosuj parametry systemowe RailScope.</p>
      </header>

      <div className="settings-grid">
        {/* Sekcja Wyglądu */}
        <div className="settings-card">
          <h3><i className="fas fa-palette"></i> Interfejs</h3>
          <div className="setting-item">
            <span>Kolor akcentu</span>
            <input 
              type="color" 
              value={settings.accentColor} 
              onChange={(e) => setSettings({...settings, accentColor: e.target.value})}
            />
          </div>
          <div className="setting-item">
            <span>Animacje Interfejsu</span>
            <label className="switch">
              <input 
                type="checkbox" 
                checked={settings.animations} 
                onChange={() => setSettings({...settings, animations: !settings.animations})}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* Sekcja Regionalna */}
        <div className="settings-card">
          <h3><i className="fas fa-globe"></i> Regionalne</h3>
          <div className="setting-item">
            <span>Język Systemu</span>
            <select className="neon-select">
              <option>Polski</option>
              <option>English</option>
              <option>Deutsch</option>
            </select>
          </div>
        </div>

        {/* Sekcja Konta */}
        <div className="settings-card wide">
          <h3><i className="fas fa-user-shield"></i> Bezpieczeństwo i Dane</h3>
          <p>Zalogowany jako: <strong>SkyleX</strong></p>
          <button className="danger-btn">Usuń dane lokalne</button>
        </div>
      </div>
    </div>
  );
}