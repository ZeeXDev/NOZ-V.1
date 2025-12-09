/* ===================================
   NOZ WebApp - Tasks Logic COMPLET
   Avec intégration AdsGram RÉELLE
   =================================== */

let currentUser = null;
let adWatching = false;
let adsgramController = null;

// ⚠️ CONFIGURATION ADSGRAM - À MODIFIER
const ADSGRAM_CONFIG = {
    blockId: 'YOUR_BLOCK_ID_HERE', // Obtenir sur https://adsgram.ai
    debug: true // Mettre true pour voir les logs
};

/**
 * Initialise la page Tasks
 */
function initTasksPage() {
    console.log('📱 Initialisation page Tasks...');

    currentUser = window.TelegramApp.getUser();

    if (currentUser) {
        loadUserInterface();
        loadTasksData();
        setupEventListeners();
        checkDailyTask();
        
        // Initialiser AdsGram
        initAdsGramSDK();
        
        console.log('✅ Page Tasks prête');
    } else {
        console.error('❌ Utilisateur non trouvé');
        showNotification('Erreur de chargement');
    }
}

/**
 * Initialise le SDK AdsGram
 */
async function initAdsGramSDK() {
    console.log('🎬 Initialisation AdsGram...');
    
    try {
        // Attendre que window.Adsgram soit disponible
        await waitForAdsGram();
        
        // Initialiser le contrôleur avec le Block ID
        adsgramController = window.Adsgram.init({
            blockId: ADSGRAM_CONFIG.blockId,
            debug: ADSGRAM_CONFIG.debug
        });
        
        console.log('✅ AdsGram initialisé avec Block ID:', ADSGRAM_CONFIG.blockId);
        
    } catch (error) {
        console.error('❌ Erreur init AdsGram:', error);
        console.warn('⚠️ Les pubs ne fonctionneront pas. Vérifiez votre Block ID.');
    }
}

/**
 * Attend que le SDK AdsGram soit chargé
 */
function waitForAdsGram() {
    return new Promise((resolve, reject) => {
        // Déjà chargé ?
        if (window.Adsgram) {
            resolve();
            return;
        }
        
        // Attendre max 5 secondes
        let attempts = 0;
        const maxAttempts = 50;
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.Adsgram) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Timeout: AdsGram SDK non chargé'));
            }
        }, 100);
    });
}

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

function loadTasksData() {
    const userData = DB.getUser();
    if (!userData) return;

    const nozBalanceEl = document.getElementById('nozBalanceSummary');
    const kfcyBalanceEl = document.getElementById('kfcyBalanceSummary');

    if (nozBalanceEl) {
        nozBalanceEl.textContent = userData.noz_balance.toFixed(2);
    }
    if (kfcyBalanceEl) {
        kfcyBalanceEl.textContent = userData.kfcy_balance.toFixed(0);
    }
}

function setupEventListeners() {
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (watchAdBtn) {
        watchAdBtn.addEventListener('click', handleWatchAd);
    }
}

function checkDailyTask() {
    const canWatch = DB.canWatchAd();
    const watchAdBtn = document.getElementById('watchAdBtn');
    const taskStatus = document.getElementById('taskStatus');
    const taskTimer = document.getElementById('taskTimer');
    const taskProgress = document.getElementById('taskProgress');
    const tasksCompleted = document.getElementById('tasksCompleted');

    if (!canWatch) {
        // Pub déjà vue aujourd'hui
        if (watchAdBtn) watchAdBtn.style.display = 'none';
        if (taskStatus) taskStatus.style.display = 'none';
        if (taskTimer) taskTimer.style.display = 'flex';
        if (taskProgress) taskProgress.style.width = '100%';
        if (tasksCompleted) tasksCompleted.textContent = '1';

        // Calculer temps restant
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const timeLeft = tomorrow - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

        const timerText = document.querySelector('#taskTimer span');
        if (timerText) {
            timerText.textContent = `Tâche complétée ! Revenez dans ${hoursLeft}h ${minutesLeft}m`;
        }
    } else {
        // Pub disponible
        if (watchAdBtn) watchAdBtn.style.display = 'flex';
        if (taskStatus) taskStatus.style.display = 'block';
        if (taskTimer) taskTimer.style.display = 'none';
        if (taskProgress) taskProgress.style.width = '0%';
        if (tasksCompleted) tasksCompleted.textContent = '0';
    }
}

/**
 * Gère le clic sur "Regarder la pub"
 */
function handleWatchAd() {
    if (adWatching) {
        console.log('⚠️ Pub déjà en cours');
        return;
    }

    if (!DB.canWatchAd()) {
        showNotification('⏰ Pub déjà vue aujourd\'hui !');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    window.TelegramApp.hapticFeedback('medium');
    showAdLoading();
    adWatching = true;

    // Afficher la pub AdsGram
    showAdsGramAd();
}

function showAdLoading() {
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (!watchAdBtn) return;

    watchAdBtn.disabled = true;
    watchAdBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="60">
                <animate attributeName="stroke-dashoffset" values="60;0" dur="1s" repeatCount="indefinite"/>
            </circle>
        </svg>
        <span>Chargement de la pub...</span>
    `;
}

/**
 * Affiche la publicité AdsGram RÉELLE
 */
async function showAdsGramAd() {
    console.log('🎬 Tentative d\'affichage pub AdsGram...');

    if (!adsgramController) {
        console.error('❌ AdsGram non initialisé');
        showNotification('❌ AdsGram non disponible. Vérifiez votre Block ID.');
        handleAdError({ code: 'NOT_INITIALIZED' });
        return;
    }

    try {
        // ⭐ APPEL RÉEL DU SDK ADSGRAM
        await adsgramController.show();
        
        // Pub visionnée avec succès !
        console.log('✅ Pub AdsGram visionnée avec succès');
        completeAdWatch();
        
    } catch (error) {
        console.error('❌ Erreur AdsGram:', error);
        
        // Gérer les différentes erreurs
        let errorMessage = '❌ Erreur de pub';
        
        if (error && error.error) {
            switch (error.error) {
                case 'AdBlock':
                    errorMessage = '❌ Désactivez votre bloqueur de publicités';
                    break;
                case 'NotFound':
                    errorMessage = '⚠️ Aucune pub disponible pour le moment';
                    break;
                case 'InvalidBlockId':
                    errorMessage = '❌ Block ID invalide. Contactez l\'admin.';
                    break;
                default:
                    errorMessage = '❌ Erreur lors du chargement de la pub';
            }
        }
        
        showNotification(errorMessage);
        handleAdError(error);
    }
}

function animateProgress() {
    const taskProgress = document.getElementById('taskProgress');
    if (!taskProgress) return;

    let width = 0;
    const interval = setInterval(() => {
        if (width >= 100) {
            clearInterval(interval);
        } else {
            width += 2;
            taskProgress.style.width = width + '%';
        }
    }, 40);
}

/**
 * Complète le visionnage avec succès
 */
function completeAdWatch() {
    const reward = 100;
    DB.recordAdWatch(reward);

    checkDailyTask();
    loadTasksData();

    showSuccessAnimation();
    showNotification(`✅ Pub visionnée ! +${reward} KFCY`);
    window.TelegramApp.hapticFeedback('success');

    adWatching = false;

    // Restaurer le bouton
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (watchAdBtn) {
        watchAdBtn.disabled = false;
        watchAdBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Regarder la publicité</span>
            <div class="btn-shimmer"></div>
        `;
    }
}

/**
 * Gère les erreurs de pub
 */
function handleAdError(error) {
    console.error('⚠️ Erreur pub:', error);
    
    window.TelegramApp.hapticFeedback('error');
    adWatching = false;

    // Restaurer le bouton
    const watchAdBtn = document.getElementById('watchAdBtn');
    if (watchAdBtn) {
        watchAdBtn.disabled = false;
        watchAdBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Regarder la publicité</span>
            <div class="btn-shimmer"></div>
        `;
    }
}

function showSuccessAnimation() {
    const colors = ['#10B981', '#34D399', '#FBBF24', '#F59E0B'];
    const confettiCount = 30;

    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            createConfetti(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 30);
    }
}

function createConfetti(color) {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        background: ${color};
        top: 50%;
        left: 50%;
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
    `;

    const randomX = (Math.random() - 0.5) * 400;
    const randomY = Math.random() * 400 + 200;
    const randomRotation = Math.random() * 720;
    const duration = 1 + Math.random();

    confetti.animate([
        { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${randomX}px, ${randomY}px) rotate(${randomRotation}deg)`, opacity: 0 }
    ], {
        duration: duration * 1000,
        easing: 'ease-out'
    });

    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), duration * 1000);
}

function showNotification(message) {
    window.TelegramApp.showNotification(message);
}

function startTimerUpdate() {
    setInterval(() => {
        const canWatch = DB.canWatchAd();
        if (!canWatch) {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            const timeLeft = tomorrow - now;
            const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

            const timerText = document.querySelector('#taskTimer span');
            if (timerText) {
                timerText.textContent = `Tâche complétée ! Revenez dans ${hoursLeft}h ${minutesLeft}m`;
            }
        }
    }, 60000);
}

function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('👁️ Page visible');
            checkDailyTask();
            loadTasksData();
        }
    });
}

function refreshTasksData() {
    loadTasksData();
    checkDailyTask();
}

// Initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initTasksPage();
        startTimerUpdate();
        handleVisibilityChange();
    });
} else {
    initTasksPage();
    startTimerUpdate();
    handleVisibilityChange();
}

window.AppTasks = {
    init: initTasksPage,
    refresh: refreshTasksData,
    watchAd: handleWatchAd
};

/* ===================================
   📋 GUIDE D'UTILISATION ADSGRAM
   =================================== */

/*
1. OBTENIR TON BLOCK ID:
   - Va sur https://adsgram.ai/
   - Connecte-toi avec ton compte Telegram
   - Crée une nouvelle app
   - Copie ton Block ID
   - Remplace 'YOUR_BLOCK_ID_HERE' ligne 10

2. TESTER:
   - Met debug: true (ligne 11)
   - Ouvre la console du navigateur
   - Regarde les logs pour voir ce qui se passe

3. ERREURS COURANTES:
   - "AdBlock" : L'utilisateur a un bloqueur de pub
   - "NotFound" : Aucune pub disponible (normal parfois)
   - "InvalidBlockId" : Ton Block ID est incorrect
   - "NOT_INITIALIZED" : Le SDK n'est pas chargé

4. EN PRODUCTION:
   - Met debug: false
   - Teste sur plusieurs appareils
   - Vérifie dans Telegram (pas juste navigateur)
*/