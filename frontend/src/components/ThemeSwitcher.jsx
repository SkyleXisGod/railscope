import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './ThemeSwitcher.css';

const presetThemes = [
  { label: 'Neon', primary: '#00ffd5', accentColor: '#00b39f', textColor: '#FFFFFF' },
  { label: 'Sunset', primary: '#ff2b2b', accentColor: '#ffcc00', textColor: '#FFFFFF' },
  { label: 'Aurora', primary: '#7000ff', accentColor: '#ff66ff', textColor: '#FFFFFF' },
  { label: 'Night', primary: '#0f172a', accentColor: '#38bdf8', textColor: '#DDE6F5' }
];

export default function ThemeSwitcher() {
  const { user, updateSettings } = useAuth();
  const [localSettings, setLocalSettings] = useState({
    theme: user?.settings?.theme || '#00ffd5',
    accentColor: user?.settings?.accent_color || user?.settings?.accentColor || '#00ffd5',
    textColor: user?.settings?.text_color || user?.settings?.textColor || '#FFFFFF',
    textOutline: user?.settings?.text_outline || user?.settings?.textOutline || 0
  });
  const [message, setMessage] = useState('');

  const saveSettings = async (settings) => {
    if (!user) return;
    try {
      await axios.post('http://localhost:8080/api/settings', {
        userId: user.id,
        language: user.settings?.language || 'PL',
        theme: settings.theme,
        accentColor: settings.accentColor,
        animations: user.settings?.animations || 'block',
        textColor: settings.textColor,
        textOutline: settings.textOutline ? 1 : 0
      });
      updateSettings(settings);
      setMessage('Ustawienia motywu zapisane.');
    } catch (err) {
      console.error(err);
      setMessage('Nie udało się zapisać motywu.');
    }
  };

  const handlePreset = (preset) => {
    const next = {
      theme: preset.primary,
      accentColor: preset.accentColor,
      textColor: preset.textColor,
      textOutline: localSettings.textOutline
    };
    setLocalSettings(next);
    saveSettings(next);
  };

  return (
    <div className="theme-switcher-card">
      <h3>Motyw strony</h3>
      <div className="theme-presets">
        {presetThemes.map((preset) => (
          <button
            key={preset.label}
            className="preset-button"
            style={{ background: preset.primary, color: preset.textColor, borderColor: preset.accentColor }}
            onClick={() => handlePreset(preset)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="theme-controls">
        <label>
          Główny kolor
          <input type="color" value={localSettings.theme} onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value }))} />
        </label>
        <label>
          Akcent
          <input type="color" value={localSettings.accentColor} onChange={(e) => setLocalSettings(prev => ({ ...prev, accentColor: e.target.value }))} />
        </label>
        <label>
          Kolor tekstu
          <input type="color" value={localSettings.textColor} onChange={(e) => setLocalSettings(prev => ({ ...prev, textColor: e.target.value }))} />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={!!localSettings.textOutline} onChange={(e) => setLocalSettings(prev => ({ ...prev, textOutline: e.target.checked ? 1 : 0 }))} />
          Obwódka tekstu
        </label>
      </div>

      <button className="save-theme-button" onClick={() => saveSettings(localSettings)}>
        Zapisz motyw
      </button>
      {message && <p className="theme-message">{message}</p>}
    </div>
  );
}
