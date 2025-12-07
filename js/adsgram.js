/* ===================================
   NOZ WebApp - AdsGram Integration RÉELLE
   Intégration complète du SDK AdsGram
   =================================== */

const ADSGRAM_CONFIG = {
    blockId: 'YOUR_ADSGRAM_BLOCK_ID', // ⚠️ REMPLACER PAR TON VRAI BLOCK ID
    enabled: true,
    reward: 100,
    debug: true // ⚠️ METTRE false EN PRODUCTION
};

let adsGramController = null;
let isAdsGramReady = false;

/**
 * Initialise AdsGram SDK - VERSION RÉELLE
 */
async function initAdsGram() {
    if (!ADSGRAM_CONFIG.enabled) {
        console.log('AdsGram désactivé');
        return false;
    }

    try {
        // Charger le SDK AdsGram
        await loadAdsGramScript();
        
        // Attendre que le SDK soit prêt
        await waitForAdsGram();
        
        // Initialiser le contrôleur
        setupAdsGramController();
        
        console.log('✅ AdsGram SDK initialisé avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur initialisation AdsGram:', error);
        return false;
    }
}

/**
 * Charge le script AdsGram depuis leur CDN
 */
function loadAdsGramScript() {
    return new Promise((resolve, reject) => {
        // Vérifier si déjà chargé
        if (window.Adsgram) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://sad.adsgram.ai/js/sad.min.js';
        script.async = true;
        
        script.onload = () => {
            console.log('✅ Script AdsGram chargé');
            resolve();
        };
        
        script.onerror = () => {
            reject(new Error('Impossible de charger le script AdsGram'));
        };
        
        document.head.appendChild(script);
    });
}

/**
 * Attend que l'objet Adsgram soit disponible
 */
function waitForAdsGram() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 50; // 5 secondes max
        
        const checkInterval = setInterval(() => {
            attempts++;
            
            if (window.Adsgram) {
                clearInterval(checkInterval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                reject(new Error('Timeout: AdsGram SDK non disponible'));
            }
        }, 100);
    });
}

/**
 * Configure le contrôleur AdsGram
 */
function setupAdsGramController() {
    if (!window.Adsgram) {
        throw new Error('AdsGram SDK non disponible');
    }

    try {
        // Initialiser avec ton Block ID
        adsGramController = window.Adsgram.init({
            blockId: ADSGRAM_CONFIG.blockId,
            debug: ADSGRAM_CONFIG.debug
        });

        isAdsGramReady = true;
        console.log('✅ Contrôleur AdsGram prêt');
        
    } catch (error) {
        console.error('❌ Erreur contrôleur AdsGram:', error);
        throw error;
    }
}

/**
 * Affiche une publicité AdsGram RÉELLE
 */
async function showAdsGramAd() {
    console.log('🎬 Tentative d\'affichage publicité AdsGram...');
    
    if (!isAdsGramReady || !adsGramController) {
        console.error('❌ AdsGram non initialisé');
        throw {
            code: 'NOT_INITIALIZED',
            message: 'AdsGram n\'est pas initialisé. Vérifiez votre Block ID.'
        };
    }

    try {
        // Afficher la pub avec le SDK RÉEL
        await adsGramController.show();
        
        console.log('✅ Publicité visionnée avec succès');
        
        return {
            success: true,
            reward: ADSGRAM_CONFIG.reward
        };
        
    } catch (error) {
        console.error('❌ Erreur AdsGram:', error);
        
        // Gérer les erreurs spécifiques d'AdsGram
        if (error && error.error) {
            const errorCode = error.error;
            
            if (errorCode === 'AdBlock') {
                throw {
                    code: 'ADBLOCK',
                    message: 'Veuillez désactiver votre bloqueur de publicités'
                };
            }
            
            if (errorCode === 'NotFound') {
                throw {
                    code: 'NO_AD',
                    message: 'Aucune publicité disponible pour le moment. Réessayez plus tard.'
                };
            }
            
            if (errorCode === 'InvalidBlockId') {
                throw {
                    code: 'INVALID_BLOCK',
                    message: 'Configuration incorrecte. Contactez l\'administrateur.'
                };
            }
        }
        
        throw {
            code: 'UNKNOWN_ERROR',
            message: 'Erreur lors du chargement de la publicité'
        };
    }
}

/**
 * Vérifie si AdsGram est prêt
 */
function isAdsGramAvailable() {
    return isAdsGramReady && adsGramController !== null;
}

/**
 * Obtient le Block ID configuré
 */
function getBlockId() {
    return ADSGRAM_CONFIG.blockId;
}

/**
 * Change le Block ID (utile pour les tests)
 */
function setBlockId(newBlockId) {
    ADSGRAM_CONFIG.blockId = newBlockId;
    isAdsGramReady = false;
    adsGramController = null;
    
    console.log('⚙️ Block ID mis à jour:', newBlockId);
    
    // Réinitialiser
    return initAdsGram();
}

/**
 * Active le mode debug
 */
function enableDebug() {
    ADSGRAM_CONFIG.debug = true;
    console.log('🐛 Mode debug AdsGram activé');
}

/**
 * Désactive le mode debug
 */
function disableDebug() {
    ADSGRAM_CONFIG.debug = false;
    console.log('🐛 Mode debug AdsGram désactivé');
}

/**
 * Obtient les infos AdsGram
 */
function getAdsGramInfo() {
    return {
        blockId: ADSGRAM_CONFIG.blockId,
        enabled: ADSGRAM_CONFIG.enabled,
        ready: isAdsGramReady,
        reward: ADSGRAM_CONFIG.reward,
        debug: ADSGRAM_CONFIG.debug
    };
}

// Initialiser automatiquement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initAdsGram().then(success => {
            if (success) {
                console.log('✅ AdsGram prêt à l\'emploi');
            } else {
                console.warn('⚠️ AdsGram non disponible');
            }
        });
    });
} else {
    initAdsGram().then(success => {
        if (success) {
            console.log('✅ AdsGram prêt à l\'emploi');
        } else {
            console.warn('⚠️ AdsGram non disponible');
        }
    });
}

// Export global
window.AdsGram = {
    init: initAdsGram,
    show: showAdsGramAd,
    isAvailable: isAdsGramAvailable,
    getInfo: getAdsGramInfo,
    setBlockId: setBlockId,
    enableDebug: enableDebug,
    disableDebug: disableDebug,
    getBlockId: getBlockId
};

/* ===================================
   📋 GUIDE D'UTILISATION
   =================================== */

/*
1. OBTENIR TON BLOCK ID :
   - Va sur https://adsgram.ai/
   - Connecte-toi avec ton compte Telegram
   - Crée une nouvelle app
   - Copie ton Block ID
   - Remplace 'YOUR_ADSGRAM_BLOCK_ID' ci-dessus

2. TESTER EN LOCAL :
   - Met debug: true temporairement
   - Vérifie la console pour les logs
   - Teste l'affichage des pubs

3. EN PRODUCTION :
   - Met debug: false
   - Vérifie que ton Block ID est correct
   - Teste sur plusieurs appareils

4. UTILISATION DANS TON CODE :
   
   // Vérifier si disponible
   if (window.AdsGram.isAvailable()) {
       // Afficher une pub
       window.AdsGram.show()
           .then(result => {
               console.log('Pub vue, récompense:', result.reward);
           })
           .catch(error => {
               console.error('Erreur:', error.message);
           });
   }

5. GESTION DES ERREURS :
   - ADBLOCK : L'utilisateur a un bloqueur de pub
   - NO_AD : Aucune pub disponible actuellement
   - INVALID_BLOCK : Ton Block ID est incorrect
   - NOT_INITIALIZED : AdsGram pas encore prêt

⚠️ IMPORTANT :
- Ne jamais commiter ton vrai Block ID sur GitHub
- Utiliser des variables d'environnement en production
- Tester avec de vrais utilisateurs Telegram
*/