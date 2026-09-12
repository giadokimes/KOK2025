// ============================================================
// ui.js – UI & PWA (v25)
// ============================================================

// ============================================================
// DARK MODE
// ============================================================
function toggleDark() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('kok_dark_mode', isDark);
    updateBottomNavActive();
    render();
}

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
    updateBottomNavInstallVisibility();
});

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
            deferredPrompt = null;
            updateBottomNavInstallVisibility();
            closeMoreSheet();
        });
    } else {
        showToast('Η εφαρμογή είναι ήδη εγκατεστημένη ή δεν είναι διαθέσιμη.');
    }
}

window.addEventListener('appinstalled', () => {
    showToast('Εφαρμογή εγκαταστάθηκε!');
    updateBottomNavInstallVisibility();
});

// ============================================================
// BOTTOM NAV
// ============================================================
function updateBottomNavActive() {
    const darkBtn = document.getElementById('navDark');
    const favBtn = document.getElementById('navFav');
    if (darkBtn) darkBtn.classList.toggle('active', document.body.classList.contains('dark'));
    if (favBtn) favBtn.classList.toggle('active', showFavorites);
}

function updateBottomNavInstallVisibility() {
    const installRow = document.getElementById('moreSheetInstall');
    if (installRow) {
        installRow.style.display = deferredPrompt ? 'flex' : 'none';
    }
}

function toggleMoreSheet() {
    const sheet = document.getElementById('moreSheet');
    const overlay = document.getElementById('moreSheetOverlay');
    if (!sheet || !overlay) return;
    const isOpen = sheet.classList.contains('open');
    if (isOpen) {
        closeMoreSheet();
    } else {
        sheet.classList.add('open');
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
        updateBottomNavInstallVisibility();
    }
}

function closeMoreSheet() {
    const sheet = document.getElementById('moreSheet');
    const overlay = document.getElementById('moreSheetOverlay');
    if (sheet) sheet.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
}

// ============================================================
// ΑΛΦΑΒΗΤΙΚΟ ΕΥΡΕΤΗΡΙΟ (Bottom Sheet)
// ============================================================
function toggleAlphaSheet() {
    const sheet = document.getElementById('alphaSheet');
    const overlay = document.getElementById('alphaSheetOverlay');
    if (!sheet || !overlay) return;
    const isOpen = sheet.classList.contains('open');
    if (isOpen) {
        closeAlphaSheet();
    } else {
        renderAlphaSheet();
        sheet.classList.add('open');
        overlay.classList.add('show');
        document.body.classList.add('modal-open');
    }
}

function closeAlphaSheet() {
    const sheet = document.getElementById('alphaSheet');
    const overlay = document.getElementById('alphaSheetOverlay');
    if (sheet) sheet.classList.remove('open');
    if (overlay) overlay.classList.remove('show');
    document.body.classList.remove('modal-open');
}

function renderAlphaSheet() {
    const container = document.getElementById('alphaSheetContent');
    if (!container) return;
    if (typeof groupKeywordsByLetter !== 'function') {
        container.innerHTML = '<p style="color:var(--muted);text-align:center;">Το ευρετήριο δεν είναι διαθέσιμο.</p>';
        return;
    }
    const groups = groupKeywordsByLetter();
    const letters = Object.keys(groups);
    if (letters.length === 0) {
        container.innerHTML = '<p style="color:var(--muted);text-align:center;">Δεν βρέθηκαν λέξεις-κλειδιά.</p>';
        return;
    }
    container.innerHTML = letters.map(letter => `
        <div class="alpha-group" data-letter="${letter}">
            <button class="alpha-letter-btn" onclick="toggleAlphaGroup('${letter}')">
                <span class="alpha-letter">${letter}</span>
                <span class="alpha-count">(${groups[letter].length})</span>
                ${icon('chevronRight', 'icon-svg alpha-chevron')}
            </button>
            <div class="alpha-keywords" id="alphaGroup-${letter}" style="display:none;">
                ${groups[letter].map(kw => `
                    <button class="keyword-chip" onclick="selectKeywordFromSheet('${kw}')">${kw}</button>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function toggleAlphaGroup(letter) {
    const group = document.getElementById('alphaGroup-' + letter);
    const btn = document.querySelector(`.alpha-letter-btn[onclick="toggleAlphaGroup('${letter}')"]`);
    if (!group || !btn) return;
    const isOpen = group.style.display !== 'none';
    // Κλείσε όλα τα άλλα
    document.querySelectorAll('.alpha-keywords').forEach(el => { el.style.display = 'none'; });
    document.querySelectorAll('.alpha-letter-btn').forEach(el => el.classList.remove('open'));
    if (!isOpen) {
        group.style.display = 'flex';
        btn.classList.add('open');
    }
}

function selectKeywordFromSheet(keyword) {
    if (typeof setKeyword === 'function') {
        setKeyword(keyword);
    }
    closeAlphaSheet();
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// BODY PADDING (δυναμικό)
// ============================================================
function updateBodyPadding() {
    const bottomNavHeight = 64;
    const selectionVisible = document.getElementById('selectionFooter')?.classList.contains('show') || false;
    const selectionHeight = selectionVisible ? 64 : 0;
    const extra = 20;
    document.body.style.paddingBottom = (bottomNavHeight + selectionHeight + extra) + 'px';
}

window.addEventListener('resize', updateBodyPadding);

// ============================================================
// SERVICE WORKER
// ============================================================
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
    updateBottomNavActive();
    updateBodyPadding();
    const otaInput = document.getElementById('otaSearchInput');
    if (otaInput && otaInput.value) onOtaSearch();
}

console.log('Φορτώθηκαν ' + data.length + ' παραβάσεις (v25 - bottom nav + collapsed cards)');
loadExternalData();

document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('searchInput').focus();
        document.getElementById('searchInput').select();
    }
    if (e.key === 'Escape') {
        closeMoreSheet();
        closeAlphaSheet();
        clearSearch();
    }
});