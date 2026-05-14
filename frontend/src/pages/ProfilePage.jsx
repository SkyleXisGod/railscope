import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

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
            setMessage('Dane profilu zostały zapisane.');
            setForm(prev => ({ ...prev, currentPassword: '', newPassword: '' }));
        } catch (err) {
            setMessage(err.response?.data?.error || 'Wystąpił błąd podczas zapisywania.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelPremium = async () => {
        if (!user) return;
        if (!window.confirm('Czy na pewno chcesz anulować subskrypcję Premium?')) return;

        setIsCancelling(true);
        setMessage('');
        try {
            const response = await axios.post('http://localhost:8080/api/cancel-premium', { userId: user.id });
            const updatedUser = response.data.user;
            updateUser(updatedUser);
            setMessage('Subskrypcja Premium została anulowana.');
        } catch (err) {
            setMessage(err.response?.data?.error || 'Błąd podczas anulowania subskrypcji.');
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
                            <img src={avatarSrc} alt="Avatar użytkownika" className="profile-avatar" />
                            <div className="profile-status-indicator"></div>
                        </div>
                        <div className="profile-header-info">
                            <h2>{form.username || 'Użytkownik'}</h2>
                            <span className="profile-status-text">{roleBadge}</span>
                        </div>
                        <div className="profile-header-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/pay')} disabled={user?.role === 'PLUS'}>
                                {user?.role === 'PLUS' ? 'Jesteś PLUS' : 'Ulepsz do PLUS'}
                            </button>
                        </div>
                    </div>

                    <div className="profile-details">
                        <div className="info-group">
                            <label>E-mail</label>
                            <p>{form.email}</p>
                        </div>
                        <div className="info-group">
                            <label>Dołączono</label>
                            <p>{user?.joinedDate || '2024-01-15'}</p>
                        </div>
                        {user?.role === 'PLUS' && (
                            <>
                                <div className="info-group">
                                    <label>Premium od</label>
                                    <p>{user?.premiumDate || '2024-06-15'}</p>
                                </div>
                                <div className="info-group status-row">
                                    <label>Status Premium</label>
                                    <p className="status-active">✓ Aktywny</p>
                                </div>
                            </>
                        )}
                        {user?.role !== 'PLUS' && (
                            <>
                                <div className="info-group">
                                    <label>Premium od</label>
                                    <p><i>Subskrypcja nieaktywna</i></p>
                                </div>
                                <div className="info-group status-row">
                                    <label>Status Premium</label>
                                    <p className="status-inactive">✕ nieaktywny</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="profile-card card">
                    <h3 className="section-title">Edytuj profil</h3>
                    <form className="profile-form" onSubmit={handleSaveProfile}>
                        <label>Nick</label>
                        <input className="form-control" value={form.username} onChange={(e) => handleInput('username', e.target.value)} />
                        <label>E-mail</label>
                        <input className="form-control" type="email" value={form.email} onChange={(e) => handleInput('email', e.target.value)} />
                        <label>Avatar (URL)</label>
                        <input className="form-control" type="text" value={form.avatar} onChange={(e) => handleInput('avatar', e.target.value)} />
                        <label>Nowe hasło</label>
                        <input className="form-control" type="password" value={form.newPassword} onChange={(e) => handleInput('newPassword', e.target.value)} />
                        <label>Obecne hasło (do zmiany hasła)</label>
                        <input className="form-control" type="password" value={form.currentPassword} onChange={(e) => handleInput('currentPassword', e.target.value)} />
                        <button className="btn btn-primary" type="submit" disabled={isSaving}>
                            {isSaving ? 'Zapisuję...' : 'Zapisz zmiany'}
                        </button>
                    </form>
                    {message && <div className="profile-message">{message}</div>}
                </div>

                {user?.role === 'PLUS' && (
                    <div className="profile-card card premium-section">
                        <h3 className="section-title">Subskrypcja Premium</h3>
                        <div className="premium-info">
                            <p className="premium-status">✓ Masz aktywną subskrypcję RailScope PLUS</p>
                            <p className="premium-benefits">Pełny dostęp do wszystkich funkcji i analiz systemu.</p>
                        </div>
                        <button className="btn btn-danger" onClick={handleCancelPremium} disabled={isCancelling}>
                            {isCancelling ? 'Anulowywanie...' : 'Anuluj subskrypcję'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ProfilePage;
