/* ===================================
   NOZ WebApp - Admin Logic
   Logique du panel administrateur
   =================================== */

// Configuration
const ADMIN_PASSWORD = 'admin123'; // CHANGER EN PRODUCTION !
const API_URL = 'https://your-backend-api.com'; // REMPLACER par ton backend

// Variables globales
let isLoggedIn = false;
let currentUserDetails = null;

/**
 * Initialise la page Admin
 */
function initAdminPage() {
    console.log('Initialisation de la page Admin...');

    // Vérifier si déjà connecté
    const savedSession = sessionStorage.getItem('admin_session');
    if (savedSession === 'true') {
        loginSuccess();
    }

    // Configurer les événements
    setupEventListeners();
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Formulaire de connexion
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Bouton de déconnexion
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Bouton de recherche
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', handleUserSearch);
    }

    // Recherche avec Enter
    const userSearchInput = document.getElementById('userSearch');
    if (userSearchInput) {
        userSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleUserSearch();
            }
        });
    }

    // Bouton de prélèvement
    const deductBtn = document.getElementById('deductBtn');
    if (deductBtn) {
        deductBtn.addEventListener('click', handleDeductBalance);
    }
}

/**
 * Gère la connexion admin
 * @param {Event} e - Événement
 */
function handleLogin(e) {
    e.preventDefault();

    const passwordInput = document.getElementById('adminPassword');
    if (!passwordInput) return;

    const password = passwordInput.value.trim();

    if (password === ADMIN_PASSWORD) {
        loginSuccess();
        window.TelegramApp.hapticFeedback('success');
    } else {
        showNotification('Mot de passe incorrect');
        window.TelegramApp.hapticFeedback('error');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

/**
 * Connexion réussie
 */
function loginSuccess() {
    isLoggedIn = true;
    sessionStorage.setItem('admin_session', 'true');

    // Cacher l'écran de connexion
    const loginScreen = document.getElementById('adminLogin');
    if (loginScreen) {
        loginScreen.style.display = 'none';
    }

    // Afficher le dashboard
    const dashboard = document.getElementById('adminDashboard');
    if (dashboard) {
        dashboard.style.display = 'block';
    }

    // Charger les statistiques
    loadAdminStats();

    showNotification('Connexion réussie');
}

/**
 * Gère la déconnexion
 */
function handleLogout() {
    isLoggedIn = false;
    sessionStorage.removeItem('admin_session');

    // Afficher l'écran de connexion
    const loginScreen = document.getElementById('adminLogin');
    if (loginScreen) {
        loginScreen.style.display = 'flex';
    }

    // Cacher le dashboard
    const dashboard = document.getElementById('adminDashboard');
    if (dashboard) {
        dashboard.style.display = 'none';
    }

    // Réinitialiser le formulaire
    const passwordInput = document.getElementById('adminPassword');
    if (passwordInput) {
        passwordInput.value = '';
    }

    showNotification('Déconnexion réussie');
    window.TelegramApp.hapticFeedback('light');
}

/**
 * Charge les statistiques admin
 */
async function loadAdminStats() {
    try {
        // EN PRODUCTION: Récupérer depuis le backend
        // const response = await fetch(`${API_URL}/api/admin/stats`);
        // const data = await response.json();

        // Mode développement - Simuler les stats
        const stats = {
            totalUsers: 1,
            pendingWithdrawals: 0,
            totalNOZ: 0
        };

        // Mettre à jour l'interface
        const totalUsersEl = document.getElementById('totalUsers');
        const pendingWithdrawalsEl = document.getElementById('pendingWithdrawals');
        const totalNOZEl = document.getElementById('totalNOZ');

        if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
        if (pendingWithdrawalsEl) pendingWithdrawalsEl.textContent = stats.pendingWithdrawals;
        if (totalNOZEl) totalNOZEl.textContent = stats.totalNOZ.toFixed(3);

    } catch (error) {
        console.error('Erreur de chargement des stats:', error);
    }
}

/**
 * Gère la recherche d'utilisateur
 */
async function handleUserSearch() {
    const userSearchInput = document.getElementById('userSearch');
    if (!userSearchInput) return;

    const userId = userSearchInput.value.trim();

    if (!userId) {
        showNotification('Veuillez entrer un ID utilisateur');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    // Valider que c'est un nombre
    if (isNaN(userId)) {
        showNotification('ID utilisateur invalide');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    window.TelegramApp.hapticFeedback('light');

    try {
        // EN PRODUCTION: Récupérer depuis le backend
        // const response = await fetch(`${API_URL}/api/admin/user/${userId}`);
        // const userData = await response.json();

        // Mode développement - Simuler la recherche
        const currentUser = DB.getUser();
        
        if (currentUser && currentUser.id == userId) {
            // Utilisateur trouvé
            displayUserDetails(currentUser);
            showNotification('Utilisateur trouvé');
            window.TelegramApp.hapticFeedback('success');
        } else {
            // Utilisateur non trouvé
            showNotification('Utilisateur non trouvé');
            window.TelegramApp.hapticFeedback('error');
            hideUserDetails();
        }

    } catch (error) {
        console.error('Erreur de recherche:', error);
        showNotification('Erreur lors de la recherche');
        window.TelegramApp.hapticFeedback('error');
    }
}

/**
 * Affiche les détails de l'utilisateur
 * @param {Object} userData - Données utilisateur
 */
function displayUserDetails(userData) {
    currentUserDetails = userData;

    const userDetailsCard = document.getElementById('userDetails');
    if (userDetailsCard) {
        userDetailsCard.style.display = 'block';
    }

    // Avatar
    const avatarEl = document.getElementById('userDetailAvatar');
    if (avatarEl) {
        avatarEl.src = userData.photo_url || 'https://ui-avatars.com/api/?name=User';
    }

    // Nom
    const nameEl = document.getElementById('userDetailName');
    if (nameEl) {
        nameEl.textContent = `${userData.first_name} ${userData.last_name || ''}`.trim();
    }

    // ID
    const idEl = document.getElementById('userDetailId');
    if (idEl) {
        idEl.textContent = userData.id;
    }

    // Username
    const usernameEl = document.getElementById('userDetailUsername');
    if (usernameEl) {
        usernameEl.textContent = userData.username || 'N/A';
    }

    // Balances
    const nozEl = document.getElementById('userDetailNOZ');
    const kfcyEl = document.getElementById('userDetailKFCY');
    const referralsEl = document.getElementById('userDetailReferrals');

    if (nozEl) nozEl.textContent = userData.noz_balance.toFixed(4);
    if (kfcyEl) kfcyEl.textContent = userData.kfcy_balance.toFixed(0);
    if (referralsEl) referralsEl.textContent = userData.referrals_count || 0;

    // Réinitialiser les champs de prélèvement
    const deductNOZInput = document.getElementById('deductNOZ');
    const deductKFCYInput = document.getElementById('deductKFCY');
    if (deductNOZInput) deductNOZInput.value = '';
    if (deductKFCYInput) deductKFCYInput.value = '';

    // Animation d'apparition
    userDetailsCard.style.animation = 'slideIn 0.5s ease-out';
}

/**
 * Cache les détails de l'utilisateur
 */
function hideUserDetails() {
    const userDetailsCard = document.getElementById('userDetails');
    if (userDetailsCard) {
        userDetailsCard.style.display = 'none';
    }
    currentUserDetails = null;
}

/**
 * Gère le prélèvement de solde
 */
function handleDeductBalance() {
    if (!currentUserDetails) {
        showNotification('Aucun utilisateur sélectionné');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    const deductNOZInput = document.getElementById('deductNOZ');
    const deductKFCYInput = document.getElementById('deductKFCY');

    const nozAmount = parseFloat(deductNOZInput?.value || 0);
    const kfcyAmount = parseFloat(deductKFCYInput?.value || 0);

    if (nozAmount <= 0 && kfcyAmount <= 0) {
        showNotification('Veuillez entrer un montant valide');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    // Confirmer l'action
    const confirmMessage = `Confirmer le prélèvement ?\n${nozAmount > 0 ? `NOZ: ${nozAmount.toFixed(4)}\n` : ''}${kfcyAmount > 0 ? `KFCY: ${kfcyAmount.toFixed(0)}` : ''}`;

    window.TelegramApp.showConfirm(confirmMessage, (confirmed) => {
        if (confirmed) {
            processDeduction(nozAmount, kfcyAmount);
        }
    });
}

/**
 * Traite le prélèvement
 * @param {number} nozAmount - Montant NOZ
 * @param {number} kfcyAmount - Montant KFCY
 */
async function processDeduction(nozAmount, kfcyAmount) {
    try {
        // EN PRODUCTION: Envoyer au backend
        /*
        const response = await fetch(`${API_URL}/api/admin/deduct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: currentUserDetails.id,
                noz_amount: nozAmount,
                kfcy_amount: kfcyAmount
            })
        });

        if (!response.ok) {
            throw new Error('Erreur serveur');
        }
        */

        // Mode développement - Prélever localement
        if (nozAmount > 0) {
            const success = DB.updateNozBalance(nozAmount, false);
            if (!success) {
                showNotification('Solde NOZ insuffisant');
                window.TelegramApp.hapticFeedback('error');
                return;
            }
        }

        if (kfcyAmount > 0) {
            const success = DB.updateKfcyBalance(kfcyAmount, false);
            if (!success) {
                showNotification('Solde KFCY insuffisant');
                window.TelegramApp.hapticFeedback('error');
                return;
            }
        }

        // Recharger les détails de l'utilisateur
        const updatedUser = DB.getUser();
        displayUserDetails(updatedUser);

        // Enregistrer l'activité
        logActivity('deduction', {
            user_id: currentUserDetails.id,
            noz_amount: nozAmount,
            kfcy_amount: kfcyAmount
        });

        showNotification('Solde prélevé avec succès');
        window.TelegramApp.hapticFeedback('success');

        // Mettre à jour les stats
        loadAdminStats();

    } catch (error) {
        console.error('Erreur de prélèvement:', error);
        showNotification('Erreur lors du prélèvement');
        window.TelegramApp.hapticFeedback('error');
    }
}

/**
 * Enregistre une activité admin
 * @param {string} type - Type d'activité
 * @param {Object} data - Données de l'activité
 */
function logActivity(type, data) {
    // EN PRODUCTION: Envoyer au backend pour logs
    const activity = {
        type: type,
        data: data,
        timestamp: new Date().toISOString()
    };

    console.log('Activité admin:', activity);

    // Ajouter à la liste d'activités (optionnel)
    addActivityToList(activity);
}

/**
 * Ajoute une activité à la liste
 * @param {Object} activity - Activité
 */
function addActivityToList(activity) {
    const activityList = document.getElementById('activityList');
    if (!activityList) return;

    // Retirer l'état vide
    const emptyState = activityList.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    // Créer l'élément d'activité
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    
    const time = new Date(activity.timestamp).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    let description = '';
    if (activity.type === 'deduction') {
        description = `Prélèvement pour utilisateur ${activity.data.user_id}`;
        if (activity.data.noz_amount > 0) {
            description += ` - ${activity.data.noz_amount.toFixed(4)} NOZ`;
        }
        if (activity.data.kfcy_amount > 0) {
            description += ` - ${activity.data.kfcy_amount.toFixed(0)} KFCY`;
        }
    }

    activityItem.innerHTML = `
        <div class="activity-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        </div>
        <div class="activity-info">
            <p class="activity-description">${description}</p>
            <p class="activity-time">${time}</p>
        </div>
    `;

    // Ajouter en haut de la liste
    activityList.insertBefore(activityItem, activityList.firstChild);

    // Limiter à 10 activités
    const items = activityList.querySelectorAll('.activity-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

/**
 * Affiche une notification
 * @param {string} message - Message
 */
function showNotification(message) {
    window.TelegramApp.showNotification(message);
}

/**
 * Vérifie l'authentification
 */
function checkAuth() {
    if (!isLoggedIn) {
        window.location.href = 'admin.html';
    }
}

// Initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdminPage);
} else {
    initAdminPage();
}

// Exporter les fonctions
window.AppAdmin = {
    init: initAdminPage,
    login: handleLogin,
    logout: handleLogout,
    searchUser: handleUserSearch,
    deductBalance: handleDeductBalance
};