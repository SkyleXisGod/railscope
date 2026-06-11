import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sendMailboxNotification, NOTIFICATION_TYPES } from './scripts/MailboxService';
import '../pages/AuthPage.css'; 

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

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const strengthScore = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError("Hasła nie są identyczne.");
        }
        if (password.length < 6) {
            return setError("Hasło musi mieć co najmniej 6 znaków.");
        }

        setLoading(true);
        setError('');

        try {
            // 1. Wysyłamy żądanie zmiany hasła
            const res = await axios.post('http://localhost:8080/api/reset-password', {
                token,
                newPassword: password
            });
            
            // MODYFIKACJA: Odbieramy userId ORAZ language z odpowiedzi serwera
            const { userId, language } = res.data;

            // 2. Jeśli serwer namierzył użytkownika, generujemy powiadomienie
            if (userId) {
                try {
                    // MODYFIKACJA: Przekazujemy obiekt z forcedLang jako trzeci parametr.
                    // Zapobiegnie to wysyłaniu zapytania GET pod /api/admin/users/2
                    await sendMailboxNotification(NOTIFICATION_TYPES.PASSWORD_RESET, userId, {
                        forcedLang: language || 'PL'
                    });
                } catch (notifErr) {
                    console.error("Nie udało się zapisać powiadomienia w skrzynce systemowej:", notifErr);
                }
            }

            // 3. Pokazujemy sukces i planujemy powrót
            setSuccess(true);
            setTimeout(() => {
                navigate('/auth');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.error || "Link resetujący wygasł lub jest nieprawidłowy.");
        } finally {
            setLoading(false);
        }
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
                    <p className="auth-subtitle">Ustanawianie nowego hasła operatora</p>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}
                
                {success && (
                    <div className="auth-success-msg" style={{
                        background: 'rgba(46, 204, 113, 0.1)',
                        color: '#2ecc71',
                        padding: '12px',
                        border: '1px solid rgba(46, 204, 113, 0.2)',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                    }}>
                        Hasło zmienione pomyślnie! Za chwilę nastąpi przekierowanie...
                    </div>
                )}

                {!token ? (
                    <div className="auth-error-msg">Brak lub nieprawidłowy token autoryzacyjny.</div>
                ) : (
                    !success && (
                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="input-group">
                                <i className="fas fa-lock"></i>
                                <input 
                                    type="password" 
                                    placeholder="Nowe bezpieczne hasło" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* WSKAŹNIK SIŁY HASŁA */}
                            {password.length > 0 && (
                                <div className="password-strength-wrapper">
                                    <div className="password-strength-bar">
                                        <div className={`password-strength-fill strength-${strengthScore}`}></div>
                                    </div>
                                    <div className="password-strength-text">
                                        <span>Siła hasła:</span>
                                        {getStrengthLabel(strengthScore)}
                                    </div>
                                </div>
                            )}

                            <div className="input-group" style={{ marginTop: '5px' }}>
                                <i className="fas fa-check-circle"></i>
                                <input 
                                    type="password" 
                                    placeholder="Powtórz nowe hasło" 
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <button type="submit" className="auth-submit-btn" disabled={loading}>
                                {loading ? <span className="spinner"></span> : "Zapisz nowe hasło"}
                            </button>
                        </form>
                    )
                )}

                <div className="auth-footer">
                    <p onClick={() => navigate('/auth')}>Wróć do logowania</p>
                </div>
            </motion.div>

            <div className="auth-bg-decoration">
                <div className="auth-map-bg"></div>
            </div>
        </div>
    );
}