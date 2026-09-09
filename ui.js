// ============================================================
// ui.js – UI & PWA (v24)
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
    t._timeout = setTimeout(() => t.classList.remove('show'), 2500);
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
    if (btn) btn.classList.add('ready');
    // Το install είναι τώρα στο hamburger
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            document.getElementById('installBanner').classList.remove('show');
            deferredPrompt = null;
        });
    }
}

function dismissInstallBanner() {
    document.getElementById('installBanner').classList.remove('show');
}

window.addEventListener('appinstalled', () => {
    document.getElementById('installBanner').classList.remove('show');
    showToast('Εφαρμογή εγκαταστάθηκε!');
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
        .then(() => console.log('Service Worker εγγεγραμμένος'))
        .catch(err => console.log('Σφάλμα SW:', err));
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
        }
    } catch (e) {
        console.warn('Δεν φορτώθηκαν τα εξωτερικά αρχεία:', e);
    }
    loadSavedAddress();
    render();
    const otaInput = document.getElementById('otaSearchInput');
    if (otaInput && otaInput.value) onOtaSearch();
}

// Σμίκρυνση header (απενεργοποιημένη – το νέο design έχει σταθερό header)
// Αφήνουμε μόνο το scroll event για το σμίκρυνμα (δεν το χρειαζόμαστε πλέον)

console.log('Φορτώθηκαν ' + data.length + ' παραβάσεις (v24 - νέο design)');
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

async function openFirstAidLightbox() {
    await loadFirstAid();
    if (typeof window.openFirstAidLightbox === 'function') {
        window.openFirstAidLightbox();
    } else {
        document.getElementById('firstAidLightbox').style.display = 'flex';
    }
}