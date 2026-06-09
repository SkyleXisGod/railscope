import React, { useState } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../pages/AuthPage.css'; 

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

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
            const res = await axios.post('http://localhost:8080/api/reset-password', {
                token,
                newPassword: password
            });
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

                            <div className="input-group">
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