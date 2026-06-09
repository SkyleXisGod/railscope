import React, { useState, useEffect } from "react";
import { useAuth } from '../context/AuthContext';
import { useMailbox } from '../context/MailboxContext';
import axios from 'axios';
import { translations } from './constants/translations';
import "./Mailbox.css";

export default function Mailbox() {
    const { user } = useAuth();
    const lang = user?.settings?.language || 'PL';
    const t = translations[lang]?.mailbox || translations.PL.mailbox;
    const { refreshCount } = useMailbox();
    const [messages, setMessages] = useState([]);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [activeFolder, setActiveFolder] = useState("inbox");
    const [loading, setLoading] = useState(true);
    const [isComposing, setIsComposing] = useState(false);
    const [formData, setFormData] = useState({ to: '', subject: '', content: '' });
    const [errorMsg, setErrorMsg] = useState("");

    const fetchMessages = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const res = await axios.get(`http://localhost:8080/api/mailbox/${user.id}`);
            
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const recentMessages = res.data.filter(msg => new Date(msg.createdAt) >= sevenDaysAgo);
            setMessages(recentMessages);
            setLoading(false);
        } catch (err) {
            console.error("Błąd pobierania wiadomości:", err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [user, activeFolder]);

    const handleSelectMessage = async (msg) => {
        setSelectedMessage(msg); 

        if (msg.unread) {
            try {
                await axios.put(`http://localhost:8080/api/mailbox/read/${msg.id}`);

                setMessages(prevMessages => 
                    prevMessages.map(m => m.id === msg.id ? { ...m, unread: 0 } : m)
                );

                if (refreshCount) {
                    refreshCount();
                }
            } catch (err) {
                console.error("Błąd podczas oznaczania wiadomości jako przeczytanej:", err);
            }
        }
    };

    const handleDeleteMessage = async (msgId) => {
        try {
            await axios.post(`http://localhost:8080/api/mailbox/${msgId}/delete`);
            setSelectedMessage(null);
            fetchMessages();
            if (refreshCount) refreshCount();
        } catch (err) {
            console.error("Błąd podczas usuwania maila:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        setErrorMsg("");
        try {
            await axios.post('http://localhost:8080/api/mailbox', {
                senderId: user.id,
                sender: user.email || user.username,
                to: formData.to,                
                subject: formData.subject,
                content: formData.content,
                tag: 'Użytkownik'
            });
            
            setIsComposing(false);
            setFormData({ to: '', subject: '', content: '' });
            fetchMessages();
        } catch (err) {
            setErrorMsg(err.response?.data?.error || (t.sendError || "Nie udało się wysłać wiadomości."));
        }
    };

    const displayedMessages = messages.filter(msg => {
        const msgFolder = msg.folder || 'inbox';
        return msgFolder === activeFolder;
    });

    return (
        <div className="mailbox-page-container">
            <div className="mailbox-sidebar">
                <button className="compose-btn" onClick={() => setIsComposing(true)}>
                    📝 {t.compose || "Napisz wiadomość"}
                </button>

                <ul className="folder-list">
                    <li className={activeFolder === "inbox" ? "active" : ""} onClick={() => { setActiveFolder("inbox"); setSelectedMessage(null); }}>
                        📥 {t.inbox || "Otrzymane"}
                    </li>
                    <li className={activeFolder === "sent" ? "active" : ""} onClick={() => { setActiveFolder("sent"); setSelectedMessage(null); }}>
                        📤 {t.sent || "Wysłane"}
                    </li>
                    <li className={activeFolder === "trash" ? "active" : ""} onClick={() => { setActiveFolder("trash"); setSelectedMessage(null); }}>
                        🗑️ {t.trash || "Kosz"}
                    </li>
                </ul>
            </div>

            <div className="mailbox-main-content">
                <div className="messages-panel">
                    <div className="panel-header">
                        <h3>
                            {activeFolder === 'inbox' 
                                ? (t.inbox || "Otrzymane") 
                                : activeFolder === 'sent' 
                                    ? (t.sent || "Wysłane") 
                                    : (t.trash || "Kosz")
                            }
                        </h3>
                    </div>
                    
                    <div className="messages-list">
                        {loading ? (
                            <p className="mailbox-info-text">{t.loading || "Ładowanie..."}</p>
                        ) : displayedMessages.length === 0 ? (
                            <p className="mailbox-info-text">{t.emptyfolder || "Brak wiadomości w tym folderze"}</p>
                        ) : (
                            displayedMessages.map(msg => (
                                <div 
                                    key={msg.id} 
                                    className={`message-item ${msg.unread ? 'unread' : ''} ${selectedMessage?.id === msg.id ? 'selected' : ''}`}
                                    onClick={() => handleSelectMessage(msg)}
                                >
                                    <div className="msg-meta">
                                        <span className="msg-sender">{msg.sender}</span>&nbsp;
                                        <span className="msg-date">{new Date(msg.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <h4 className="msg-subject">{msg.subject}</h4>
                                    <p className="msg-excerpt">{msg.content.substring(0, 50)}...</p>
                                    {msg.tag && <span className={`msg-tag ${msg.tag.toLowerCase()}`}>{msg.tag}</span>}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="reader-panel">
                    {selectedMessage ? (
                        <div className="message-reader">
                            <div className="reader-header">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h2>{selectedMessage.subject}</h2>
                                    <button 
                                        className="mailbox-delete-btn"
                                        onClick={() => handleDeleteMessage(selectedMessage.id)}
                                        title={activeFolder === 'trash' ? (t.deletepermanently || "Usuń trwale") : (t.movetotrash || "Przenieś do kosza")}
                                    >
                                        {activeFolder === 'trash' ? (t.deletepermanently || "Usuń trwale") : (t.movetotrash || "Przenieś do kosza")}
                                    </button>
                                </div>
                                <div className="reader-meta">
                                    <p><strong>{t.from || "Od:"}</strong> {selectedMessage.sender}</p>
                                    <p><strong>{t.date || "Data:"}</strong> {new Date(selectedMessage.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="reader-body">
                                <p style={{ whiteSpace: 'pre-wrap' }}>{selectedMessage.content}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="no-message-selected">
                            <p>{t.nomessageselected || "Wybierz wiadomość z listy, aby ją przeczytać."}</p>
                        </div>
                    )}
                </div>
            </div>

            {isComposing && (
                <div className="mailbox-modal-overlay">
                    <div className="mailbox-modal-card">
                        <h2>{t.newMessageTitle || "Nowa wiadomość"}</h2>
                        {errorMsg && <div className="mailbox-error-alert">{errorMsg}</div>}
                        <form onSubmit={handleSendMessage}>
                            <div className="mailbox-input-group">
                                <label>{t.recipientLabel || "E-mail odbiorcy:"}</label>
                                <input 
                                    type="email" 
                                    placeholder={t.recipientPlaceholder || "np. jan.kowalski@domain.pl"}
                                    value={formData.to} 
                                    onChange={(e) => setFormData({...formData, to: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="mailbox-input-group">
                                <label>{t.subjectLabel || "Temat:"}</label>
                                <input 
                                    type="text" 
                                    value={formData.subject} 
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="mailbox-input-group">
                                <label>{t.contentLabel || "Treść:"}</label>
                                <textarea 
                                    rows="8" 
                                    value={formData.content} 
                                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="mailbox-modal-actions">
                                <button type="button" className="cancel-btn" onClick={() => setIsComposing(false)}>
                                    {t.cancel || "Anuluj"}
                                </button>
                                <button type="submit" className="submit-btn">
                                    {t.send || "Wyślij"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}