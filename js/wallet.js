/* ===================================
   NOZ WebApp - Wallet Logic
   Logique de la page portefeuille
   =================================== */

// Variables globales
let currentUser = null;

/**
 * Initialise la page Wallet
 */
function initWalletPage() {
    console.log('Initialisation de la page Wallet...');

    // Récupérer l'utilisateur
    currentUser = window.TelegramApp.getUser();

    if (currentUser) {
        // Initialiser l'interface
        loadUserInterface();

        // Charger les données
        loadWalletData();

        // Configurer les événements
        setupEventListeners();

        console.log('Page Wallet initialisée');
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
 * Charge les données du portefeuille
 */
function loadWalletData() {
    const userData = DB.getUser();
    if (!userData) return;

    // Mettre à jour les balances
    updateBalances(userData.noz_balance, userData.kfcy_balance);
}

/**
 * Met à jour l'affichage des balances
 * @param {number} nozBalance - Solde NOZ
 * @param {number} kfcyBalance - Solde KFCY
 */
function updateBalances(nozBalance, kfcyBalance) {
    const nozBalanceEl = document.getElementById('nozBalance');
    const nozStarsEl = document.getElementById('nozStars');
    const kfcyBalanceEl = document.getElementById('kfcyBalance');
    const kfcyUsdtEl = document.getElementById('kfcyUsdt');

    if (nozBalanceEl) {
        nozBalanceEl.textContent = nozBalance.toFixed(4);
    }

    if (nozStarsEl) {
        const stars = DB.convertNozToStars(nozBalance);
        nozStarsEl.textContent = stars.toFixed(2);
    }

    if (kfcyBalanceEl) {
        kfcyBalanceEl.textContent = kfcyBalance.toFixed(0);
    }

    if (kfcyUsdtEl) {
        const usdt = DB.convertKfcyToUsdt(kfcyBalance);
        kfcyUsdtEl.textContent = usdt.toFixed(2);
    }
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Calculatrice - Type de conversion
    const calcTypeEl = document.getElementById('calcType');
    if (calcTypeEl) {
        calcTypeEl.addEventListener('change', handleCalcTypeChange);
    }

    // Calculatrice - Montant
    const calcAmountEl = document.getElementById('calcAmount');
    if (calcAmountEl) {
        calcAmountEl.addEventListener('input', handleCalcAmountChange);
    }

    // Retrait - Type
    const withdrawTypeEl = document.getElementById('withdrawType');
    if (withdrawTypeEl) {
        withdrawTypeEl.addEventListener('change', handleWithdrawTypeChange);
    }

    // Retrait - Montant
    const withdrawAmountEl = document.getElementById('withdrawAmount');
    if (withdrawAmountEl) {
        withdrawAmountEl.addEventListener('input', handleWithdrawAmountChange);
    }

    // Bouton retrait
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', handleWithdrawRequest);
    }
}

/**
 * Gère le changement de type de conversion dans la calculatrice
 */
function handleCalcTypeChange() {
    const calcTypeEl = document.getElementById('calcType');
    const calcResultUnitEl = document.getElementById('calcResultUnit');
    const conversionRateEl = document.getElementById('conversionRate');

    if (!calcTypeEl) return;

    const type = calcTypeEl.value;

    if (type === 'noz') {
        if (calcResultUnitEl) calcResultUnitEl.textContent = '⭐ Stars';
        if (conversionRateEl) conversionRateEl.textContent = '0.001 NOZ = 0.5 ⭐';
    } else {
        if (calcResultUnitEl) calcResultUnitEl.textContent = '💵 USDT';
        if (conversionRateEl) conversionRateEl.textContent = '1000 KFCY = 0.1 USDT';
    }

    // Recalculer
    handleCalcAmountChange();
}

/**
 * Gère le changement de montant dans la calculatrice
 */
function handleCalcAmountChange() {
    const calcTypeEl = document.getElementById('calcType');
    const calcAmountEl = document.getElementById('calcAmount');
    const calcResultEl = document.getElementById('calcResult');

    if (!calcTypeEl || !calcAmountEl || !calcResultEl) return;

    const type = calcTypeEl.value;
    const amount = parseFloat(calcAmountEl.value) || 0;

    let result = 0;

    if (type === 'noz') {
        result = DB.convertNozToStars(amount);
    } else {
        result = DB.convertKfcyToUsdt(amount);
    }

    calcResultEl.textContent = result.toFixed(2);

    // Animation du résultat
    calcResultEl.style.transform = 'scale(1.05)';
    setTimeout(() => {
        calcResultEl.style.transform = 'scale(1)';
    }, 200);
}

/**
 * Gère le changement de type de retrait
 */
function handleWithdrawTypeChange() {
    const withdrawTypeEl = document.getElementById('withdrawType');
    const withdrawHintEl = document.getElementById('withdrawHint');

    if (!withdrawTypeEl) return;

    const type = withdrawTypeEl.value;

    if (withdrawHintEl) {
        if (type === 'NOZ') {
            withdrawHintEl.textContent = 'Minimum: 50 NOZ (25⭐)';
        } else {
            withdrawHintEl.textContent = 'Minimum: 50,000 KFCY (5 USDT)';
        }
    }

    // Réinitialiser le montant et l'aperçu
    const withdrawAmountEl = document.getElementById('withdrawAmount');
    if (withdrawAmountEl) {
        withdrawAmountEl.value = '';
    }

    hideWithdrawalPreview();
}

/**
 * Gère le changement de montant de retrait
 */
function handleWithdrawAmountChange() {
    const withdrawTypeEl = document.getElementById('withdrawType');
    const withdrawAmountEl = document.getElementById('withdrawAmount');

    if (!withdrawTypeEl || !withdrawAmountEl) return;

    const type = withdrawTypeEl.value;
    const amount = parseFloat(withdrawAmountEl.value) || 0;

    if (amount > 0) {
        updateWithdrawalPreview(type, amount);
    } else {
        hideWithdrawalPreview();
    }
}

/**
 * Met à jour l'aperçu du retrait
 * @param {string} type - Type de retrait
 * @param {number} amount - Montant
 */
function updateWithdrawalPreview(type, amount) {
    const previewEl = document.getElementById('withdrawalPreview');
    const previewTypeEl = document.getElementById('previewType');
    const previewAmountEl = document.getElementById('previewAmount');
    const previewReceiveEl = document.getElementById('previewReceive');

    if (!previewEl) return;

    let equivalent = 0;
    let unit = '';

    if (type === 'NOZ') {
        equivalent = DB.convertNozToStars(amount);
        unit = '⭐ Stars';
    } else {
        equivalent = DB.convertKfcyToUsdt(amount);
        unit = '💵 USDT';
    }

    if (previewTypeEl) previewTypeEl.textContent = type;
    if (previewAmountEl) previewAmountEl.textContent = amount.toFixed(type === 'NOZ' ? 4 : 0);
    if (previewReceiveEl) previewReceiveEl.textContent = `${equivalent.toFixed(2)} ${unit}`;

    previewEl.style.display = 'block';
}

/**
 * Cache l'aperçu du retrait
 */
function hideWithdrawalPreview() {
    const previewEl = document.getElementById('withdrawalPreview');
    if (previewEl) {
        previewEl.style.display = 'none';
    }
}

/**
 * Gère la demande de retrait
 */
function handleWithdrawRequest() {
    const withdrawTypeEl = document.getElementById('withdrawType');
    const withdrawAmountEl = document.getElementById('withdrawAmount');

    if (!withdrawTypeEl || !withdrawAmountEl) return;

    const type = withdrawTypeEl.value;
    const amount = parseFloat(withdrawAmountEl.value);

    // Validation
    if (!amount || amount <= 0) {
        showNotification('Veuillez entrer un montant valide');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    // Vérifier si le retrait est possible
    const canWithdrawResult = DB.canWithdraw(type, amount);

    if (!canWithdrawResult.success) {
        showNotification(canWithdrawResult.message);
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    // Confirmer la demande
    const equivalent = canWithdrawResult.equivalent;
    const unit = type === 'NOZ' ? '⭐ Stars' : '💵 USDT';
    
    const confirmMessage = `Confirmer le retrait de ${amount.toFixed(type === 'NOZ' ? 4 : 0)} ${type} (${equivalent.toFixed(2)} ${unit}) ?`;

    window.TelegramApp.showConfirm(confirmMessage, (confirmed) => {
        if (confirmed) {
            processWithdrawal(type, amount, equivalent);
        }
    });
}

/**
 * Traite la demande de retrait
 * @param {string} type - Type de retrait
 * @param {number} amount - Montant
 * @param {number} equivalent - Équivalent en Stars/USDT
 */
function processWithdrawal(type, amount, equivalent) {
    showLoading();

    // Simuler un délai de traitement
    setTimeout(() => {
        // Envoyer la demande à l'admin via Telegram
        const withdrawData = {
            type: type,
            amount: amount.toFixed(type === 'NOZ' ? 4 : 0),
            stars: type === 'NOZ' ? equivalent.toFixed(2) : null,
            usdt: type === 'KFCY' ? equivalent.toFixed(2) : null
        };

        window.TelegramApp.sendWithdrawalRequest(withdrawData);

        // Déduire le montant localement (sera confirmé par l'admin)
        // EN PRODUCTION: Ne déduire qu'après validation de l'admin
        const success = DB.processWithdrawal(type, amount);

        hideLoading();

        if (success) {
            // Recharger les données
            loadWalletData();

            // Réinitialiser le formulaire
            const withdrawAmountEl = document.getElementById('withdrawAmount');
            if (withdrawAmountEl) {
                withdrawAmountEl.value = '';
            }
            hideWithdrawalPreview();

            showNotification('Demande de retrait envoyée avec succès !');
            window.TelegramApp.hapticFeedback('success');

            // Animation de succès
            showSuccessAnimation();
        } else {
            showNotification('Erreur lors du traitement du retrait');
            window.TelegramApp.hapticFeedback('error');
        }
    }, 1500);
}

/**
 * Affiche une animation de succès
 */
function showSuccessAnimation() {
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (!withdrawBtn) return;

    // Animation du bouton
    withdrawBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        withdrawBtn.style.transform = 'scale(1)';
    }, 200);

    // Créer des confettis
    const colors = ['#10B981', '#34D399', '#FBBF24'];
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createConfetti(colors[Math.floor(Math.random() * colors.length)]);
        }, i * 30);
    }
}

/**
 * Crée un confetti animé
 * @param {string} color - Couleur
 */
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

    setTimeout(() => {
        confetti.remove();
    }, duration * 1000);
}

/**
 * Affiche le loading
 */
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
    }
}

/**
 * Cache le loading
 */
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
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
 * Rafraîchit les données
 */
function refreshWalletData() {
    loadWalletData();
}

/**
 * Gère la visibilité de la page
 */
function handleVisibilityChange() {
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            console.log('Page visible - rafraîchissement des données');
            loadWalletData();
        }
    });
}

// Initialisation au chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initWalletPage();
        handleVisibilityChange();
    });
} else {
    initWalletPage();
    handleVisibilityChange();
}

// Exporter les fonctions
window.AppWallet = {
    init: initWalletPage,
    refresh: refreshWalletData,
    withdraw: handleWithdrawRequest
};