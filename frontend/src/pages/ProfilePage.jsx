import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';
import { translations } from './constants/translations';

const ProfilePage = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        username: '',
        email: '',
        avatar: '',
        currentPassword: '',
        newPassword: ''
    });

    const lang = user?.settings?.language || 'PL';
    const t = translations[lang].profile;

    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        if (user) {
            setForm({
                username: user.username || '',
                email: user.email || '',
                avatar: user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`,
                currentPassword: '',
                newPassword: ''
            });
        }
    }, [user]);

    const avatarSrc = form.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${form.username || 'user'}`;
    const roleBadge = user?.role === 'PLUS' ? 'RailScope PLUS' : 'RailScope USER';

    const handleInput = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        setMessage('');

        try {
            const response = await axios.post('http://localhost:8080/api/update-profile', {
                userId: user.id,
                username: form.username,
                email: form.email,
                avatar: form.avatar,
                currentPassword: form.currentPassword,
                newPassword: form.newPassword
            });

            const updatedUser = response.data.user;
            updateUser(updatedUser);
            setMessage(t.success_msg);
            setForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } catch (err) {
            setMessage(err.response?.data?.error || t.error_saving);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelPremium = async () => {
        if (!user) return;
        if (!window.confirm(t.cancel_confirm)) return;

        setIsCancelling(true);
        setMessage('');
        try {
            const response = await axios.post('http://localhost:8080/api/cancel-premium', { userId: user.id });
            const updatedUser = response.data.user;
            updateUser(updatedUser);
            setMessage(t.cancel_success);
        } catch (err) {
            setMessage(err.response?.data?.error || t.cancel_error);
        } finally {
            setIsCancelling(false);
        }
    };

return (
        <div className="container profile-page">
            <div className="profile-grid profile-page-grid">
                <div className="profile-card card">
                    <div className="profile-header">
                        <div className="profile-avatar-wrapper">
                            <img src={avatarSrc} alt="Avatar" className="profile-avatar" />
                            <div className="profile-status-indicator"></div>
                        </div>
                        <div className="profile-header-info">
                            <h2>{form.username || t.user_default}</h2>
                            <span className="profile-status-text">{roleBadge}</span>
                        </div>
                        <div className="profile-header-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/pay')} disabled={user?.role === 'PLUS'}>
                                {user?.role === 'PLUS' ? t.is_plus : t.upgrade_plus}
                            </button>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="info-group">
                            <label>{t.email}</label>
                            <p>{form.email}</p>
                        </div>
                        <div className="info-group">
                            <label>{t.joined}</label>
                            <p>{user?.joinedDate || '2024-01-15'}</p>
                        </div>
                                                {user?.role === 'PLUS' && (
                            <>
                                <div className="info-group">
                                    <label>{t.premium_since}</label>
                                    <p>{user?.premiumDate || '2024-06-15'}</p>
                                </div>
                                <div className="info-group status-row">
                                    <label>{t.premium_status}</label>
                                    <p className="status-active">{t.premium_active}</p>
                                </div>
                            </>
                        )}
                        {user?.role !== 'PLUS' && (
                            <>
                                <div className="info-group">
                                    <label>{t.premium_since}</label>
                                    <p><i>{t.premium_inactive_text}</i></p>
                                </div>
                                {user?.premiumDate && (
                                    <div className="info-group">
                                        <label>{t.premium_until}</label>
                                        <p>{user.premiumDate}</p>
                                    </div>
                                )}
                                <div className="info-group status-row">
                                    <label>{t.premium_status}</label>
                                    <p className="status-inactive">{t.premium_inactive}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-card card">
                    <h3 className="section-title">{t.edit_title}</h3>
                    <form className="profile-form" onSubmit={handleSaveProfile}>
                        <label>{t.username}</label>
                        <input className="form-control" value={form.username} onChange={(e) => handleInput('username', e.target.value)} />
                        
                        <label>{t.email}</label>
                        <input className="form-control" type="email" value={form.email} onChange={(e) => handleInput('email', e.target.value)} />
                        
                        <label>{t.avatar}</label>
                        <input className="form-control" type="text" value={form.avatar} onChange={(e) => handleInput('avatar', e.target.value)} />
                        
                        <label>{t.new_password}</label>
                        <input className="form-control" type="password" value={form.newPassword} onChange={(e) => handleInput('newPassword', e.target.value)} />
                        
                        <label>{t.current_password}</label>
                        <input className="form-control" type="password" value={form.currentPassword} onChange={(e) => handleInput('currentPassword', e.target.value)} />
                        
                        <button className="btn btn-primary" type="submit" disabled={isSaving}>
                            {isSaving ? t.saving : t.save_btn}
                        </button>
                    </form>
                    {message && <div className="profile-message">{message}</div>}
                </div>

                {user?.role === 'PLUS' && (
                    <div className="profile-card card premium-section">
                        <h3 className="section-title">Premium</h3>
                        <div className="premium-info">
                            <p className="premium-status">{t.premium_active}</p>
                            <p className="premium-benefits">{t.premium_benefits}</p>
                        </div>
                        <button className="btn btn-danger" onClick={handleCancelPremium} disabled={isCancelling}>
                            {isCancelling ? t.saving : t.cancel_premium}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;
