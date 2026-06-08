import React, { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { useMailbox } from '../context/MailboxContext';
import axios from 'axios';
import { translations } from './constants/translations';
import "./Mailbox.css";

export default function Mailbox() {
    const { user } = useAuth();
    const lang = user?.settings?.language || 'PL';
    const t = translations[lang].mailbox;
    const { refreshCount } = useMailbox();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [activeFolder, setActiveFolder] = useState("inbox");
    const [loading, setLoading] = useState(true);
    const [isComposing, setIsComposing] = useState(false);
    const [formData, setFormData] = useState({ to: '', subject: '', content: '' });

    useEffect(() => {
        const fetchMessages = async () => {
            if (!user) return;
            try {
                const res = await axios.get(`http://localhost:8080/api/mailbox/${user.id}`);
                
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const recentMessages = res.data.filter(msg => new Date(msg.createdAt) >= sevenDaysAgo);
                setMessages(recentMessages);
            } catch (err) {
                console.error("Błąd pobierania skrzynki:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [user]);
    
    const handleSendMail = async () => {
        await axios.post('http://localhost:8080/api/mailbox/send', {
            senderId: user.id,
            receiverEmail: formData.to,
            subject: formData.subject,
            content: formData.content
        });
        setIsComposing(false);
    };

    const handleSelectMessage = async (msg) => {
            setSelectedMessage(msg);

            if (msg.unread) {
                try {
                    await axios.put(`http://localhost:8080/api/mailbox/${msg.id}/read`);

                    setMessages(messages.map(m => m.id === msg.id ? { ...m, unread: false } : m));
                
                    refreshCount(); 
                    
                } catch (err) {
                    console.error("Nie udało się zaktualizować statusu wiadomości", err);
                }
            }
        };
        
    const unreadCount = messages.filter(m => m.unread).length;
    const hasUnread = unreadCount > 0;

    return (
        <div className="mailbox-page-container">
            <div className="mailbox-sidebar">
                <button className="compose-btn">{t.compose} (W.I.P)</button>
                <ul className="folder-list">
                    <li className={activeFolder === "inbox" ? "active" : ""} onClick={() => setActiveFolder("inbox")}>
                        <span>
                            {t.inbox} 
                            {hasUnread && <span style={{ marginLeft: '5px', fontSize: '12px' }}>{t.unreadDot}</span>}
                        </span>
                        {unreadCount > 0 && <span className="folder-count">{unreadCount}</span>}
                    </li>
                    <li className={activeFolder === "sent" ? "active" : ""} onClick={() => setActiveFolder("sent")}>{t.sent} (W.I.P)</li>
                    <li className={activeFolder === "trash" ? "active" : ""} onClick={() => setActiveFolder("trash")}>{t.trash} (W.I.P)</li>
                </ul>
            </div>

            <div className="mailbox-main-content">
                <div className="messages-panel">
                    <div className="panel-header">
                        <h3>{t.title}</h3>
                    </div>
                    <div className="messages-list">
                        {loading && <p style={{ padding: '20px', color: '#888' }}>{t.loading}</p>}
                        {!loading && messages.length === 0 && (
                            <p style={{ padding: '20px', color: '#888' }}>{t.empty}</p>
                        )}
                        {!loading && messages.map((msg) => (
                            <div 
                                key={msg.id} 
                                className={`message-item ${msg.unread ? "unread" : ""} ${selectedMessage?.id === msg.id ? "selected" : ""}`}
                                onClick={() => handleSelectMessage(msg)}
                            >
                                <div className="message-item-header">
                                    <span className="msg-sender">{msg.sender}</span>
                                    {/* Formatujemy createdAt aby ładnie wyglądało */}
                                    <span className="msg-date">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                <h4 className="msg-subject">
                                    {msg.subject}
                                </h4>
                                <p className="msg-excerpt">{msg.content.substring(0, 60)}...</p>
                                {msg.tag && <span className={`msg-tag ${msg.tag.toLowerCase()}`}>{msg.tag}</span>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="reader-panel">
                    {selectedMessage ? (
                        <div className="message-reader">
                            <div className="reader-header">
                                <h2>{selectedMessage.subject}</h2>
                                <div className="reader-meta">
                                    <p><strong>{t.from}</strong> {selectedMessage.sender}</p>
                                    <p><strong>{t.date}</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="reader-body">
                                <p>{selectedMessage.content}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="no-message-selected">
                            <p>{t.noMessage}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}