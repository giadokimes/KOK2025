// ============================================================
// ui.js – UI & PWA (v25.2)
// + Auto-suggest dropdown (Φάση E)
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
    if (!t) return;
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
// AUTO-SUGGEST DROPDOWN (v25.2 — Φάση E)
// ============================================================
(function initAutoSuggest() {
    const input = document.getElementById('searchInput');
    const dropdown = document.getElementById('suggestDropdown');
    if (!input || !dropdown) return;

    let hideTimeout = null;

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, c => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;',
            '"': '&quot;', "'": '&#39;'
        }[c]));
    }

    function renderSuggestions(query) {
        if (!query || query.length < 2) {
            hideDropdown();
            return;
        }

        const sug = (typeof getSuggestions === 'function')
            ? getSuggestions(query)
            : { scenarios: [], keywords: [], violations: [] };

        const total = sug.scenarios.length + sug.keywords.length + sug.violations.length;
        if (total === 0) {
            hideDropdown();
            return;
        }

        let html = '';

        // Scenarios
        if (sug.scenarios.length > 0) {
            html += '<div class="suggest-section">';
            html += '<div class="suggest-label">🎯 Σενάριο</div>';
            sug.scenarios.forEach((s, idx) => {
                html += `
                    <button class="suggest-item scenario" 
                            data-scenario-idx="${idx}"
                            data-scenario-ids="${escapeHtml(JSON.stringify(s.ids))}"
                            data-scenario-label="${escapeHtml(s.label)}">
                        <span class="item-icon">${(typeof icon === 'function' ? icon('target', 'icon-svg') : '') || '🎯'}</span>
                        <span class="item-text">${escapeHtml(s.label)}</span>
                    </button>
                `;
            });
            html += '</div>';
        }

        // Violations
        if (sug.violations.length > 0) {
            html += '<div class="suggest-section">';
            html += '<div class="suggest-label">📋 Παραβάσεις</div>';
            sug.violations.forEach(v => {
                const fine = typeof v.fine === 'number' ? v.fine + '€' : v.fine;
                html += `
                    <button class="suggest-item" data-violation-id="${v.id}">
                        <span class="item-icon">${(typeof icon === 'function' ? icon('fileText', 'icon-svg') : '') || '📋'}</span>
                        <span class="item-text">${escapeHtml(v.name)}</span>
                        <span class="item-meta">${escapeHtml(fine)}</span>
                    </button>
                `;
            });
            html += '</div>';
        }

        // Keywords
        if (sug.keywords.length > 0) {
            html += '<div class="suggest-section">';
            html += '<div class="suggest-label">🔑 Λέξεις-κλειδιά</div>';
            html += '<div class="suggest-keywords">';
            sug.keywords.forEach(kw => {
                html += `<button class="keyword-chip" data-keyword="${escapeHtml(kw)}">${escapeHtml(kw)}</button>`;
            });
            html += '</div></div>';
        }

        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    }

    function hideDropdown() {
        dropdown.style.display = 'none';
    }

    // Event delegation — αποφεύγει inline handlers με JSON
    dropdown.addEventListener('click', (e) => {
        const scenarioBtn = e.target.closest('[data-scenario-ids]');
        if (scenarioBtn) {
            try {
                const ids = JSON.parse(scenarioBtn.dataset.scenarioIds);
                const label = scenarioBtn.dataset.scenarioLabel;
                applyScenario(ids, label);
            } catch (err) {
                console.warn('Scenario parse error:', err);
            }
            return;
        }

        const violationBtn = e.target.closest('[data-violation-id]');
        if (violationBtn) {
            const id = parseInt(violationBtn.dataset.violationId, 10);
            focusViolation(id);
            return;
        }

        const keywordBtn = e.target.closest('[data-keyword]');
        if (keywordBtn) {
            applyKeyword(keywordBtn.dataset.keyword);
            return;
        }
    });

    // Debounced input
    let inputTimeout = null;
    input.addEventListener('input', () => {
        clearTimeout(inputTimeout);
        inputTimeout = setTimeout(() => {
            renderSuggestions(input.value.trim());
        }, 200);
    });

    // Focus → show if has value
    input.addEventListener('focus', () => {
        if (input.value.trim().length >= 2) {
            renderSuggestions(input.value.trim());
        }
    });

    // Blur → hide (with delay για να προλάβει το click)
    input.addEventListener('blur', () => {
        hideTimeout = setTimeout(hideDropdown, 200);
    });

    // Click σε dropdown → ακύρωσε το blur hide
    dropdown.addEventListener('mousedown', () => {
        clearTimeout(hideTimeout);
    });

    // Escape
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideDropdown();
        }
    });

    // Κλείσιμο όταν αλλάζει φίλτρο / sort
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== input) {
            hideDropdown();
        }
    }, true);
})();

// ============================================================
// ACTIONS από auto-suggest
// ============================================================
function focusViolation(id) {
    const dropdown = document.getElementById('suggestDropdown');
    if (dropdown) dropdown.style.display = 'none';

    expandedCards[id] = true;
    visibleCount = Math.max(visibleCount, PAGE_SIZE);
    render();

    setTimeout(() => {
        const el = document.querySelector(`.violation-card .select-check[data-id="${id}"]`);
        if (el) {
            const card = el.closest('.violation-card');
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.style.transition = 'box-shadow 0.3s';
            card.style.boxShadow = '0 0 0 3px var(--blue-light)';
            setTimeout(() => { card.style.boxShadow = ''; }, 1500);
        }
    }, 150);
}

function applyScenario(ids, label) {
    const dropdown = document.getElementById('suggestDropdown');
    if (dropdown) dropdown.style.display = 'none';

    ids.forEach(id => { expandedCards[id] = true; });
    render();

    if (ids.length > 0) focusViolation(ids[0]);
}

function applyKeyword(kw) {
    const dropdown = document.getElementById('suggestDropdown');
    if (dropdown) dropdown.style.display = 'none';

    if (typeof setKeyword === 'function') {
        setKeyword(kw);
    }
}
function showAllResults() {
    const dropdown = document.getElementById('suggestDropdown');
    if (dropdown) dropdown.style.display = 'none';
    // Το render() διαβάζει την τρέχουσα τιμή του input και δείχνει όλα
    if (typeof render === 'function') render();
    if (typeof updateBodyPadding === 'function') updateBodyPadding();
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

console.log('Φορτώθηκαν ' + data.length + ' παραβάσεις (v25.2 - auto-suggest)');
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
        const dd = document.getElementById('suggestDropdown');
        if (dd) dd.style.display = 'none';
    }
});
