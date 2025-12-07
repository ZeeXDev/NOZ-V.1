/* ===================================
   NOZ WebApp - Telegram Integration
   =================================== */

const CONFIG = {
    BOT_USERNAME: 'NOZBot',
    APP_NAME: 'app',
    API_URL: 'https://your-backend-api.com',
};

let tg = window.Telegram?.WebApp;
let telegramUser = null;
let startParam = null;

function initTelegramWebApp() {
    if (!tg) {
        console.warn('Telegram WebApp non disponible');
        telegramUser = {
            id: Date.now(),
            first_name: "Guest",
            last_name: "User",
            username: "guest",
            photo_url: generateAvatarUrl("Guest User")
        };
        return;
    }

    tg.ready();
    tg.expand();
    
    // Vérifier version avant d'utiliser les features
    const version = parseFloat(tg.version || '6.0');
    
    if (version >= 6.1) {
        tg.enableClosingConfirmation();
        tg.setHeaderColor('#0a0a0a');
        tg.setBackgroundColor('#0a0a0a');
    }
    
    if (tg.initDataUnsafe?.user) {
        telegramUser = {
            id: tg.initDataUnsafe.user.id,
            first_name: tg.initDataUnsafe.user.first_name || 'User',
            last_name: tg.initDataUnsafe.user.last_name || '',
            username: tg.initDataUnsafe.user.username || '',
            photo_url: tg.initDataUnsafe.user.photo_url || generateAvatarUrl(tg.initDataUnsafe.user.first_name)
        };
        
        console.log('Utilisateur Telegram:', telegramUser);
    } else {
        telegramUser = {
            id: Date.now(),
            first_name: "Guest",
            last_name: "",
            username: "guest",
            photo_url: generateAvatarUrl("Guest")
        };
    }
    
    startParam = tg.initDataUnsafe?.start_param || null;
    
    if (startParam && startParam.startsWith('ref_')) {
        const referrerId = startParam.replace('ref_', '');
        handleReferral(referrerId);
    }
    
    setupMainButton();
    console.log('Telegram WebApp initialisée');
}

function setupMainButton() {
    if (!tg || !tg.MainButton) return;
    tg.MainButton.hide();
}

function showMainButton(text, callback) {
    if (!tg || !tg.MainButton) return;
    tg.MainButton.setText(text);
    tg.MainButton.show();
    tg.MainButton.onClick(callback);
}

function hideMainButton() {
    if (!tg || !tg.MainButton) return;
    tg.MainButton.hide();
    tg.MainButton.offClick();
}

function generateAvatarUrl(name) {
    const colors = ['1F2937', '374151', '4B5563', '10B981', '059669'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${randomColor}&color=fff&size=128`;
}

async function handleReferral(referrerId) {
    console.log('Nouveau parrainage:', referrerId);
    
    const alreadyReferred = localStorage.getItem('noz_referred');
    if (alreadyReferred) {
        console.log('Utilisateur déjà parrainé');
        return;
    }
    
    localStorage.setItem('noz_referred', 'true');
    localStorage.setItem('noz_referrer_id', referrerId);
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/referral`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                referrer_id: referrerId,
                new_user_id: telegramUser.id,
                new_user_data: telegramUser
            })
        });
        
        if (response.ok) {
            showNotification('Bienvenue ! Vous avez été parrainé.');
        }
    } catch (error) {
        console.error('Erreur parrainage:', error);
        simulateReferralLocal(referrerId);
    }
}

function simulateReferralLocal(referrerId) {
    console.log('Mode développement: simulation du parrainage');
    
    const referrals = JSON.parse(localStorage.getItem('noz_referrals') || '[]');
    referrals.push({
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        photo_url: telegramUser.photo_url,
        earned: 0.5,
        joined: new Date().toISOString()
    });
    localStorage.setItem('noz_referrals', JSON.stringify(referrals));
}

function getReferralLink() {
    if (!telegramUser) return '';
    return `https://t.me/${CONFIG.BOT_USERNAME}/${CONFIG.APP_NAME}?startapp=ref_${telegramUser.id}`;
}

function shareReferralLink() {
    const link = getReferralLink();
    const text = `🌟 Rejoins NOZ et gagne des récompenses !\n\n💎 Gagne des NOZ et convertis-les en Telegram Stars\n⚡ Regarde des pubs pour gagner des KFCY\n💰 Échange tes KFCY contre des USDT\n\n👉 ${link}`;
    
    if (tg && tg.openTelegramLink) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`;
        tg.openTelegramLink(shareUrl);
    } else {
        copyToClipboard(link);
        showNotification('Lien copié !');
    }
}

function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
            .then(() => console.log('Texte copié'))
            .catch(err => console.error('Erreur copie:', err));
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
        } catch (err) {
            console.error('Erreur copie:', err);
        }
        document.body.removeChild(textArea);
    }
}

function openExternalLink(url) {
    if (tg && tg.openLink) {
        tg.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function sendWithdrawalRequest(withdrawData) {
    const { type, amount, stars, usdt } = withdrawData;
    
    let message = `🌟 Demande de retrait ${type}\n\n`;
    message += `👤 Utilisateur: ${telegramUser.first_name} ${telegramUser.last_name}\n`;
    message += `🆔 ID: ${telegramUser.id}\n`;
    if (telegramUser.username) {
        message += `📱 Username: @${telegramUser.username}\n`;
    }
    message += `\n📊 Détails:\n`;
    message += `• Montant: ${amount} ${type}\n`;
    
    if (type === 'NOZ') {
        message += `• Équivalent: ${stars} ⭐ Telegram Stars\n`;
    } else {
        message += `• Équivalent: ${usdt} USDT\n`;
    }
    
    message += `• Date: ${new Date().toLocaleString('fr-FR')}\n`;
    message += `\nMerci de traiter cette demande. 🙏`;
    
    const encodedMessage = encodeURIComponent(message);
    const adminLink = `https://t.me/kingxey?text=${encodedMessage}`;
    
    openExternalLink(adminLink);
}

function showNotification(text) {
    const version = parseFloat(tg?.version || '6.0');
    
    if (tg && tg.showAlert && version >= 6.2) {
        tg.showAlert(text);
    } else {
        const notification = document.getElementById('notification');
        if (notification) {
            const textElement = notification.querySelector('.notification-text');
            if (textElement) {
                textElement.textContent = text;
            }
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('hide');
                setTimeout(() => {
                    notification.classList.remove('hide');
                }, 400);
            }, 3000);
        } else {
            alert(text);
        }
    }
}

function showConfirm(text, callback) {
    const version = parseFloat(tg?.version || '6.0');
    
    if (tg && tg.showConfirm && version >= 6.2) {
        tg.showConfirm(text, callback);
    } else {
        if (confirm(text)) {
            callback(true);
        }
    }
}

function hapticFeedback(type = 'light') {
    const version = parseFloat(tg?.version || '6.0');
    
    if (tg && tg.HapticFeedback && version >= 6.1) {
        switch(type) {
            case 'light':
            case 'medium':
            case 'heavy':
                tg.HapticFeedback.impactOccurred(type);
                break;
            case 'success':
            case 'error':
            case 'warning':
                tg.HapticFeedback.notificationOccurred(type);
                break;
        }
    }
}

function closeWebApp() {
    if (tg && tg.close) {
        tg.close();
    }
}

function getTelegramUser() {
    return telegramUser;
}

function isInTelegram() {
    return tg !== null && tg !== undefined;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTelegramWebApp);
} else {
    initTelegramWebApp();
}

window.TelegramApp = {
    init: initTelegramWebApp,
    getUser: getTelegramUser,
    getReferralLink: getReferralLink,
    shareReferralLink: shareReferralLink,
    sendWithdrawalRequest: sendWithdrawalRequest,
    showNotification: showNotification,
    showConfirm: showConfirm,
    hapticFeedback: hapticFeedback,
    openLink: openExternalLink,
    closeApp: closeWebApp,
    isInTelegram: isInTelegram,
    showMainButton: showMainButton,
    hideMainButton: hideMainButton
};