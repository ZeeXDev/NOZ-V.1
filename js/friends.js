/* ===================================
   NOZ WebApp - Friends Logic
   Logique de la page des parrainages
   =================================== */

// Variables globales
let currentUser = null;
let referralsList = [];

/**
 * Initialise la page Friends
 */
function initFriendsPage() {
    console.log('Initialisation de la page Friends...');

    // Récupérer l'utilisateur
    currentUser = window.TelegramApp.getUser();

    if (currentUser) {
        // Initialiser l'interface
        loadUserInterface();

        // Charger les données
        loadFriendsData();

        // Configurer les événements
        setupEventListeners();

        // Générer et afficher le lien de parrainage
        displayReferralLink();

        console.log('Page Friends initialisée');
    } else {
        console.error('Impossible de récupérer l\'utilisateur');
        showNotification('Erreur: Impossible de charger les données');
    }
}

/**
 * Charge l'interface utilisateur
 */
function loadUserInterface() {
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userId');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) {
        userNameEl.textContent = `${currentUser.first_name} ${currentUser.last_name}`;
    }

    if (userIdEl) {
        userIdEl.textContent = currentUser.id;
    }

    if (userAvatarEl) {
        userAvatarEl.src = currentUser.photo_url;
    }
}

/**
 * Charge les données des parrainages
 */
function loadFriendsData() {
    // Récupérer la liste des parrainages
    referralsList = DB.getReferrals();

    // Mettre à jour les statistiques
    updateReferralStats();

    // Afficher la liste des parrainages
    displayReferralsList();
}

/**
 * Met à jour les statistiques de parrainage
 */
function updateReferralStats() {
    const totalReferralsEl = document.getElementById('totalReferrals');
    const totalEarnedEl = document.getElementById('totalEarned');
    const friendsCountEl = document.getElementById('friendsCount');

    const totalReferrals = referralsList.length;
    const totalEarned = totalReferrals * 0.001;

    if (totalReferralsEl) {
        totalReferralsEl.textContent = totalReferrals;
    }

    if (totalEarnedEl) {
        totalEarnedEl.textContent = totalEarned.toFixed(3);
    }

    if (friendsCountEl) {
        friendsCountEl.textContent = totalReferrals;
    }
}

/**
 * Affiche le lien de parrainage
 */
function displayReferralLink() {
    const referralLinkEl = document.getElementById('referralLink');
    
    if (referralLinkEl && currentUser) {
        const link = window.TelegramApp.getReferralLink();
        referralLinkEl.value = link;
    }
}

/**
 * Affiche la liste des parrainages
 */
function displayReferralsList() {
    const referralsListEl = document.getElementById('referralsList');
    const emptyStateEl = document.getElementById('emptyState');

    if (!referralsListEl) return;

    if (referralsList.length === 0) {
        // Afficher l'état vide
        if (emptyStateEl) {
            emptyStateEl.style.display = 'flex';
        }
        return;
    }

    // Cacher l'état vide
    if (emptyStateEl) {
        emptyStateEl.style.display = 'none';
    }

    // Générer la liste des parrainages
    const referralsHTML = referralsList.map((referral, index) => {
        const joinedDate = new Date(referral.joined);
        const timeAgo = getTimeAgo(joinedDate);

        return `
            <div class="referral-item" style="animation-delay: ${index * 0.05}s">
                <div class="referral-avatar">
                    <img src="${referral.photo_url}" alt="${referral.first_name}">
                    <div class="referral-badge">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="referral-info">
                    <h4>${referral.first_name} ${referral.last_name || ''}</h4>
                    <p class="referral-date">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        ${timeAgo}
                    </p>
                </div>
                <div class="referral-reward">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                    </svg>
                    <span>+${referral.earned.toFixed(3)} NOZ</span>
                </div>
            </div>
        `;
    }).join('');

    referralsListEl.innerHTML = referralsHTML;

    // Ajouter les animations aux éléments
    setTimeout(() => {
        const items = referralsListEl.querySelectorAll('.referral-item');
        items.forEach(item => {
            item.classList.add('show');
        });
    }, 100);
}

/**
 * Calcule le temps écoulé depuis une date
 * @param {Date} date - Date à comparer
 * @returns {string} Temps écoulé formaté
 */
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
        return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
        return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
        return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
        return 'À l\'instant';
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Bouton copier le lien
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', handleCopyLink);
    }

    // Bouton partager
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShareLink);
    }
}

/**
 * Gère la copie du lien de parrainage
 */
function handleCopyLink() {
    const referralLinkEl = document.getElementById('referralLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');

    if (!referralLinkEl) return;

    // Sélectionner et copier le texte
    referralLinkEl.select();
    referralLinkEl.setSelectionRange(0, 99999); // Pour mobile

    try {
        // Copier dans le presse-papier
        navigator.clipboard.writeText(referralLinkEl.value).then(() => {
            // Animation de succès sur le bouton
            if (copyLinkBtn) {
                copyLinkBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                `;

                setTimeout(() => {
                    copyLinkBtn.innerHTML = `
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    `;
                }, 2000);
            }

            showNotification('Lien copié dans le presse-papier !');
            window.TelegramApp.hapticFeedback('success');
        }).catch(err => {
            console.error('Erreur de copie:', err);
            showNotification('Erreur lors de la copie');
            window.TelegramApp.hapticFeedback('error');
        });
    } catch (err) {
        console.error('Erreur de copie:', err);
        showNotification('Erreur lors de la copie');
        window.TelegramApp.hapticFeedback('error');
    }
}

/**
 * Gère le partage du lien de parrainage
 */
function handleShareLink() {
    window.TelegramApp.hapticFeedback('medium');
    window.TelegramApp.shareReferralLink();
}

/**
 * Affiche une notification
 * @param {string} message - Message à afficher
 */
function showNotification(message) {
    window.TelegramApp.showNotification(message);
}

/**
 * Rafraîchit les données
 */
function refreshFriendsData() {
    loadFriendsData();
}

/**
 * Gère la visibilité de la page
 */
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Page visible - rafraîchissement des données');
            loadFriendsData();
        }
    });
}

/**
 * Animation d'entrée pour les nouveaux parrainages
 */
function animateNewReferral() {
    const referralItems = document.querySelectorAll('.referral-item');
    if (referralItems.length > 0) {
        const lastItem = referralItems[referralItems.length - 1];
        lastItem.style.animation = 'slideIn 0.5s ease-out, pulse 0.5s ease-out 0.5s';
    }
}

/**
 * Vérifie les nouveaux parrainages périodiquement
 */
function checkForNewReferrals() {
    const currentCount = referralsList.length;
    
    // Recharger les données
    const newReferrals = DB.getReferrals();
    
    if (newReferrals.length > currentCount) {
        // Nouveau parrainage détecté
        console.log('Nouveau parrainage détecté !');
        referralsList = newReferrals;
        
        updateReferralStats();
        displayReferralsList();
        animateNewReferral();
        
        showNotification(`Nouveau parrainage ! +0.001 NOZ`);
        window.TelegramApp.hapticFeedback('success');
    }
}

/**
 * Démarre la vérification périodique des nouveaux parrainages
 */
function startPeriodicCheck() {
    // Vérifier toutes les 30 secondes
    setInterval(checkForNewReferrals, 30000);
}

// Initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initFriendsPage();
        handleVisibilityChange();
        startPeriodicCheck();
    });
} else {
    initFriendsPage();
    handleVisibilityChange();
    startPeriodicCheck();
}

// Exporter les fonctions
window.AppFriends = {
    init: initFriendsPage,
    refresh: refreshFriendsData,
    copyLink: handleCopyLink,
    shareLink: handleShareLink
};