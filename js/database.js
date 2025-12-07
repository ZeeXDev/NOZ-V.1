/* ===================================
   NOZ WebApp - Database Management
   TAUX CORRECTS: 100 KFCY = 0.01 USDT | Min: 10 USDT
   =================================== */

const DB = {
    KEYS: {
        USER_DATA: 'noz_user_data',
        NOZ_BALANCE: 'noz_balance',
        KFCY_BALANCE: 'kfcy_balance',
        REFERRALS: 'noz_referrals',
        LAST_AD_WATCH: 'noz_last_ad_watch',
        REFERRED: 'noz_referred',
        REFERRER_ID: 'noz_referrer_id',
        TOTAL_EARNED: 'noz_total_earned'
    },

    API_URL: 'https://your-backend-api.com',

    initUser(telegramUser) {
        let userData = this.getUser();
        
        if (!userData || userData.id !== telegramUser.id) {
            userData = {
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
                photo_url: telegramUser.photo_url,
                noz_balance: 0,
                kfcy_balance: 0,
                total_earned: 0,
                referrals_count: 0,
                joined_date: new Date().toISOString(),
                last_login: new Date().toISOString()
            };
            
            this.saveUser(userData);
            console.log('Nouvel utilisateur créé:', userData);
        } else {
            userData.last_login = new Date().toISOString();
            this.saveUser(userData);
            console.log('Utilisateur existant chargé:', userData);
        }

        this.syncUserWithBackend(userData);
        return userData;
    },

    getUser() {
        const data = localStorage.getItem(this.KEYS.USER_DATA);
        return data ? JSON.parse(data) : null;
    },

    saveUser(userData) {
        localStorage.setItem(this.KEYS.USER_DATA, JSON.stringify(userData));
    },

    getNozBalance() {
        const user = this.getUser();
        return user ? user.noz_balance : 0;
    },

    updateNozBalance(amount, add = true) {
        const user = this.getUser();
        if (!user) return false;

        if (add) {
            user.noz_balance += amount;
            user.total_earned += amount;
        } else {
            if (user.noz_balance < amount) return false;
            user.noz_balance -= amount;
        }

        this.saveUser(user);
        this.syncBalanceWithBackend('noz', user.noz_balance);
        return true;
    },

    getKfcyBalance() {
        const user = this.getUser();
        return user ? user.kfcy_balance : 0;
    },

    updateKfcyBalance(amount, add = true) {
        const user = this.getUser();
        if (!user) return false;

        if (add) {
            user.kfcy_balance += amount;
        } else {
            if (user.kfcy_balance < amount) return false;
            user.kfcy_balance -= amount;
        }

        this.saveUser(user);
        this.syncBalanceWithBackend('kfcy', user.kfcy_balance);
        return true;
    },

    getReferrals() {
        const data = localStorage.getItem(this.KEYS.REFERRALS);
        return data ? JSON.parse(data) : [];
    },

    addReferral(referralData) {
        const referrals = this.getReferrals();
        
        const exists = referrals.find(r => r.id === referralData.id);
        if (exists) {
            console.log('Parrainage déjà existant');
            return false;
        }

        referrals.push({
            id: referralData.id,
            first_name: referralData.first_name,
            last_name: referralData.last_name || '',
            photo_url: referralData.photo_url,
            earned: 0.5, // 0.5 NOZ par parrainage
            joined: new Date().toISOString()
        });

        localStorage.setItem(this.KEYS.REFERRALS, JSON.stringify(referrals));

        const user = this.getUser();
        if (user) {
            user.referrals_count = referrals.length;
            this.saveUser(user);
        }

        // Créditer 0.5 NOZ
        this.updateNozBalance(0.5, true);
        this.syncReferralWithBackend(referralData);

        return true;
    },

    canWatchAd() {
        const lastWatch = localStorage.getItem(this.KEYS.LAST_AD_WATCH);
        if (!lastWatch) return true;

        const today = new Date().toDateString();
        return lastWatch !== today;
    },

    recordAdWatch(reward = 100) {
        const today = new Date().toDateString();
        localStorage.setItem(this.KEYS.LAST_AD_WATCH, today);
        
        this.updateKfcyBalance(reward, true);
        this.syncAdWatchWithBackend(reward);

        return true;
    },

    getLastAdWatch() {
        return localStorage.getItem(this.KEYS.LAST_AD_WATCH);
    },

    isReferred() {
        return localStorage.getItem(this.KEYS.REFERRED) === 'true';
    },

    getReferrerId() {
        return localStorage.getItem(this.KEYS.REFERRER_ID);
    },

    /**
     * Convertit NOZ en Telegram Stars
     * 1 NOZ = 1 ⭐
     */
    convertNozToStars(nozAmount) {
        return (nozAmount / 0.001) * 0.5;
    },

    /**
     * Convertit KFCY en USDT
     * ⚠️ NOUVEAU TAUX: 100 KFCY = 0.01 USDT
     */
    convertKfcyToUsdt(kfcyAmount) {
        return (kfcyAmount / 100) * 0.01;
    },

    /**
     * Vérifie si un retrait est possible
     */
    canWithdraw(type, amount) {
        const result = {
            success: false,
            message: '',
            equivalent: 0
        };

        if (type === 'NOZ') {
            const stars = this.convertNozToStars(amount);
            const balance = this.getNozBalance();

            if (stars < 25) {
                result.message = `Solde insuffisant pour une demande de retrait. Minimum requis: 25⭐ (vous avez ${stars.toFixed(2)}⭐)`;
                return result;
            }

            if (amount > balance) {
                const missing = (amount - balance).toFixed(2);
                result.message = `Solde insuffisant pour une demande de retrait. Il vous manque ${missing} NOZ`;
                return result;
            }

            result.success = true;
            result.equivalent = stars;

        } else if (type === 'KFCY') {
            const usdt = this.convertKfcyToUsdt(amount);
            const balance = this.getKfcyBalance();

            // ⚠️ NOUVEAU MINIMUM: 10 USDT
            if (usdt < 10) {
                result.message = `Solde insuffisant pour une demande de retrait. Minimum requis: 10 USDT (vous avez ${usdt.toFixed(2)} USDT)`;
                return result;
            }

            if (amount > balance) {
                const missing = (amount - balance).toFixed(0);
                result.message = `Solde insuffisant pour une demande de retrait. Il vous manque ${missing} KFCY`;
                return result;
            }

            result.success = true;
            result.equivalent = usdt;
        }

        return result;
    },

    processWithdrawal(type, amount) {
        if (type === 'NOZ') {
            return this.updateNozBalance(amount, false);
        } else if (type === 'KFCY') {
            return this.updateKfcyBalance(amount, false);
        }
        return false;
    },

    resetAllData() {
        Object.values(this.KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        console.log('Toutes les données ont été réinitialisées');
    },

    // Fonctions de synchronisation Backend
    async syncUserWithBackend(userData) {
        try {
            const response = await fetch(`${this.API_URL}/api/user/sync`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Utilisateur synchronisé:', data);
                if (data.user) this.saveUser(data.user);
            }
        } catch (error) {
            console.error('Erreur sync utilisateur:', error);
        }
    },

    async syncBalanceWithBackend(type, balance) {
        try {
            const user = this.getUser();
            if (!user) return;

            await fetch(`${this.API_URL}/api/balance/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    type: type,
                    balance: balance
                })
            });
        } catch (error) {
            console.error('Erreur sync solde:', error);
        }
    },

    async syncReferralWithBackend(referralData) {
        try {
            const user = this.getUser();
            if (!user) return;

            await fetch(`${this.API_URL}/api/referral/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    referrer_id: user.id,
                    referred_id: referralData.id,
                    referred_data: referralData
                })
            });
        } catch (error) {
            console.error('Erreur sync parrainage:', error);
        }
    },

    async syncAdWatchWithBackend(reward) {
        try {
            const user = this.getUser();
            if (!user) return;

            await fetch(`${this.API_URL}/api/ad/watch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    reward: reward,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (error) {
            console.error('Erreur sync pub:', error);
        }
    },

    async fetchFromBackend() {
        try {
            const user = this.getUser();
            if (!user) return null;

            const response = await fetch(`${this.API_URL}/api/user/${user.id}`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Erreur récupération backend:', error);
        }
        return null;
    }
};

window.DB = DB;