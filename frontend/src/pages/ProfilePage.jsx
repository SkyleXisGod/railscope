import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Emulacja rangi (w bazie powinieneś mieć user.role)
    const role = user.role || "USER"; // "USER", "PLUS", "ADMIN"

    const getRankStyle = () => {
        if (role === "ADMIN") return { label: "ADMINISTRATOR", class: "rank-admin" };
        if (role === "PLUS") return { label: "UŻYTKOWNIK PLUS", class: "plus-badge-anim" };
        return { label: "UŻYTKOWNIK", class: "rank-user" };
    };

    const rank = getRankStyle();

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="avatar-wrapper">
                    <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                        alt="Avatar" 
                        className={`profile-avatar ${role === 'PLUS' ? 'gold-border' : ''}`}
                    />
                    <button className="edit-avatar-btn"><i className="fas fa-camera"></i></button>
                </div>

                <h1 className={rank.class}>{user.username}</h1>
                <div className={`rank-badge ${rank.class}`}>{rank.label}</div>

                <div className="profile-info-grid">
                    <div className="info-item">
                        <label>Data Rejestracji</label>
                        <span>12.05.2024</span>
                    </div>
                    <div className="info-item">
                        <label>E-mail</label>
                        <span>{user.email}</span>
                    </div>
                </div>

                {role === "USER" && (
                    <button className="upgrade-btn" onClick={() => navigate("/pay")}>
                        KUP PAKIET PLUS
                    </button>
                )}
            </div>
        </div>
    );
}