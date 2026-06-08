import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { translations, adm_translations } from './constants/translations';
import axios from 'axios';
import './AdminPage.css';

export default function AdminPage() {
    const { user } = useAuth();
    
    // --- MODULARNE ZAKŁADKI ---
    const [activeTab, setActiveTab] = useState('users'); // 'users' lub 'tickets'

    // --- STANY UŻYTKOWNIKÓW (Twoje) ---
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [sortBy, setSortBy] = useState('default');
    const [filterRole, setFilterRole] = useState('all');
    const [groupByRole, setGroupByRole] = useState(false);
    
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ username: '', email: '', role: '', bannedUntil: '' });

    // --- STANY ZGŁOSZEŃ (Moje) ---
    const [ticketsList, setTicketsList] = useState([]);
    const [replyModal, setReplyModal] = useState({ isOpen: false, ticketId: null, message: '' });

    // Dynamiczne dopasowanie tłumaczeń
    const lang = user?.settings?.language || 'PL';
    const baseTrans = adm_translations[lang] || adm_translations.PL || {};
    const t = baseTrans.admin ? baseTrans.admin : baseTrans;
    
    // Pobieranie danych w zależności od zakładki
    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers();
        } else if (activeTab === 'tickets') {
            fetchTickets();
        }
    }, [activeTab]);

    // ==========================================
    // LOGIKA UŻYTKOWNIKÓW
    // ==========================================
    const fetchUsers = async () => {
        setLoading(true);
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
        if (window.confirm((t.confirmDelete || 'Na pewno chcesz permanentnie usunąć użytkownika {username}?').replace('{username}', username))) {
            try {
                await axios.delete(`http://localhost:8080/api/users/${id}`, {
                    data: { callerRole: user.role }
                });
                setUsersList(usersList.filter(u => u.id !== id));
            } catch (err) {
                console.error(t.errorDelete || 'Błąd usuwania', err);
                alert(err.response?.data?.error || t.deleteError || 'Nie udało się usunąć użytkownika.');
            }
        }
    };

    const openEditModal = (targetUser) => {
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
        if (window.confirm((t.confirmUnban || 'Odblokować konto użytkownika {username}?').replace('{username}', currentData.username))) {
            try {
                const payload = {
                    username: currentData.username,
                    email: currentData.email,
                    role: currentData.role,
                    callerRole: user.role,
                    bannedUntil: null 
                };

                await axios.put(`http://localhost:8080/api/admin/users/${targetId}`, payload);
                setUsersList(usersList.map(u => u.id === targetId ? { ...u, bannedUntil: null } : u));
            } catch (err) {
                console.error(t.errorUnban || 'Błąd odbanowywania', err);
                alert(err.response?.data?.error || t.unbanError || 'Nie udało się odbanować użytkownika.');
            }
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...editForm,
                callerRole: user.role,
                bannedUntil: editForm.bannedUntil ? new Date(editForm.bannedUntil).toISOString() : null
            };

            await axios.put(`http://localhost:8080/api/admin/users/${editingUser.id}`, payload);
            setUsersList(usersList.map(u => u.id === editingUser.id ? { ...u, ...payload } : u));
            setEditingUser(null);
        } catch (err) {
            console.error("Błąd edycji", err);
            alert(err.response?.data?.error || t.saveError || "Nie udało się zaktualizować użytkownika.");
        }
    };

    // ==========================================
    // LOGIKA ZGŁOSZEŃ (TICKETY)
    // ==========================================
    const fetchTickets = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:8080/api/admin/tickets');
            setTicketsList(res.data);
        } catch (err) {
            console.error("Błąd pobierania ticketów:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await axios.patch(`http://localhost:8080/api/admin/tickets/${id}`, { status: newStatus });
            fetchTickets();
        } catch (err) {
            alert("Błąd zmiany statusu");
        }
    };

    const handleDeleteTicket = async (id) => {
        if (!window.confirm("Usunąć to zgłoszenie na stałe?")) return;
        try {
            await axios.delete(`http://localhost:8080/api/admin/tickets/${id}`);
            fetchTickets();
        } catch (err) {
            alert("Błąd usuwania zgłoszenia");
        }
    };

    const handleSendReply = async () => {
        if (!replyModal.message.trim()) return;
        try {
            await axios.post(`http://localhost:8080/api/admin/tickets/${replyModal.ticketId}/reply`, {
                message: replyModal.message,
                adminName: user.username
            });
            setReplyModal({ isOpen: false, ticketId: null, message: '' });
            fetchTickets();
            alert("Odpowiedź została wysłana!");
        } catch (err) {
            alert("Błąd podczas wysyłania odpowiedzi");
        }
    };

    // ==========================================
    // POMOCNICZE FUNKCJE
    // ==========================================
    if (!user || (user.role !== 'ADMIN' && user.role !== 'ZARZADCA')) {
        return (
            <div className="admin-container access-denied">
                <h1>{t.accessDenied}</h1>
                <p>{t.accessDeniedMessage}</p>
            </div>
        );
    }

    const isBanned = (bannedUntil) => {
        return bannedUntil && new Date(bannedUntil) > new Date();
    };

    const canEditTarget = (targetRole) => {
        if (user.role === 'ZARZADCA') return true; 
        if (user.role === 'ADMIN' && (targetRole === 'ADMIN' || targetRole === 'ZARZADCA')) return false; 
        return true;
    };

    const roleWeight = { ZARZADCA: 4, ADMIN: 3, PLUS: 2, USER: 1 };

    const processedUsers = usersList
        .filter(u => 
            (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .filter(u => {
            if (filterRole === 'all') return true;
            if (filterRole === 'banned') return isBanned(u.bannedUntil);
            return u.role === filterRole;
        })
        .sort((a, b) => {
            if (sortBy === 'alpha') return (a.username || '').localeCompare(b.username || '');
            if (sortBy === 'id') return a.id - b.id;
            if (sortBy === 'banned') {
                const aBanned = isBanned(a.bannedUntil) ? 1 : 0;
                const bBanned = isBanned(b.bannedUntil) ? 1 : 0;
                return bBanned - aBanned; 
            }
            const weightA = roleWeight[a.role] || 0;
            const weightB = roleWeight[b.role] || 0;
            if (weightB !== weightA) return weightB - weightA;
            return (a.username || '').localeCompare(b.username || '');
        });

    const renderUserRow = (u) => {
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
                        <span className="banned-badge">{t.banned}</span>
                    )}
                </td>
                <td className="actions-cell">
                    {hasAccess ? (
                        <>
                            {banned && (
                                <button className="action-btn unban-btn" onClick={() => handleUnban(u.id, u)}>
                                    {t.unban}
                                </button>
                            )}
                            <button className="action-btn edit-btn" onClick={() => openEditModal(u)}>
                                {t.edit}
                            </button>
                            <button className="action-btn delete-btn" onClick={() => handleDelete(u.id, u.username)}>
                                {t.delete}
                            </button>
                        </>
                    ) : (
                        <span className="locked-action">🔒 {t.locked}</span>
                    )}
                </td>
            </tr>
        );
    };

    const renderTableBody = () => {
        if (processedUsers.length === 0) {
            return (
                <tr>
                    <td colSpan="5" className="empty-state">{t.noResults}</td>
                </tr>
            );
        }

        if (!groupByRole) {
            return processedUsers.map(u => renderUserRow(u));
        }

        const rolesOrder = ['ZARZADCA', 'ADMIN', 'PLUS', 'USER'];
        return rolesOrder.map(role => {
            const usersInRole = processedUsers.filter(u => u.role === role);
            if (usersInRole.length === 0) return null;

            return (
                <React.Fragment key={role}>
                    <tr className="role-group-header-row">
                        <td colSpan="5" className="role-group-header-cell">
                            {(t.roleGroup || 'Grupa: {role}').replace('{role}', role)}
                        </td>
                    </tr>
                    {usersInRole.map(u => renderUserRow(u))}
                </React.Fragment>
            );
        });
    };

    return (
        <div className="admin-container">
            <div className="admin-header" style={{ paddingBottom: 0 }}>
                <div className="header-top-row">
                    <div>
                        <h1 className="admin-title">{t.adminTitle || 'RailScope Admin'}</h1>
                        <p className="admin-subtitle">
                            {t.loggedInAs} <strong style={{ color: user.role === 'ZARZADCA' ? '#ff0055' : '#ff4d4d' }}>{user.role}</strong>
                        </p>
                    </div>
                </div>

                {/* --- STYLIZOWANE ZAKŁADKI (BROWSER TABS) --- */}
                <div style={{ 
                    display: 'flex', 
                    marginTop: '25px', 
                    borderBottom: '2px solid #2e2e34',
                    gap: '5px'
                }}>
                    <button 
                        onClick={() => setActiveTab('users')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'users' ? '#1a1a1e' : 'transparent',
                            color: activeTab === 'users' ? '#00ffd5' : '#888894',
                            border: '2px solid #2e2e34',
                            // Magia zakładki: jeśli jest aktywna, ukrywamy dolną ramkę i obniżamy ją lekko
                            borderBottom: activeTab === 'users' ? '2px solid #1a1a1e' : '2px solid #2e2e34',
                            borderRadius: '12px 12px 0 0',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            marginBottom: '-2px', // nachodzenie na główną linię
                            position: 'relative',
                            zIndex: activeTab === 'users' ? 2 : 1,
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        👥 {t.tabUsers}
                    </button>
                    <button 
                        onClick={() => setActiveTab('tickets')}
                        style={{
                            padding: '12px 24px',
                            background: activeTab === 'tickets' ? '#1a1a1e' : 'transparent',
                            color: activeTab === 'tickets' ? '#00ffd5' : '#888894',
                            border: '2px solid #2e2e34',
                            borderBottom: activeTab === 'tickets' ? '2px solid #1a1a1e' : '2px solid #2e2e34',
                            borderRadius: '12px 12px 0 0',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            marginBottom: '-2px',
                            position: 'relative',
                            zIndex: activeTab === 'tickets' ? 2 : 1,
                            transition: 'all 0.2s ease-in-out'
                        }}
                    >
                        🎫 {t.tabTickets}
                    </button>
                </div>
            </div>

            {activeTab === 'users' && (
                <>
                    <div className="admin-search-controls" style={{ marginTop: '20px' }}>
                        <input 
                            type="text" 
                            className="admin-search-input" 
                            placeholder={t.searchPlaceholder || 'Szukaj użytkownika...'} 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <div className="admin-stats-badge">
                            {t.userCount} <span>{usersList.length}</span>
                        </div>
                    </div>

                    <div className="admin-advanced-toggle-wrapper" style={{ marginTop: '12px' }}>
                        <button 
                            type="button" 
                            className="action-btn advanced-toggle-btn"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {t.advancedMenu || 'Zaawansowane zarządzanie'} {showAdvanced ? '▲' : '▼'}
                        </button>
                    </div>

                    {showAdvanced && (
                        <div className="admin-advanced-panel">
                            <div className="admin-input-group">
                                <label>{t.sortByLabel}</label>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                    <option value="default">{t.sortDefault}</option>
                                    <option value="alpha">{t.sortAlpha}</option>
                                    <option value="id">{t.sortId}</option>
                                    <option value="banned">{t.sortBanned}</option>
                                </select>
                            </div>

                            <div className="admin-input-group">
                                <label>{t.filterRoleLabel}</label>
                                <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                                    <option value="all">{t.allRoles}</option>
                                    <option value="banned">{t.onlyBanned}</option>
                                    <option value="USER">USER</option>
                                    <option value="PLUS">PLUS</option>
                                    <option value="ADMIN">ADMIN</option>
                                    <option value="ZARZADCA">ZARZADCA</option>
                                </select>
                            </div>

                            <div className="admin-checkbox-group">
                                <label>
                                    <input 
                                        type="checkbox" 
                                        checked={groupByRole} 
                                        onChange={(e) => setGroupByRole(e.target.checked)}
                                    />
                                    {t.groupByLabel}
                                </label>
                            </div>
                        </div>
                    )}

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
                                        <th>{t.username}</th>
                                        <th>{t.email}</th>
                                        <th>{t.roleAndStatus || 'Rola i status'}</th>
                                        <th className="text-right">{t.actions || 'Akcje'}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderTableBody()}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'tickets' && (
                <div style={{ overflowY: 'auto', padding: '20px 0 50px 0' }}>
                    {loading ? <p>{t.ticketsLoading}</p> : (
                        <div style={{ display: 'grid', gap: '15px' }}>
                            {ticketsList.length === 0 ? <p>{t.ticketsEmpty}</p> : ticketsList.map(ticket => (
                                <div key={ticket.id} style={{ background: '#1a1a1e', padding: '20px', borderRadius: '12px', border: '1px solid #2e2e34' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <span style={{ color: '#666670', fontWeight: 'bold' }}>#{ticket.id}</span>
                                            <h3 style={{ margin: 0, color: '#fff' }}>{ticket.title}</h3>
                                            <span style={{ background: 'rgba(0, 255, 213, 0.1)', color: '#00ffd5', padding: '3px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>{ticket.category}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <select 
                                                value={ticket.status} 
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                style={{ background: '#24242b', color: '#fff', border: '1px solid #3a3a44', padding: '5px 10px', borderRadius: '6px', cursor: 'pointer' }}
                                            >
                                                <option value="Otwarty">{t.ticketStatusOpen}</option>
                                                <option value="W trakcie">{t.ticketStatusProgress}</option>
                                                <option value="Zamknięty">{t.ticketStatusClosed}</option>
                                            </select>
                                            <button 
                                                className="action-btn edit-btn"
                                                onClick={() => setReplyModal({ isOpen: true, ticketId: ticket.id, message: '' })}
                                            >
                                                {t.ticketReply}
                                            </button>
                                            <button 
                                                className="action-btn delete-btn"
                                                onClick={() => handleDeleteTicket(ticket.id)}
                                            >
                                                {t.ticketDelete}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div style={{ background: '#24242b', padding: '15px', borderRadius: '8px', color: '#ccc', fontSize: '0.9rem' }}>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888894' }}><strong>{t.ticketAuthorId}:</strong> {ticket.userId}</p>
                                        <p style={{ marginTop: '10px' }}>{ticket.description}</p>
                                    </div>

                                    {ticket.adminReply && (
                                        <div style={{ background: 'rgba(0, 255, 213, 0.05)', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #00ffd5', marginTop: '10px' }}>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#00ffd5' }}>{t.ticketYourReply}:</p>
                                            <p style={{ margin: '5px 0 0 0', color: '#fff', fontSize: '0.9rem' }}>{ticket.adminReply}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ==================== MODALE ==================== */}

            {/* Modal edycji użytkownika */}
            {editingUser && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card">
                        <h2>{t.editUser} #{editingUser.id}</h2>
                        <form onSubmit={handleSaveEdit}>
                            <div className="admin-input-group">
                                <label>{t.username}</label>
                                <input 
                                    type="text" 
                                    value={editForm.username} 
                                    onChange={(e) => setEditForm({...editForm, username: e.target.value})}
                                />
                            </div>
                            <div className="admin-input-group">
                                <label>{t.email}</label>
                                <input 
                                    type="email" 
                                    value={editForm.email} 
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                />
                            </div>
                            <div className="admin-input-group">
                                <label>{t.systemRole}</label>
                                <select 
                                    value={editForm.role} 
                                    onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                    disabled={editingUser.role === 'ZARZADCA'} 
                                >
                                    <option value="USER">USER</option>
                                    <option value="PLUS">PLUS</option>
                                    {user.role === 'ZARZADCA' && <option value="ADMIN">ADMIN</option>}
                                    {user.role === 'ZARZADCA' && <option value="ZARZADCA">ZARZADCA</option>}
                                </select>
                            </div>

                            <div className="admin-input-group ban-group">
                                <label>{t.banUntil}</label>
                                <input 
                                    type="datetime-local" 
                                    value={editForm.bannedUntil} 
                                    onChange={(e) => setEditForm({...editForm, bannedUntil: e.target.value})}
                                />
                            </div>
                            
                            <div className="admin-modal-actions">
                                <button type="button" className="action-btn cancel-btn" onClick={() => setEditingUser(null)}>{t.cancel}</button>
                                <button type="submit" className="action-btn save-btn">{t.saveChanges}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal odpowiedzi na ticket */}
            {replyModal.isOpen && (
                <div className="admin-modal-overlay">
                    <div className="admin-modal-card">
                        <h2>{t.ticketReplyTitle.replace('{id}', replyModal.ticketId)}</h2>
                        <div className="admin-input-group" style={{ marginTop: '15px' }}>
                            <label>{t.ticketReplyLabel}</label>
                            <textarea 
                                rows="5" 
                                value={replyModal.message}
                                onChange={(e) => setReplyModal({...replyModal, message: e.target.value})}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1a1a1e', color: '#fff', border: '1px solid #2e2e34', resize: 'vertical' }}
                                placeholder={t.ticketReplyPlaceholder}
                            ></textarea>
                        </div>
                        <div className="admin-modal-actions" style={{ marginTop: '20px' }}>
                            <button className="action-btn cancel-btn" onClick={() => setReplyModal({ isOpen: false, ticketId: null, message: '' })}>{t.cancel}</button>
                            <button className="action-btn save-btn" onClick={handleSendReply}>{t.ticketSendReply}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}