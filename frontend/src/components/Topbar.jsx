import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Topbar.css";

import logo from "../assets/railscope-minature.png"; 

export default function Topbar({ onToggleSidebar }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();

  const user = { username: "SkyleX", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=SkyleX" };

  const handleLogout = () => {
    // Tutaj logika usuwania tokena/sesji
    console.log("Wylogowano");
    navigate("/login");
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle-btn" onClick={onToggleSidebar}>
          <i className="fas fa-bars">☰</i>
        </button>
        <div className="topbar-logo" onClick={() => navigate("/")}>
          <img src={logo} alt="RailScope Logo" className="logo-img" />
          <span className="logo-text">RailScope</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="system-status">
          <span className="status-dot"></span>
          <span className="status-label">Live System Online</span>
        </div>

        {/* Sekcja użytkownika */}
        <div className="user-section">
          <div 
            className={`profile-trigger ${isUserMenuOpen ? "active" : ""}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <img src={user.avatar} alt="Avatar" className="user-avatar" />
            <span className="username">{user.username}</span>
            <i className={`fas fa-chevron-down arrow ${isUserMenuOpen ? "up" : ""}`}></i>
          </div>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-info">
                <p className="role">Administrator Systemu</p>
              </div>
              <ul className="dropdown-menu">
                <li onClick={() => { navigate("/ustawienia"); setIsUserMenuOpen(false); }}>
                  <i className="fas fa-cog"></i> Ustawienia
                </li>
                <li onClick={() => { navigate("/profil"); setIsUserMenuOpen(false); }}>
                  <i className="fas fa-user-circle"></i> Mój Profil
                </li>
                <li className="divider"></li>
                <li className="logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> Wyloguj
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}