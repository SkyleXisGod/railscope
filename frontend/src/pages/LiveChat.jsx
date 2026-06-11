import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations } from './constants/translations';
import { io } from 'socket.io-client'; 
import axios from 'axios';
import './LiveChat.css';

const BANNED_KEYWORDS = ['kurwa', 'chuj', 'jebac', 'jebie', 'pizda', 'suka', 'skurwysyn'];
const SOCKET_URL = 'http://localhost:8080';

export default function LiveChat() {
    const { user, updateUser, logout } = useAuth();
    const [messages, setMessages] = useState([]); 
    const [newMessage, setNewMessage] = useState('');
    const [slowModeActive, setSlowModeActive] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [warnings, setWarnings] = useState(0);
    const [isChatBanned, setIsChatBanned] = useState(false);
    const lang = user?.settings?.language || 'PL';
    const t = translations[lang].live;
    const messagesEndRef = useRef(null);
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.emit('get_chat_history');

        socketRef.current.on('chat_history', (history) => {
            setMessages(history);
        });

        socketRef.current.on('receive_message', (message) => {
            setMessages((prev) => [...prev, message]);
        });

        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setSlowModeActive(false);
        }
    }, [cooldown]);


const triggerAutoBan = async () => {
    try {
        const banDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        
        await axios.post('http://localhost:8080/api/admin/update-user', {
            username: user.username,
            bannedUntil: banDate,
            role: user.role
        });

        updateUser({ bannedUntil: banDate });

        alert("Naruszenie zasad: Konto zablokowane na 24h.");
        window.location.reload(); 
    } catch (err) {
        console.error("Błąd auto-bana:", err);
    }
};

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || isChatBanned || slowModeActive) return;

        const messageLower = newMessage.toLowerCase();
        const hasBannedWord = BANNED_KEYWORDS.some(word => messageLower.includes(word));

        if (hasBannedWord) {
            const nextWarnings = warnings + 1;
            setWarnings(nextWarnings);
            setNewMessage('');

            if (nextWarnings >= 3) {
                setIsChatBanned(true);
                triggerAutoBan();
                alert("Zostałeś zbanowany na tym czacie za używanie niedozwolonego słownictwa! (3/3 ostrzeżeń)");
            } else {
                alert(`Ostrzeżenie [${nextWarnings}/3]: Twoja wiadomość zawiera niedozwolone słownictwo!`);
            }
            return;
        }

        if (socketRef.current && user) {
            socketRef.current.emit('send_message', {
                senderId: user.id,
                text: newMessage.trim(),
                username: user.username, 
                role: user.role || 'USER'
            });
        }

        setNewMessage('');
        setSlowModeActive(true);
        setCooldown(3); 
    };

    return (
        <div className="chat-container">
            <div className="chat-header">
                <div>
                    <h2>{t.liveTitle}</h2>
                    <span className="chat-subtitle">{t.liveSubtitle}</span>
                </div>
            </div>

            <div className="chat-messages-box">
                {messages.map((msg) => (
                    <div key={msg.id} className="chat-message">
                        <div className="chat-msg-header">
                            <span className={`chat-badge badge-${msg.role ? msg.role.toLowerCase() : 'user'}`}>{msg.role}</span>&nbsp;
                            <span className="chat-username">{msg.username}</span>&nbsp;
                            <span className="chat-time">{msg.timestamp}</span>
                        </div>
                        <p className="chat-text">{msg.text}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="chat-input-area">
                {isChatBanned ? (
                    <div className="chat-banned-alert">{t.chatBannedAlert}</div>
                ) : (
                    <>
                        <input
                            type="text"
                            placeholder={slowModeActive ? `${t.slowModePlaceholder} (${cooldown}s)` : t.chatPlaceholder}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={slowModeActive}
                            maxLength={250}
                        />
                        <button type="submit" disabled={slowModeActive || !newMessage.trim()}>
                            {slowModeActive ? `${cooldown}s` : t.sendButton}
                        </button>
                    </>
                )}
            </form>
        </div>
    );
}