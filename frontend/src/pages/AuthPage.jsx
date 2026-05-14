import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import './AuthPage.css';
import { translations } from './constants/translations';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [lang, setLang] = useState('PL');
    
    const { login } = useAuth();
    const navigate = useNavigate();
    const t = translations[lang].auth;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        const endpoint = isLogin ? 'login' : 'register';
        
        try {
            const res = await axios.post(`http://localhost:8080/api/${endpoint}`, formData);
            
            if (isLogin) {
                // Logowanie: serwer zwraca { user: { ... } }
                login(res.data.user);
                navigate('/');
            } else {
                // Rejestracja pomyślna - przełącz na logowanie
                setIsLogin(true);
                setFormData({ ...formData, password: '' });
            }
        } catch (err) {
            setError(err.response?.data?.error || t.error);
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
                    <p className="auth-subtitle">
                        {isLogin ? 'Autoryzacja dostępu do sieci' : 'Tworzenie nowego profilu operatora'}
                    </p>
                </div>

                {error && <div className="auth-error-msg">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    {!isLogin && (
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

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            isLogin ? t.login_btn : t.register_btn
                        )}
                    </button>
                </form>

                <div className="auth-footer">
                    <p onClick={() => { setIsLogin(!isLogin); setError(''); }}>
                        {isLogin ? t.toggle_register : t.toggle_login}
                    </p>
                </div>
            </motion.div>

            <div className="auth-bg-decoration">
                <div className="circle circle-1"></div>
                <div className="circle circle-2"></div>
            </div>
        </div>
    );
}