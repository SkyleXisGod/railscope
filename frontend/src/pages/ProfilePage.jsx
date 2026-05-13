import React from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';
import '../index.css';

export default function ProfilePage() {
    const { user } = useAuth();
    if (!user) return null;

    // Klasa rangi
    const getRankClass = () => {
        if (user.role === 'ADMIN') return 'rank-admin';
        if (user.role === 'PLUS') return 'plus-glow';
        return 'rank-user';
    };

    return (
        <div className="profile-container">
            <div className="profile-glass-card">
                <div className="profile-avatar-sec">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Avatar" />
                    <h2 className={getRankClass()}>{user.username}</h2>
                    <span className="rank-tag">{user.role || 'USER'}</span>
                </div>
                
                <div className="profile-stats-mini">
                    <div className="p-stat"><span>Dołączył:</span> <span>Maj 2024</span></div>
                    <div className="p-stat"><span>E-mail:</span> <span>{user.email}</span></div>
                </div>

                {user.role !== 'PLUS' && user.role !== 'ADMIN' && (
                    <button className="upgrade-promo-btn" onClick={() => window.location.href='/pay'}>
                        Zdobądź PLUS i złoty nick
                    </button>
                )}
            </div>
        </div>
    );
}