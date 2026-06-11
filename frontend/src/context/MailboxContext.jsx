import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const MailboxContext = createContext();

export const MailboxProvider = ({ children }) => {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    const refreshCount = async () => {
        if (!user || !user.id) return;
        try {
            const res = await axios.get(`http://localhost:8080/api/mailbox/${user.id}/unread-count`);
            const newCount = res.data.count;

            setUnreadCount(prevCount => {
                if (newCount > prevCount) {
                    const audio = new Audio('/notification.mp3');
                    audio.play().catch(e => console.log("Brak interakcji: dźwięk zablokowany"));
                }
                return newCount;
            });
        } catch (err) {
            console.error("Błąd pobierania licznika:", err);
        }
    };

    useEffect(() => {
        if (!user) return;

        refreshCount(); 

        const interval = setInterval(refreshCount, 30000); 

        return () => clearInterval(interval); 
    }, [user]);

    return (
        <MailboxContext.Provider value={{ unreadCount, refreshCount }}>
            {children}
        </MailboxContext.Provider>
    );
};

export const useMailbox = () => useContext(MailboxContext);