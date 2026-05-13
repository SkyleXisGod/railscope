import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, updateUser, updateSettings } = useAuth();
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

    const handleThemeChange = async (color) => {
        try {
            await axios.post('http://localhost:8080/api/settings', {
                userId: user.id,
                theme: color,
                language: user.settings?.language || 'PL',
                animations: user.settings?.animations || 'block'
            });
            updateSettings({ theme: color });
            setMessage('Motyw zapisany.');
        } catch (err) {
            setMessage('Błąd zapisu motywu.');
        }
    };

    return (
        <div className="container profile-page">
            <h1 className="page-title">Profil Użytkownika</h1>

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

                <div className="profile-card card">
                    <h3 className="section-title">Personalizacja</h3>
                    <p className="settings-desc">Wybierz kolor akcentów i zapisz go w ustawieniach konta.</p>
                    <div className="theme-buttons">
                        {['#00ffd5', '#ff2b2b', '#ffcc00', '#7000ff'].map((color) => (
                            <button type="button" key={color} className="btn theme-button" style={{ backgroundColor: color, color: '#fff' }} onClick={() => handleThemeChange(color)}>
                                {color === '#00ffd5' ? 'Niebieski' : color === '#ff2b2b' ? 'Czerwony' : color === '#ffcc00' ? 'Żółty' : 'Fioletowy'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
