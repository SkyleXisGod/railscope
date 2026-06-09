import axios from 'axios';
import { mailbox_translations } from '../constants/translations';

export const NOTIFICATION_TYPES = {
    ADMIN_REPLY: 'ADMIN_REPLY',
    TICKET_CLOSED: 'TICKET_CLOSED',
    TICKET_DELETED: 'TICKET_DELETED',
    TICKET_IN_PROGRESS: 'TICKET_IN_PROGRESS',
    TICKET_CREATED: 'TICKET_CREATED',
    USER_UNBAN: 'USER_UNBAN',
    USER_BAN: 'USER_BAN',
    ROLE_CHANGED: 'ROLE_CHANGED',
    BAN_MODIFIED: 'BAN_MODIFIED',
    PROFILE_UPDATED_BY_ADMIN: 'PROFILE_UPDATED_BY_ADMIN'
};

/**
 * Wysyła zautomatyzowane powiadomienie dopasowane do języka ODBIORCY.
 * @param {string} type - Typ powiadomienia z NOTIFICATION_TYPES
 * @param {string|number} recipientId - ID użytkownika, który ma otrzymać wiadomość
 * @param {Object} data - Dane dynamiczne (ticketTitle, bannedUntil, newRole, forcedLang)
 */
export const sendMailboxNotification = async (type, recipientId, data = {}) => {
    const { ticketTitle = '', bannedUntil = '', newRole = '', forcedLang = null } = data;
    
    let targetLang = 'PL';

    if (forcedLang) {
        targetLang = forcedLang;
    } else {
        try {
            const userRes = await axios.get(`http://localhost:8080/api/admin/users/${recipientId}`);
            if (userRes.data?.settings?.language) {
                targetLang = userRes.data.settings.language;
            } else if (userRes.data?.language) {
                targetLang = userRes.data.language;
            }
        } catch (fetchErr) {
            console.warn(`Nie udało się pobrać preferencji językowych dla użytkownika #${recipientId}. Używam domyślnego PL.`, fetchErr);
        }
    }

    const mt = mailbox_translations[targetLang] || mailbox_translations.PL;

    let subject = "";
    let content = "";
    let tag = "System";

    const formattedBanDate = bannedUntil && !isNaN(Date.parse(bannedUntil))
        ? new Date(bannedUntil).toLocaleDateString(targetLang === 'PL' ? 'pl-PL' : 'en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
          })
        : bannedUntil;

    switch (type) {
        case NOTIFICATION_TYPES.ADMIN_REPLY:
            subject = mt.admin_reply_subject;
            content = mt.admin_reply_content.replace('{ticketTitle}', ticketTitle);
            tag = "Support";
            break;

        case NOTIFICATION_TYPES.TICKET_DELETED:
            subject = mt.ticket_deleted_subject;
            content = mt.ticket_deleted_content.replace('{ticketTitle}', ticketTitle);
            tag = "Support";
            break;

        case NOTIFICATION_TYPES.TICKET_CLOSED:
            subject = mt.ticket_closed_subject;
            content = mt.ticket_closed_content.replace('{ticketTitle}', ticketTitle);
            tag = "Support";
            break;

        case NOTIFICATION_TYPES.TICKET_IN_PROGRESS:
            subject = mt.ticket_in_progress_subject;
            content = mt.ticket_in_progress_content.replace('{ticketTitle}', ticketTitle);
            tag = "Support";
            break;

        case NOTIFICATION_TYPES.TICKET_CREATED:
            subject = mt.ticket_created_subject;
            content = mt.ticket_created_content.replace('{ticketTitle}', ticketTitle);
            tag = "System";
            break;

        case NOTIFICATION_TYPES.USER_BAN:
            subject = mt.user_ban_subject;
            content = mt.user_ban_content.replace('{bannedUntil}', formattedBanDate);
            tag = "Admin";
            break;

        case NOTIFICATION_TYPES.USER_UNBAN:
            subject = mt.user_unban_subject;
            content = mt.user_unban_content;
            tag = "Admin";
            break;

        case NOTIFICATION_TYPES.BAN_MODIFIED:
            subject = mt.ban_modified_subject;
            content = mt.ban_modified_content.replace('{bannedUntil}', formattedBanDate);
            tag = "Admin";
            break;

        case NOTIFICATION_TYPES.ROLE_CHANGED:
            subject = mt.role_changed_subject;
            content = mt.role_changed_content.replace('{newRole}', newRole);
            tag = "Admin";
            break;

        case NOTIFICATION_TYPES.PROFILE_UPDATED_BY_ADMIN:
            subject = mt.profile_updated_subject;
            content = mt.profile_updated_content;
            tag = "Admin";
            break;

        default:
            throw new Error(`Nieznany typ powiadomienia: ${type}`);
    }

    return await axios.post('http://localhost:8080/api/mailbox', {
        userId: recipientId,
        sender: "System RailScope",
        subject: subject,
        content: content,
        tag: tag,
        unread: true
    });
};