import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext';
import { translations } from "./constants/translations";
import axios from 'axios';
import './PaymentPage.css';

export default function PaymentPage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const lang = user?.settings?.language || 'PL';
    const t = translations[lang].payment;

    const handleMockPayment = async () => {
        try {
            await axios.post('http://localhost:8080/api/upgrade', {
                id: user.id,
                role: 'PLUS'
            });
            updateUser({ role: 'PLUS' });
            alert(t.success);
            navigate('/profil');
        } catch (err) {
            console.error('Błąd podczas aktualizacji rangi:', err);
            alert(t.error);
        }
    };

    return (
        <div className="payment-container">
            <motion.div className="payment-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="payment-header">
                    <h2>Ulepsz Konto do <span className="plus-badge-anim">PLUS</span></h2>
                    <p>{t.subtitle}</p>
                </div>

                <div className="price-tag">
                    <span className="amount">19.99</span>
                    <span className="currency">{t.price}</span>
                </div>

                <ul className="benefits">
                    <li><i className="fas fa-check"></i> {t.benefit1}</li>
                    <li><i className="fas fa-check"></i> {t.benefit2}</li>
                    <li><i className="fas fa-check"></i> {t.benefit3}</li>
                </ul>

                <div className="warning-box">
                    <strong>UWAGA:</strong> {t.warning}
                </div>

                <button className="pay-btn" onClick={handleMockPayment}>
                    {t.pay_btn}
                </button>
            </motion.div>
        </div>
    );
}
