/* ===================================
   NOZ WebApp - Tasks Logic
   =================================== */

let currentUser = null;
let adWatching = false;

function initTasksPage() {
    console.log('Initialisation de la page Tasks...');

    currentUser = window.TelegramApp.getUser();

    if (currentUser) {
        loadUserInterface();
        loadTasksData();
        setupEventListeners();
        checkDailyTask();
        console.log('Page Tasks initialisée');
    } else {
        console.error('Impossible de récupérer l\'utilisateur');
        showNotification('Erreur: Impossible de charger les données');
    }
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
        if (watchAdBtn) watchAdBtn.style.display = 'none';
        if (taskStatus) taskStatus.style.display = 'none';
        if (taskTimer) taskTimer.style.display = 'flex';
        if (taskProgress) taskProgress.style.width = '100%';
        if (tasksCompleted) tasksCompleted.textContent = '1';

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
        if (watchAdBtn) watchAdBtn.style.display = 'flex';
        if (taskStatus) taskStatus.style.display = 'block';
        if (taskTimer) taskTimer.style.display = 'none';
        if (taskProgress) taskProgress.style.width = '0%';
        if (tasksCompleted) tasksCompleted.textContent = '0';
    }
}

function handleWatchAd() {
    if (adWatching) return;

    if (!DB.canWatchAd()) {
        showNotification('Vous avez déjà regardé une pub aujourd\'hui !');
        window.TelegramApp.hapticFeedback('error');
        return;
    }

    window.TelegramApp.hapticFeedback('medium');
    showAdLoading();
    adWatching = true;

    // Utiliser AdsGram si disponible, sinon simuler
    if (window.AdsGram && window.AdsGram.show) {
        window.AdsGram.show()
            .then(result => {
                completeAdWatch();
            })
            .catch(error => {
                console.error('Erreur AdsGram:', error);
                // Si erreur, simuler quand même en dev
                setTimeout(() => {
                    completeAdWatch();
                }, 2000);
            });
    } else {
        // Mode simulation
        setTimeout(() => {
            animateProgress();
            setTimeout(() => {
                completeAdWatch();
            }, 2000);
        }, 1000);
    }
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
        <span>Chargement...</span>
    `;
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

function completeAdWatch() {
    const reward = 100;
    DB.recordAdWatch(reward);

    checkDailyTask();
    loadTasksData();

    showSuccessAnimation();
    showNotification(`Publicité visionnée ! +${reward} KFCY`);
    window.TelegramApp.hapticFeedback('success');

    adWatching = false;

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

function handleAdError(error) {
    console.error('Erreur de publicité:', error);
    
    showNotification('Erreur lors du chargement de la publicité');
    window.TelegramApp.hapticFeedback('error');

    adWatching = false;

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

    setTimeout(() => {
        confetti.remove();
    }, duration * 1000);
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
            console.log('Page visible - vérification des tâches');
            checkDailyTask();
            loadTasksData();
        }
    });
}

function refreshTasksData() {
    loadTasksData();
    checkDailyTask();
}

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