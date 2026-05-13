import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import "./Topbar.css";
import logo from "../assets/railscope-minature.png"; 

export default function Topbar({ onToggleSidebar }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout } = useAuth(); // Pobieramy dane zalogowanego usera i funkcję logout
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Czyści localStorage i stan w aplikacji
    navigate("/auth"); // Wywala do logowania
  };

  // Jeśli user nie jest jeszcze załadowany, nie renderujemy sekcji profilu
  if (!user) return null;

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

        <div className="user-section">
          <div 
            className={`profile-trigger ${isUserMenuOpen ? "active" : ""}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            {/* Generujemy avatar na podstawie nazwy użytkownika */}
            <img 
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                alt="Avatar" 
                className="user-avatar" 
            />
            <span className="username">{user.username}</span>
            <i className={`fas fa-chevron-down arrow ${isUserMenuOpen ? "up" : ""}`}></i>
          </div>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-info">
                <p className="user-email">{user.email}</p>
                <p className="role">Operator Systemu</p>
              </div>
              <ul className="dropdown-menu">
                <li onClick={() => { navigate("/profile"); setIsUserMenuOpen(false); }}>
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