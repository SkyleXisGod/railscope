import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import { translations } from "../pages/constants/translations";
import "./Topbar.css";
import logo from "../assets/railscope-minature.png"; 

const SCRAMBLE_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const getScrambled = (target, reveal) => {
  return target.split('').map((char, index) => {
    if (char === ' ' || index < reveal) return char;
    return SCRAMBLE_LETTERS[Math.floor(Math.random() * SCRAMBLE_LETTERS.length)];
  }).join('');
};

export default function Topbar({ onToggleSidebar }) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [systemOnline, setSystemOnline] = useState(true);
  const [displayStatus, setDisplayStatus] = useState('LIVE SYSTEM ONLINE');
  const [statusPhase, setStatusPhase] = useState('idle');
  const statusIntervalRef = useRef(null);
  const statusTimeoutRef = useRef(null);
  const currentTargetRef = useRef(displayStatus);
  const { user, logout } = useAuth();
  const lang = user?.settings?.language || 'PL';
  const t = translations[lang].app;
  const navigate = useNavigate();

  const updateStatusLabel = (target) => {
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
    if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);

    setStatusPhase('fade');
    statusTimeoutRef.current = setTimeout(() => {
      let revealCount = 0;
      let cycle = 0;
      setStatusPhase('scramble');
      const delay = 35;
      const cyclesPerLetter = Math.max(8, Math.ceil(7500 / (target.length * delay)));
      statusIntervalRef.current = setInterval(() => {
        if (cycle > 0 && cycle % cyclesPerLetter === 0) {
          revealCount += 1;
        }
        setDisplayStatus(getScrambled(target, revealCount));

        cycle += 1;
        if (revealCount >= target.length) {
          clearInterval(statusIntervalRef.current);
          setStatusPhase('idle');
          setDisplayStatus(target);
        }
      }, delay);
    }, 300);
  };

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/stations', { method: 'GET' });
        setSystemOnline(response.ok);
      } catch (err) {
        setSystemOnline(false);
      }
    };

    checkSystemStatus();
    const interval = setInterval(checkSystemStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const target = systemOnline ? 'LIVE SYSTEM ONLINE' : 'LIVE SYSTEM OFFLINE';
    if (target !== currentTargetRef.current) {
      currentTargetRef.current = target;
      updateStatusLabel(target);
    }
  }, [systemOnline]);

  useEffect(() => {
    return () => {
      if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  const userRole = user?.role === 'PLUS' ? 'RailScope PLUS' : 'RailScope USER';
  const userAvatar = user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

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
        <div className={`system-status ${systemOnline ? 'online' : 'offline'}`}>
          <span className={`status-dot ${systemOnline ? 'active' : 'inactive'}`}></span>
          <span className={`status-label ${statusPhase}`}>{displayStatus}</span>
        </div>

        <div className="user-section">
          <div 
            className={`profile-trigger ${isUserMenuOpen ? "active" : ""}`}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <img 
                src={userAvatar} 
                alt="Avatar" 
                className="user-avatar" 
            />
            <span className="username">{user.username}</span>
            <i className={`fas fa-chevron-down arrow ${isUserMenuOpen ? "up" : ""}`}></i>
          </div>

          {isUserMenuOpen && (
            <div className="user-dropdown">
              <div className="dropdown-info">
                <div className="dropdown-avatar">
                  <img src={userAvatar} alt="Profile" />
                </div>
                <p className="username-dropdown">{user.username}</p>
                <p className="role">{userRole}</p>
              </div>
              <ul className="dropdown-menu">
                <li onClick={() => { navigate("/profil"); setIsUserMenuOpen(false); }}>
                  <i className="fas fa-user-circle"></i> {t.my_profile}
                </li>
                <li className="divider"></li>
                <li className="logout-btn" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt"></i> {t.logout}
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
