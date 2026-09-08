// ============================================================
// ui.js – UI & PWA
// ============================================================

function toggleDark() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('kok_dark_mode', isDark);
    render();
}

// Φόρτωση dark mode
(function loadDarkMode() {
    const dark = localStorage.getItem('kok_dark_mode') === 'true';
    if (dark) document.body.classList.add('dark');
})();

// ============================================================
// TOAST
// ============================================================
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timeout);
    t._timeout = setTimeout(() => t.classList.remove('show'), 2000);
}

// ============================================================
// PWA INSTALL
// ============================================================
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBanner').classList.add('show');
    const btn = document.getElementById('installBtn');
    btn.classList.add('ready');
    btn.style.display = 'flex';
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            document.getElementById('installBanner').classList.remove('show');
            document.getElementById('installBtn').classList.remove('ready');
            deferredPrompt = null;
        });
    }
}

function dismissInstallBanner() {
    document.getElementById('installBanner').classList.remove('show');
}

window.addEventListener('appinstalled', () => {
    document.getElementById('installBanner').classList.remove('show');
    document.getElementById('installBtn').classList.remove('ready');
    showToast('✅ Εφαρμογή εγκαταστάθηκε!');
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('✅ Service Worker εγγεγραμμένος'))
        .catch(err => console.log('❌ Σφάλμα SW:', err));
}

// ============================================================
// ΕΚΚΙΝΗΣΗ
// ============================================================
async function loadExternalData() {
    try {
        const [signsRes, otaRes] = await Promise.all([
            fetch('signs-data.json'),
            fetch('ota-data.json')
        ]);
        if (signsRes.ok) signImageMap = await signsRes.json();
        if (otaRes.ok) {
            otaList = await otaRes.json();
            // Η detectLocation() καλείται ΜΟΝΟ με το κουμπί – όχι αυτόματα
        }
    } catch (e) {
        console.warn('Δεν φορτώθηκαν τα εξωτερικά αρχεία:', e);
    }
    loadSavedAddress();
    render();
    const otaInput = document.getElementById('otaSearchInput');
    if (otaInput && otaInput.value) onOtaSearch();
}

// Σμίκρυνση header
const header = document.querySelector('.header');
let isShrunk = false;
let ticking = false;

window.addEventListener('scroll', () => {
    if (!ticking) {
        window.requestAnimationFrame(() => {
            const scrollY = window.scrollY;
            if (scrollY > 40 && !isShrunk) {
                header.classList.add('shrink');
                isShrunk = true;
            } else if (scrollY <= 40 && isShrunk) {
                header.classList.remove('shrink');
                isShrunk = false;
            }
            ticking = false;
        });
        ticking = true;
    }
}, { passive: true });

console.log('Φορτώθηκαν ' + data.length + ' παραβάσεις (v23 - με lightbox πρώτων βοηθειών)');
loadExternalData();

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').select();
    }
    if (e.key === 'Escape') {
        clearSearch();
    }
});

// ============================================================
// LAZY LOADING ΓΙΑ ΠΡΩΤΕΣ ΒΟΗΘΕΙΕΣ (lightbox)
// ============================================================
function loadFirstAid() {
    return new Promise((resolve, reject) => {
        if (document.getElementById('firstAidScript')) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.id = 'firstAidScript';
        script.src = 'first-aid.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Το κουμπί στο header καλεί την openFirstAidLightbox() απευθείας,
// οπότε αυτή η συνάρτηση είναι περιττή – την αφήνω για συμβατότητα.
async function openFirstAidModal() {
    await loadFirstAid();
    if (typeof window.openFirstAidLightbox === 'function') {
        window.openFirstAidLightbox();
    } else {
        // Fallback
        document.getElementById('firstAidLightbox').style.display = 'flex';
    }
}