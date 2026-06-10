import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './AuthPage.css';
import { translations } from './constants/translations';

// Funkcja kalkulująca siłę hasła (0-4 punkty)
const getPasswordStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length >= 6) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
};

const getStrengthLabel = (score) => {
    switch(score) {
        case 1: return <span style={{color: '#ff4d4d'}}>Słabe (min. 6 znaków)</span>;
        case 2: return <span style={{color: '#f39c12'}}>Średnie (dodaj cyfrę/wielką literę)</span>;
        case 3: return <span style={{color: '#f1c40f'}}>Dobre (dodaj znak specjalny)</span>;
        case 4: return <span style={{color: '#00ffd5'}}>Silne</span>;
        default: return '';
    }
};

export default function AuthPage() {
    const [viewMode, setViewMode] = useState('login');  
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [lang, setLang] = useState('PL');
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const t = translations[lang].auth;

    const strengthScore = getPasswordStrength(formData.password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMessage('');
        
        if (viewMode === 'forgot') {
            try {
                const res = await axios.post(`http://localhost:8080/api/forgot-password`, { email: formData.email });
                setSuccessMessage(res.data?.message || 'Link resetujący został wysłany na Twój e-mail.');
                setFormData({ username: '', email: '', password: '' });
            } catch (err) {
                setError(err.response?.data?.error || 'Nie udało się wysłać linku resetującego.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // WALIDACJA: Tylko przy rejestracji blokujemy słabe hasła
        if (viewMode === 'register') {
            if (formData.password.length < 6) {
                setError('Ze względów bezpieczeństwa hasło musi mieć co najmniej 6 znaków.');
                setLoading(false);
                return;
            }
        }

        const endpoint = viewMode === 'login' ? 'login' : 'register';
        
        try {
            const res = await axios.post(`http://localhost:8080/api/${endpoint}`, formData);
            
            if (viewMode === 'login') {
                login(res.data.user);
                navigate('/');
            } else {
                setViewMode('login');
                setFormData({ ...formData, password: '' });
                setSuccessMessage('Konto utworzone! Możesz się zalogować.');
            }
        } catch (err) {
            setError(err.response?.data?.error || t.error);
        } finally {
            setLoading(false);
        }
    };
    
    const getSubtitle = () => {
        if (viewMode === 'login') return 'Autoryzacja dostępu do sieci';
        if (viewMode === 'register') return 'Tworzenie nowego profilu operatora';
        return 'Odzyskiwanie dostępu do profilu';
    };

    return (
        <div className="auth-page-container">
            <motion.div 
                className="auth-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="auth-header">
                    <h1 className="auth-logo">RailScope<span>v2</span></h1>
                    <p className="auth-subtitle">{getSubtitle()}</p>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}
                {successMessage && <div className="auth-success-msg" style={{
                    background: 'rgba(46, 204, 113, 0.1)',
                    color: '#2ecc71',
                    padding: '12px',
                    border: '1px solid rgba(46, 204, 113, 0.2)',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.85rem',
                    textAlign: 'center'
                }}>{successMessage}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {viewMode === 'register' && (
                        <div className="input-group">
                            <i className="fas fa-user"></i>
                            <input 
                                type="text" 
                                placeholder={t.username}
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                            />
                        </div>
                    )}

                    <div className="input-group">
                        <i className="fas fa-envelope"></i>
                        <input 
                            type="email" 
                            placeholder={t.email} 
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    {viewMode !== 'forgot' && (
                        <div className="input-group">
                            <i className="fas fa-lock"></i>
                            <input 
                                type="password" 
                                placeholder={t.password} 
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    )}

                    {/* WSKAŹNIK SIŁY HASŁA - Wyświetlany tylko przy rejestracji podczas pisania */}
                    {viewMode === 'register' && formData.password.length > 0 && (
                        <div className="password-strength-wrapper">
                            <div className="password-strength-bar">
                                <div className={`password-strength-fill strength-${strengthScore}`}></div>
                            </div>
                            <div className="password-strength-text">
                                <span>Bezpieczeństwo autoryzacji:</span>
                                {getStrengthLabel(strengthScore)}
                            </div>
                        </div>
                    )}

                    {viewMode === 'login' && (
                        <div className="forgot-password-link" style={{ textAlign: 'right', marginTop: '-10px', marginBottom: '20px' }}>
                            <span 
                                onClick={() => { setViewMode('forgot'); setError(''); setSuccessMessage(''); setFormData({...formData, password: ''}); }}
                                style={{ color: '#666', fontSize: '0.8rem', cursor: 'pointer', transition: 'color 0.2s' }}
                                onMouseEnter={(e) => e.target.style.color = '#00ffd5'}
                                onMouseLeave={(e) => e.target.style.color = '#666'}
                            >
                                Zapomniałeś hasła?
                            </span>
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            viewMode === 'login' ? t.login_btn : viewMode === 'register' ? t.register_btn : 'Wyślij link'
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    {viewMode === 'forgot' ? (
                        <p onClick={() => { setViewMode('login'); setError(''); setSuccessMessage(''); }}>
                            Wróć do logowania
                        </p>
                    ) : (
                        <p onClick={() => { setViewMode(viewMode === 'login' ? 'register' : 'login'); setError(''); setSuccessMessage(''); setFormData({...formData, password: ''}); }}>
                            {viewMode === 'login' ? t.toggle_register : t.toggle_login}
                        </p>
                    )}
                </div>
            </motion.div>

            <div className="auth-bg-decoration">
                <div className="auth-map-bg"></div>
            </div>
        </div>
    );
}