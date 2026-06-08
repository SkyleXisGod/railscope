import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './NotificationBadge.css';

export default function NotificationBadge() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;
        // Załaduj wiadomości dla konkretnego usera z bazy danych / localStorage
        const allNotifs = JSON.parse(localStorage.getItem('railscope_notifications') || '{}');
        setNotifications(allNotifs[user.username] || []);
    }, [user, isOpen]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAllAsRead = () => {
        const allNotifs = JSON.parse(localStorage.getItem('railscope_notifications') || '{}');
        if (allNotifs[user.username]) {
            allNotifs[user.username] = allNotifs[user.username].map(n => ({ ...n, read: true }));
            localStorage.setItem('railscope_notifications', JSON.stringify(allNotifs));
            setNotifications(allNotifs[user.username]);
        }
    };

    const handleClearNotifications = () => {
        const allNotifs = JSON.parse(localStorage.getItem('railscope_notifications') || '{}');
        allNotifs[user.username] = [];
        localStorage.setItem('railscope_notifications', JSON.stringify(allNotifs));
        setNotifications([]);
    };

    if (!user) return null;

    return (
        <div className="notif-wrapper">
            <div className="notif-icon-btn" onClick={() => { setIsOpen(!isOpen); if(!isOpen) handleMarkAllAsRead(); }}>
                ✉️
                {unreadCount > 0 && <span className="notif-red-dot">{unreadCount}</span>}
            </div>

            {isOpen && (
                <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                        <h4>Skrzynka Powiadomień</h4>
                        <button onClick={handleClearNotifications}>Wyczyść</button>
                    </div>
                    <div className="notif-dropdown-body">
                        {notifications.length === 0 ? (
                            <p className="no-notifs">Brak nowych wiadomości systemowych.</p>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className={`notif-item ${n.read ? 'read' : 'unread'}`}>
                                    <p>{n.text}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}