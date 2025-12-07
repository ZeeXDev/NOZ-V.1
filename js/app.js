/* ===================================
   NOZ WebApp - App Logic (Home Page)
   Logique principale de la page d'accueil
   =================================== */

// Variables globales
let currentUser = null;
let balanceVisible = true;

/**
 * Initialise l'application
 */
function initApp() {
    console.log('Initialisation de l\'application NOZ...');

    // Masquer le loading
    hideLoading();

    // Récupérer l'utilisateur Telegram
    currentUser = window.TelegramApp.getUser();

    if (currentUser) {
        // Initialiser les données utilisateur
        DB.initUser(currentUser);

        // Charger l'interface utilisateur
        loadUserInterface();

        // Charger les données
        loadUserData();

        // Configurer les événements
        setupEventListeners();

        console.log('Application initialisée avec succès');
    } else {
        console.error('Impossible de récupérer l\'utilisateur Telegram');
        showNotification('Erreur: Impossible de charger les données utilisateur');
    }
}

/**
 * Charge l'interface utilisateur
 */
function loadUserInterface() {
    // Mettre à jour les informations utilisateur dans le header
    const userNameEl = document.getElementById('userName');
    const userIdEl = document.getElementById('userId');
    const userAvatarEl = document.getElementById('userAvatar');

    if (userNameEl) {
        userNameEl.innerHTML = `
            ${currentUser.first_name} ${currentUser.last_name}
            <svg class="badge-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" stroke-width="2">
                <circle cx="12" cy="8" r="7"></circle>
                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
            </svg>
        `;
    }

    if (userIdEl) {
        userIdEl.textContent = currentUser.id;
    }

    if (userAvatarEl) {
        userAvatarEl.src = currentUser.photo_url;
    }
}

/**
 * Charge les données utilisateur
 */
function loadUserData() {
    const userData = DB.getUser();
    if (!userData) return;

    // Mettre à jour les balances
    updateBalanceDisplay(userData.noz_balance, userData.kfcy_balance);

    // Mettre à jour les statistiques
    updateStatsDisplay(userData);
}

/**
 * Met à jour l'affichage des balances
 * @param {number} nozBalance - Solde NOZ
 * @param {number} kfcyBalance - Solde KFCY
 */
function updateBalanceDisplay(nozBalance, kfcyBalance) {
    const nozBalanceEl = document.getElementById('nozBalance');
    const nozStarsEl = document.getElementById('nozStars');
    const kfcyBalanceEl = document.getElementById('kfcyBalance');
    const kfcyUsdtEl = document.getElementById('kfcyUsdt');

    if (nozBalanceEl) {
        nozBalanceEl.textContent = balanceVisible ? nozBalance.toFixed(4) : '••••';
    }

    if (nozStarsEl) {
        const stars = DB.convertNozToStars(nozBalance);
        nozStarsEl.textContent = balanceVisible ? stars.toFixed(2) : '•••';
    }

    if (kfcyBalanceEl) {
        kfcyBalanceEl.textContent = balanceVisible ? kfcyBalance.toFixed(0) : '••••';
    }

    if (kfcyUsdtEl) {
        const usdt = DB.convertKfcyToUsdt(kfcyBalance);
        kfcyUsdtEl.textContent = balanceVisible ? usdt.toFixed(2) : '•••';
    }
}

/**
 * Met à jour l'affichage des statistiques
 * @param {Object} userData - Données utilisateur
 */
function updateStatsDisplay(userData) {
    const referralCountEl = document.getElementById('referralCount');
    const nozEarnedEl = document.getElementById('nozEarned');

    if (referralCountEl) {
        referralCountEl.textContent = userData.referrals_count || 0;
    }

    if (nozEarnedEl) {
        nozEarnedEl.textContent = (userData.total_earned || 0).toFixed(3);
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Bouton toggle balance
    const toggleBalanceBtn = document.getElementById('toggleBalance');
    if (toggleBalanceBtn) {
        toggleBalanceBtn.addEventListener('click', toggleBalanceVisibility);
    }

    // Bouton simuler parrainage (pour développement - À RETIRER EN PRODUCTION)
    const simulateBtn = document.getElementById('simulateBtn');
    if (simulateBtn) {
        simulateBtn.addEventListener('click', handleSimulateReferral);
    }

    // Bouton partager lien
    const shareBtn = document.getElementById('shareBtn');
    if (shareBtn) {
        shareBtn.addEventListener('click', handleShareReferral);
    }

    // Bouton admin
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.addEventListener('click', handleAdminAccess);
    }
}

/**
 * Toggle la visibilité de la balance
 */
function toggleBalanceVisibility() {
    balanceVisible = !balanceVisible;
    
    const userData = DB.getUser();
    if (userData) {
        updateBalanceDisplay(userData.noz_balance, userData.kfcy_balance);
    }

    // Changer l'icône
    const eyeIcon = document.querySelector('.eye-icon');
    if (eyeIcon) {
        if (balanceVisible) {
            eyeIcon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            `;
        } else {
            eyeIcon.innerHTML = `
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            `;
        }
    }

    // Feedback haptique
    window.TelegramApp.hapticFeedback('light');
}

/**
 * Simule un parrainage (DÉVELOPPEMENT UNIQUEMENT - À RETIRER EN PRODUCTION)
 */
function handleSimulateReferral() {
    // CETTE FONCTION EST POUR LE DÉVELOPPEMENT UNIQUEMENT
    // EN PRODUCTION, LES PARRAINAGES VIENNENT DU BACKEND VIA LE LIEN DE PARRAINAGE
    
    showLoading();

    setTimeout(() => {
        const newReferral = {
            id: Date.now(),
            first_name: `User${Math.floor(Math.random() * 1000)}`,
            last_name: 'Test',
            photo_url: `https://ui-avatars.com/api/?name=User${Math.floor(Math.random() * 1000)}&background=1F2937&color=10B981`
        };

        const success = DB.addReferral(newReferral);

        hideLoading();

        if (success) {
            showNotification('Nouveau parrainage ! +0.001 NOZ');
            window.TelegramApp.hapticFeedback('success');
            
            // Recharger les données
            loadUserData();

            // Animation sur le bouton
            const btn = document.getElementById('simulateBtn');
            if (btn) {
                btn.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    btn.style.transform = 'scale(1)';
                }, 200);
            }
        } else {
            showNotification('Erreur lors du parrainage');
            window.TelegramApp.hapticFeedback('error');
        }
    }, 1000);
}

/**
 * Gère le partage du lien de parrainage
 */
function handleShareReferral() {
    window.TelegramApp.hapticFeedback('medium');
    window.TelegramApp.shareReferralLink();
}

/**
 * Gère l'accès admin
 */
function handleAdminAccess() {
    window.TelegramApp.hapticFeedback('heavy');
    
    const password = prompt('Mot de passe administrateur :');
    
    if (password === 'admin123') {
        window.location.href = 'admin.html';
    } else if (password !== null) {
        showNotification('Mot de passe incorrect');
        window.TelegramApp.hapticFeedback('error');
    }
}

/**
 * Affiche le loading overlay
 */
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

/**
 * Cache le loading overlay
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
    }
}

/**
 * Affiche une notification
 * @param {string} message - Message à afficher
 */
function showNotification(message) {
    window.TelegramApp.showNotification(message);
}

/**
 * Rafraîchit les données depuis le backend
 */
async function refreshFromBackend() {
    showLoading();

    try {
        const backendData = await DB.fetchFromBackend();
        
        if (backendData && backendData.user) {
            // Mettre à jour les données locales
            DB.saveUser(backendData.user);
            
            // Recharger l'interface
            loadUserData();
            
            showNotification('Données actualisées');
        }
    } catch (error) {
        console.error('Erreur de rafraîchissement:', error);
        showNotification('Erreur de synchronisation');
    } finally {
        hideLoading();
    }
}

/**
 * Gère le pull-to-refresh
 */
function setupPullToRefresh() {
    let startY = 0;
    let isPulling = false;

    document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
            startY = e.touches[0].pageY;
            isPulling = true;
        }
    });

    document.addEventListener('touchmove', (e) => {
        if (!isPulling) return;

        const currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;

        if (pullDistance > 100) {
            // Déclencher le refresh
            isPulling = false;
            refreshFromBackend();
        }
    });

    document.addEventListener('touchend', () => {
        isPulling = false;
    });
}

/**
 * Vérifie les mises à jour périodiquement
 */
function startPeriodicSync() {
    // Synchroniser toutes les 5 minutes
    setInterval(() => {
        console.log('Synchronisation périodique...');
        refreshFromBackend();
    }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Gère la visibilité de la page
 */
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            // La page redevient visible - rafraîchir les données
            console.log('Page visible - rafraîchissement des données');
            loadUserData();
        }
    });
}

// Initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initApp();
        setupPullToRefresh();
        startPeriodicSync();
        handleVisibilityChange();
    });
} else {
    initApp();
    setupPullToRefresh();
    startPeriodicSync();
    handleVisibilityChange();
}

// Exporter les fonctions pour utilisation globale
window.AppHome = {
    init: initApp,
    refresh: refreshFromBackend,
    showLoading: showLoading,
    hideLoading: hideLoading,
    updateBalance: updateBalanceDisplay,
    updateStats: updateStatsDisplay
};