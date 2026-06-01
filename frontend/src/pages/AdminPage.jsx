import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import './AdminPage.css';

export default function AdminPage() {
    const { user } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Stan modalu edycji
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', email: '', role: '', bannedUntil: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:8080/api/admin/users');
            setUsersList(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Błąd ładowania użytkowników", err);
            setLoading(false);
        }
    };

    const handleDelete = async (id, username) => {
        if (window.confirm(`Na pewno chcesz permanentnie usunąć użytkownika ${username}?`)) {
            try {
                // Axios delete z body wymaga specjalnej struktury { data: { ... } }
                await axios.delete(`http://localhost:8080/api/users/${id}`, {
                    data: { callerRole: user.role }
                });
                setUsersList(usersList.filter(u => u.id !== id));
            } catch (err) {
                console.error("Błąd usuwania", err);
                alert(err.response?.data?.error || "Nie udało się usunąć użytkownika.");
            }
        }
    };

    const openEditModal = (targetUser) => {
        // Formatowanie daty dla inputa type="datetime-local" (YYYY-MM-DDThh:mm)
        const formatBannedUntil = targetUser.bannedUntil 
            ? new Date(targetUser.bannedUntil).toISOString().substring(0, 16)
            : '';

        setEditingUser(targetUser);
        setEditForm({
            username: targetUser.username || '',
            email: targetUser.email || '',
            role: targetUser.role || 'USER',
            bannedUntil: formatBannedUntil
        });
    };

    const handleUnban = async (targetId, currentData) => {
        if (window.confirm(`Szybkie działanie: Odblokować konto użytkownika ${currentData.username}?`)) {
            try {
                // Skoro nasz endpoint w backendzie to klasyczny PUT (nadpisujący całość),
                // musimy wysłać aktualne dane użytkownika, ale z wyzerowanym bannedUntil.
                const payload = {
                    username: currentData.username,
                    email: currentData.email,
                    role: currentData.role,
                    callerRole: user.role,
                    bannedUntil: null // Magiczne słowo do odbanowania
                };

                await axios.put(`http://localhost:8080/api/admin/users/${targetId}`, payload);
                
                // Aktualizujemy tabelę bez odświeżania strony
                setUsersList(usersList.map(u => u.id === targetId ? { ...u, bannedUntil: null } : u));
            } catch (err) {
                console.error("Błąd odbanowywania", err);
                alert(err.response?.data?.error || "Nie udało się odbanować użytkownika.");
            }
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            // Wysyłamy callerRole, żeby backend wiedział, kto to klika
            const payload = {
                ...editForm,
                callerRole: user.role,
                bannedUntil: editForm.bannedUntil ? new Date(editForm.bannedUntil).toISOString() : null
            };

            await axios.put(`http://localhost:8080/api/admin/users/${editingUser.id}`, payload);
            
            // Aktualizacja listy w locie
            setUsersList(usersList.map(u => u.id === editingUser.id ? { ...u, ...payload } : u));
            setEditingUser(null);
        } catch (err) {
            console.error("Błąd edycji", err);
            alert(err.response?.data?.error || "Nie udało się zaktualizować użytkownika.");
        }
    };

    // Zabezpieczenie przed nieautoryzowanym dostępem na sam widok
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ZARZADCA')) {
        return (
            <div className="admin-container access-denied">
                <h1>Brak dostępu</h1>
                <p>Ten sektor jest zarezerwowany wyłącznie dla administracji RailScope.</p>
            </div>
        );
    }

    const filteredUsers = usersList.filter(u => 
        (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Helper: Czy dany użytkownik jest obecnie zbanowany?
    const isBanned = (bannedUntil) => {
        return bannedUntil && new Date(bannedUntil) > new Date();
    };

    // Helper: Czy zalogowany użytkownik ma prawo edytować dany cel?
    const canEditTarget = (targetRole) => {
        if (user.role === 'ZARZADCA') return true; // Zarządca może wszystko
        if (user.role === 'ADMIN' && (targetRole === 'ADMIN' || targetRole === 'ZARZADCA')) return false; 
        return true;
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="header-top-row">
                    <div>
                        <h1 className="admin-title">RailScope Admin</h1>
                        <p className="admin-subtitle">
                            Zalogowano jako: <strong style={{ color: user.role === 'ZARZADCA' ? '#ff0055' : '#ff4d4d' }}>{user.role}</strong>
                        </p>
                    </div>
                </div>

                <div className="admin-search-controls">
                    <input 
                        type="text" 
                        className="admin-search-input" 
                        placeholder="Szukaj użytkownika po nazwie lub emailu..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className="admin-stats-badge">
                        Konta: <span>{usersList.length}</span>
                    </div>
                </div>
            </div>

            <div className="admin-list-wrapper">
                {loading ? (
                    <div className="skeleton-wrapper">
                        <div className="skeleton-header"></div>
                        <div className="skeleton-row"></div>
                        <div className="skeleton-row"></div>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Użytkownik</th>
                                <th>Email</th>
                                <th>Rola & Status</th>
                                <th className="text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(u => {
                                const banned = isBanned(u.bannedUntil);
                                const hasAccess = canEditTarget(u.role);

                                return (
                                <tr key={u.id} className={`admin-table-row ${banned ? 'row-banned' : ''}`}>
                                    <td className="id-cell">#{u.id}</td>
                                    <td className="name-cell">{u.username || '—'}</td>
                                    <td className="email-cell">{u.email}</td>
                                    <td>
                                        <span className={`role-badge role-${u.role}`}>
                                            {u.role}
                                        </span>
                                        {banned && (
                                            <span className="banned-badge">ZBANOWANY</span>
                                        )}
                                    </td>
                                   <td className="actions-cell">
                                        {hasAccess ? (
                                            <>
                                                {/* Jeśli u.bannedUntil w ogóle istnieje i bana, pokaż dodatkowy przycisk */}
                                                {banned && (
                                                    <button className="action-btn unban-btn" onClick={() => handleUnban(u.id, u)}>
                                                        Odbanuj
                                                    </button>
                                                )}
                                                
                                                <button className="action-btn edit-btn" onClick={() => openEditModal(u)}>
                                                    Edytuj
                                                </button>
                                                <button className="action-btn delete-btn" onClick={() => handleDelete(u.id, u.username)}>
                                                    Usuń
                                                </button>
                                            </>
                                        ) : (
                                            <span className="locked-action">🔒 Zablokowane</span>
                                        )}
                                    </td>
                                </tr>
                            )})}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="empty-state">Brak wyników</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal edycji */}
            {editingUser && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card">
                        <h2>Edytuj Użytkownika #{editingUser.id}</h2>
                        <form onSubmit={handleSaveEdit}>
                            <div className="admin-input-group">
                                <label>Nazwa użytkownika</label>
                                <input 
                                    type="text" 
                                    value={editForm.username} 
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                />
                            </div>
                            <div className="admin-input-group">
                                <label>Adres Email</label>
                                <input 
                                    type="email" 
                                    value={editForm.email} 
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                />
                            </div>
                            <div className="admin-input-group">
                                <label>Rola systemowa</label>
                                <select 
                                    value={editForm.role} 
                                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                    disabled={editingUser.role === 'ZARZADCA'} // Nikt nie może zmienić roli Zarządcy z poziomu UI
                                >
                                    <option value="USER">USER</option>
                                    <option value="PLUS">PLUS</option>
                                    
                                    {/* Zwykły ADMIN nie może nadać ról ADMIN i ZARZADCA */}
                                    {user.role === 'ZARZADCA' && <option value="ADMIN">ADMIN</option>}
                                    {user.role === 'ZARZADCA' && <option value="ZARZADCA">ZARZADCA</option>}
                                </select>
                            </div>

                            <div className="admin-input-group ban-group">
                                <label>Zbanuj do (zostaw puste aby odbanować)</label>
                                <input 
                                    type="datetime-local" 
                                    value={editForm.bannedUntil} 
                                    onChange={(e) => setEditForm({...editForm, bannedUntil: e.target.value})}
                                />
                            </div>
                            
                            <div className="admin-modal-actions">
                                <button type="button" className="action-btn cancel-btn" onClick={() => setEditingUser(null)}>Anuluj</button>
                                <button type="submit" className="action-btn save-btn">Zapisz Zmiany</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}