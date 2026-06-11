import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from './constants/translations';
import axios from 'axios';
import './TicketsPage.css';

export default function TicketPage() {
    const { user } = useAuth();
    const lang = user?.settings?.language || 'PL';
    const t = translations[lang].tickets;
    const [activeTab, setActiveTab] = useState('new');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('BLAD');
    const [description, setDescription] = useState('');
    const [success, setSuccess] = useState(false);
    const [myTickets, setMyTickets] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchMyTickets = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await axios.get(`http://localhost:8080/api/tickets/${user.id}`);
            setMyTickets(res.data);
        } catch (error) {
            console.error("Błąd pobierania zgłoszeń:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'list') {
            fetchMyTickets();
        }
    }, [activeTab, user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        try {
            await axios.post('http://localhost:8080/api/tickets', {
                userId: user.id,
                title,
                category,
                description
            });

            await axios.post('http://localhost:8080/api/mailbox', {
                userId: user.id,
                sender: "System RailScope",
                subject: t.confirmSubject,
                content: t.confirmContent.replace('{ticketTitle}', title),
                tag: "System",
                unread: true
            });

            setSuccess(true);
            setTitle('');
            setDescription('');
            setTimeout(() => setSuccess(false), 4000);
        } catch (error) {
            console.error("Błąd wysyłania zgłoszenia:", error);
            alert("Nie udało się wysłać zgłoszenia.");
        }
    };

    return (
        <div className="ticket-page-wrapper">
            <div className="ticket-card">
                <div className="tabs-container" style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #2e2e34', paddingBottom: '10px' }}>
                    <button 
                        onClick={() => setActiveTab('new')}
                        style={{ background: activeTab === 'new' ? '#00ffd5' : 'transparent', color: activeTab === 'new' ? '#000' : '#fff', border: '1px solid #00ffd5', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {t.tabNew}
                    </button>
                    <button 
                        onClick={() => setActiveTab('list')}
                        style={{ background: activeTab === 'list' ? '#00ffd5' : 'transparent', color: activeTab === 'list' ? '#000' : '#fff', border: '1px solid #00ffd5', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        {t.tabList}
                    </button>
                </div>

                {activeTab === 'new' && (
                    <>
                        <h1>{t.titleNew}</h1>
                        <p className="ticket-desc">{t.descNew}</p>

                        {success && (
                            <div className="ticket-success-alert">
                                {t.successForm}
                            </div>
                        )}

                        <form className="ticket-form" onSubmit={handleSubmit}>
                            <div className="ticket-input-group">
                                <label>{t.titleInput}</label>
                                <input 
                                    type="text" 
                                    placeholder={t.titlePlaceholder} 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="ticket-input-group">
                                <label>{t.catInput}</label>
                                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                                    <option value="BLAD">{t.catBug}</option>
                                    <option value="PYTANIE">{t.catQuestion}</option>
                                    <option value="PROPOZYCJA">{t.catProp}</option>
                                    <option value="SKARGA">{t.catReport}</option>
                                </select>
                            </div>

                            <div className="ticket-input-group">
                                <label>{t.descInput}</label>
                                <textarea 
                                    rows="6" 
                                    placeholder={t.descPlaceholder} 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            <button type="submit" className="ticket-submit-btn">{t.submitBtn}</button>
                        </form>
                    </>
                )}

                {activeTab === 'list' && (
                    <>
                        <h1>{t.titleHistory}</h1>
                        {loading ? <p>Ładowanie...</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {myTickets.length === 0 ? <p>{t.noTickets}</p> : myTickets.map(ticket => (
                                    <div key={ticket.id} style={{ background: '#24242b', padding: '15px', borderRadius: '12px', border: '1px solid #3a3a44' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                            <strong style={{ color: '#00ffd5' }}>{ticket.title}</strong>
                                            <span style={{ fontSize: '0.8rem', background: ticket.status === 'Otwarty' ? '#ffcc00' : '#00ffd5', color: '#000', padding: '3px 8px', borderRadius: '5px', fontWeight: 'bold' }}>
                                                {ticket.status}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '0.9rem', color: '#ccc', marginBottom: '10px' }}>{ticket.description}</p>
                                        
                                        {ticket.adminReply && (
                                            <div style={{ background: '#1a1a1e', padding: '10px', borderRadius: '8px', borderLeft: '4px solid #00ffd5' }}>
                                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#888894' }}>{t.adminReplyLabel}</p>
                                                <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#fff' }}>{ticket.adminReply}</p>
                                            </div>
                                        )}
                                        <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '10px', textAlign: 'right' }}>
                                            {t.reportedAt} {new Date(ticket.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}