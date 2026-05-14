import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './PaymentPage.css';

export default function PaymentPage() {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    const handleMockPayment = async () => {
        try {
            await axios.post('http://localhost:8080/api/upgrade', {
                id: user.id,
                role: 'PLUS'
            });
            updateUser({ role: 'PLUS' });
            alert('Symulacja płatności przebiegła pomyślnie! Twoja ranga została zaktualizowana.');
            navigate('/profil');
        } catch (err) {
            console.error('Błąd podczas aktualizacji rangi:', err);
            alert('Nie udało się dokonać aktualizacji rangi. Spróbuj ponownie.');
        }
    };

    return (
        <div className="payment-container">
            <motion.div className="payment-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="payment-header">
                    <h2>Ulepsz Konto do <span className="plus-badge-anim">PLUS</span></h2>
                    <p>Wspieraj rozwój RailScope i zyskaj unikalny wygląd profilu.</p>
                </div>

                <div className="price-tag">
                    <span className="amount">19.99</span>
                    <span className="currency">PLN / MSC</span>
                </div>

                <ul className="benefits">
                    <li><i className="fas fa-check"></i> Złota, animowana ranga</li>
                    <li><i className="fas fa-check"></i> Brak limitów zapytań API</li>
                    <li><i className="fas fa-check"></i> Priorytetowe wsparcie techniczne</li>
                </ul>

                <div className="warning-box">
                    <strong>UWAGA:</strong> To jest moduł emulacji. Żadne środki nie zostaną pobrane z Twojego konta.
                </div>

                <button className="pay-btn" onClick={handleMockPayment}>
                    ZAPŁAĆ TESTOWO
                </button>
            </motion.div>
        </div>
    );
}
