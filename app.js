// ============================================================
// app.js – ΚΥΡΙΕΣ ΣΥΝΑΡΤΗΣΕΙΣ (v24)
// ============================================================

const categoryIcons = {
    'στάθμευση': 'parkingCircle',
    'κίνηση': 'car',
    'σήμανση': 'signpost',
    'ταχύτητα': 'gauge',
    'ασφάλεια': 'shield',
    'έγγραφα': 'fileText',
    'φορτηγά': 'truck',
    'δίκυκλα': 'motorcycle',
    'ΕΠΗΟ': 'scooter',
    'επαγγελματικά': 'briefcase',
    'αλκοόλ': 'wineBottle',
    'υποτροπή': 'rotateLeft'
};

let currentFilter = 'all';
let showFavorites = false;
let favorites = JSON.parse(localStorage.getItem('kok_favorites')) || {};
let openDescriptions = {};

// ------------------------------------------------------------
// ΑΣΦΑΛΗΣ WRAPPER: αν το signs.js δεν έχει φορτώσει ή έχει σπάσει,
// η κάρτα δείχνει σκέτο το όνομα αντί να σπάσει όλο το render.
// ------------------------------------------------------------
function safeReplaceSignCodes(text, id) {
    try {
        if (typeof replaceSignCodes === 'function' &&
            typeof signImageMap !== 'undefined' &&
            signImageMap &&
            typeof signImageMap === 'object') {
            return replaceSignCodes(text, id);
        }
    } catch (e) {
        console.warn('signReplace:', e);
    }
    return text;
}

// ============================================================
// RENDER
// ============================================================
function render() {
    if (typeof data === 'undefined' || !Array.isArray(data) || data.length === 0) {
        const container = document.getElementById('listContainer');
        if (container) {
            container.innerHTML = `<div class="empty"><span class="icon">⏳</span>Φόρτωση δεδομένων...</div>`;
        }
        return;
    }

    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const container = document.getElementById('listContainer');
    const countEl = document.getElementById('countText');
    const favIndicator = document.getElementById('favIndicator');
    const favCount = document.getElementById('favCount');

    let filtered = data.filter(v => {
        if (showFavorites && !favorites[v.id]) return false;
        if (currentFilter !== 'all' && v.category !== currentFilter) return false;
        if (query) {
            const searchable = (v.name + ' ' + v.article + ' ' + v.category + ' ' + v.details + ' ' + (v.fullDescription || '')).toLowerCase();
            if (!searchable.includes(query)) return false;
        }
        return true;
    });

    const total = data.length;
    const favsCount = getFavorites().length;
    countEl.textContent = filtered.length + ' από ' + total + ' παραβάσεις';
    if (showFavorites) {
        favIndicator.style.display = 'inline';
        favCount.textContent = favsCount;
    } else {
        favIndicator.style.display = 'none';
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty"><span class="icon">🔍</span>Δεν βρέθηκαν παραβάσεις<br><span style="font-size:13px;">Δοκίμασε άλλη λέξη-κλειδί</span></div>`;
        return;
    }

    container.innerHTML = filtered.map(v => {
        const halfBadge = v.half ? '<span class="badge-half">½ για μοτοσικλέτα</span>' : '';
        const criminalBadge = v.criminal ? '<span class="badge-criminal">ΠΛΗΜΜΕΛΗΜΑ</span>' : '';
        const isDescOpen = openDescriptions[v.id] || false;

        const iconName = categoryIcons[v.category] || 'alertTriangle';
        const iconSvg = icon(iconName, 'icon-svg');

        let priceColor = 'var(--red)';
        if (v.criminal) {
            priceColor = 'var(--red)';
        } else if (v.suspend && v.suspend !== '-') {
            const lower = v.suspend.toLowerCase();
            if (lower.includes('180') || lower.includes('1 έτος') || lower.includes('μήνες')) priceColor = 'var(--red)';
            else if (lower.includes('70') || lower.includes('90')) priceColor = 'var(--red-light)';
            else if (lower.includes('40') || lower.includes('60')) priceColor = 'var(--orange)';
            else if (lower.includes('20') || lower.includes('30')) priceColor = 'var(--orange-dark)';
            else priceColor = 'var(--orange)';
        }

        const fineDisplay = typeof v.fine === 'number' ? v.fine + '€' : v.fine;

        return `
        <div class="violation-card">
            <div class="card-top">
                <input type="checkbox" class="select-check" data-id="${v.id}" onchange="toggleSelection(${v.id})" ${selectedIds.has(v.id) ? 'checked' : ''}>
                <div class="card-icon">${iconSvg}</div>
                <div class="card-main">
                    <div class="card-title">${safeReplaceSignCodes(v.name, v.id)} ${criminalBadge}</div>
                </div>
                <div class="card-price-wrap">
                    <div class="card-price" style="color:${priceColor};">${fineDisplay}</div>
                    ${halfBadge}
                </div>
                <button class="favorite-btn ${favorites[v.id] ? 'active' : ''}" onclick="toggleFavorite(${v.id})" aria-label="Αγαπημένο">
                    ${favorites[v.id] ? icon('starFilled', 'icon-svg') : icon('starOutline', 'icon-svg')}
                </button>
            </div>
            <div class="card-divider"></div>
            <div class="card-details">
                ${v.suspend && v.suspend !== '-' ? `
                <div class="detail-item">
                    <span class="label">Αφαιρέσεις</span>
                    <span class="value">${v.suspend}</span>
                </div>
                ` : `
                <div class="detail-item">
                    <span class="label">Αφαιρέσεις</span>
                    <span class="value">—</span>
                </div>
                `}
                ${v.points > 0 ? `
                <div class="detail-item">
                    <span class="label">ΣΕΣΟ</span>
                    <span class="value purple">${v.points} βαθμοί</span>
                </div>
                ` : `
                <div class="detail-item">
                    <span class="label">ΣΕΣΟ</span>
                    <span class="value">—</span>
                </div>
                `}
                <div class="detail-item">
                    <span class="label">Άρθρο</span>
                    <span class="value">${v.article}</span>
                </div>
            </div>
            ${v.fullDescription ? `
            <div class="card-footer">
                <button class="details-btn" onclick="toggleDescription(${v.id})">
                    ${isDescOpen ? 'Κλείσε περιγραφή' : 'Λεπτομέρειες'}
                </button>
            </div>
            <div class="card-full-description ${isDescOpen ? 'open' : ''}">
                ${v.fullDescription}
            </div>
            ` : ''}
        </div>
    `}).join('');

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.ota-input-wrap')) {
            const suggestions = document.getElementById('otaSuggestions');
            if (suggestions) suggestions.classList.remove('show');
        }
    });
}

// ============================================================
// FILTERS & FAVORITES
// ============================================================
function setFilter(filter) {
    if (filter === currentFilter) {
        currentFilter = 'all';
        document.querySelectorAll('.filters button').forEach(b => {
            b.classList.toggle('active', b.dataset.filter === 'all');
        });
    } else {
        currentFilter = filter;
        document.querySelectorAll('.filters button').forEach(b => {
            b.classList.toggle('active', b.dataset.filter === filter);
        });
    }
    render();
}

function toggleFavorite(id) {
    favorites[id] = !favorites[id];
    localStorage.setItem('kok_favorites', JSON.stringify(favorites));
    render();
    showToast(favorites[id] ? 'Προστέθηκε στα αγαπημένα' : 'Αφαιρέθηκε από τα αγαπημένα');
}

function toggleFavorites() {
    showFavorites = !showFavorites;
    document.getElementById('favIndicator').style.display = showFavorites ? 'inline' : 'none';
    render();
}

function toggleDescription(id) {
    openDescriptions[id] = !openDescriptions[id];
    render();
}

function getFavorites() {
    return data.filter(v => favorites[v.id]);
}

function exportFavorites() {
    const favs = getFavorites();
    if (favs.length === 0) {
        showToast('Δεν έχετε επιλέξει αγαπημένες παραβάσεις.');
        return;
    }
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        showToast('Άνοιξε ένα popup για να συνεχίσεις.');
        return;
    }
    const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Αγαπημένες Παραβάσεις ΚΟΚ</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 30px; max-width: 900px; margin: auto; color: #0f172a; }
        h1 { color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; }
        .sub { color: #555; margin-bottom: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid; }
        .card .name { font-weight: bold; font-size: 16px; }
        .card .article { color: #555; font-size: 14px; }
        .card .det { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 4px; }
        .card .det .fine { color: #c00; font-weight: bold; }
        .card .det .suspend { color: #00c; font-weight: 500; }
        .card .det .points { color: #7c3aed; }
        .card .p-ota { font-size: 13px; color: #555; margin-top: 4px; }
        .card .desc { margin-top: 6px; background: #f5f5f5; padding: 8px 10px; border-radius: 6px; font-size: 14px; }
        .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print { .no-print { display: none; } body { padding: 20px; } }
    </style>
    </head>
    <body>
        <h1>Αγαπημένες Παραβάσεις Κ.Ο.Κ.</h1>
        <p class="sub">Εξαγωγή από την εφαρμογή «ΚΟΚ – Τσέπης v24» — ${new Date().toLocaleDateString()}</p>
        ${favs.map(v => {
            const ota = selectedOta;
            return `
            <div class="card">
                <div class="name">${safeReplaceSignCodes(v.name)}</div>
                <div class="article">Άρθρο: ${v.article}</div>
                <div class="det">
                    <span class="fine">Πρόστιμο: ${typeof v.fine === 'number' ? v.fine + '€' : v.fine}</span>
                    ${v.suspend && v.suspend !== '-' ? `<span class="suspend">Κύρωση: ${v.suspend}</span>` : ''}
                    ${v.points > 0 ? `<span class="points">Βαθμοί ΣΕΣΟ: ${v.points}</span>` : ''}
                </div>
                ${ota ? `<div class="p-ota">Κωδικός ΟΤΑ: ${ota.name} (${ota.code})</div>` : ''}
                ${v.fullDescription ? `<div class="desc">${v.fullDescription}</div>` : ''}
            </div>
        `}).join('')}
        <div class="footer">Πατήστε Ctrl+P ή επιλέξτε «Εκτύπωση» για να αποθηκεύσετε ως PDF.</div>
        <div class="no-print" style="text-align:center;margin-top:20px;">
            <button onclick="window.print()" style="padding:10px 30px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;">Εκτύπωση / Αποθήκευση ως PDF</button>
        </div>
    </body>
    </html>
    `;
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
}

// ============================================================
// SELECTION
// ============================================================
const selectedIds = new Set();

function toggleSelection(id) {
    if (selectedIds.has(id)) {
        selectedIds.delete(id);
    } else {
        selectedIds.add(id);
    }
    updateSelectionUI();
    render();
}

function updateSelectionUI() {
    const footer = document.getElementById('selectionFooter');
    const countEl = document.getElementById('selectedCount');
    const namesEl = document.getElementById('selectedNames');
    const count = selectedIds.size;
    if (count === 0) {
        footer.classList.remove('show');
        return;
    }
    footer.classList.add('show');
    countEl.textContent = count;
    const selected = data.filter(v => selectedIds.has(v.id));
    const names = selected.map(v => v.name).slice(0, 3);
    let namesText = names.join(', ');
    if (selected.length > 3) {
        namesText += ` +${selected.length - 3} ακόμα`;
    }
    namesEl.textContent = namesText;
}

function clearSelection() {
    selectedIds.clear();
    updateSelectionUI();
    render();
}

function calculateTotalFine(selected) {
    const hasTruck = selected.some(v => v.category === 'φορτηγά');
    if (hasTruck) {
        return selected.reduce((sum, v) => sum + (typeof v.fine === 'number' ? v.fine : 0), 0);
    } else {
        const fines = selected.map(v => typeof v.fine === 'number' ? v.fine : 0);
        const maxFine = Math.max(...fines, 0);
        let total = 0;
        let maxUsed = false;
        for (const f of fines) {
            if (f === maxFine && !maxUsed) {
                total += f;
                maxUsed = true;
            } else {
                total += f / 2;
            }
        }
        return total;
    }
}

function calculateSuspension(selected) {
    let daysLicense = 0;
    let daysDocuments = 0;
    for (const v of selected) {
        if (!v.suspend || v.suspend === '-') continue;
        const text = v.suspend;
        const licenseMatch = text.match(/(\d+)\s*ημέρες?\s*αδ\.\s*οδ\./i) || text.match(/(\d+)\s*ημ\.\s*αδ\.\s*οδ\./i);
        if (licenseMatch) {
            daysLicense += parseInt(licenseMatch[1], 10);
        }
        const docMatch = text.match(/(\d+)\s*ημέρες?\s*στοιχ\.\s*κυκλ\./i) || text.match(/(\d+)\s*ημ\.\s*στοιχ\.\s*κυκλ\./i);
        if (docMatch) {
            daysDocuments += parseInt(docMatch[1], 10);
        }
        const monthMatch = text.match(/(\d+)\s*μήνες?\s*αδ\.\s*οδ\./i);
        if (monthMatch) {
            daysLicense += parseInt(monthMatch[1], 10) * 30;
        }
        const yearMatch = text.match(/(\d+)\s*έτος?\s*αδ\.\s*οδ\./i);
        if (yearMatch) {
            daysLicense += parseInt(yearMatch[1], 10) * 365;
        }
    }
    return { daysLicense, daysDocuments };
}

function calculateTotalPoints(selected) {
    return selected.reduce((sum, v) => sum + (v.points || 0), 0);
}

function exportSelectedToPDF() {
    const selected = data.filter(v => selectedIds.has(v.id));
    if (selected.length === 0) {
        showToast('Δεν έχετε επιλέξει καμία παράβαση.');
        return;
    }

    const totalFine = calculateTotalFine(selected);
    const { daysLicense, daysDocuments } = calculateSuspension(selected);
    const totalPoints = calculateTotalPoints(selected);
    const otaText = selectedOta ? `Κωδικός ΟΤΑ: ${selectedOta.name} (${selectedOta.code})` : '';
    const addressText = localStorage.getItem('kok_last_address') || '';

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        showToast('Άνοιξε ένα popup για να συνεχίσεις.');
        return;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head><title>Βεβαίωση Κλήσης - ΚΟΚ</title>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; padding: 30px; max-width: 900px; margin: auto; color: #0f172a; }
        h1 { color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; }
        .sub { color: #555; margin-bottom: 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 14px; margin-bottom: 12px; page-break-inside: avoid; }
        .card .name { font-weight: bold; font-size: 15px; }
        .card .article { color: #555; font-size: 13px; }
        .card .desc { margin-top: 4px; font-size: 13px; color: #333; }
        .summary { margin-top: 20px; border-top: 2px solid #1e3a5f; padding-top: 15px; }
        .summary table { width: 100%; border-collapse: collapse; }
        .summary td { padding: 6px 0; }
        .summary .label { font-weight: 600; color: #333; }
        .summary .value { text-align: right; font-weight: 700; }
        .summary .fine { color: #c00; }
        .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print { body { padding: 20px; } }
    </style>
    </head>
    <body>
        <h1>Βεβαίωση Κλήσης - Κ.Ο.Κ.</h1>
        <p class="sub">Ημερομηνία: ${new Date().toLocaleDateString()} - Ώρα: ${new Date().toLocaleTimeString()}</p>
        ${otaText ? `<p class="sub">${otaText}</p>` : ''}
        ${addressText ? `<p class="sub">Σημείο ελέγχου: ${addressText}</p>` : ''}
        <p class="sub">Επιλεγμένες παραβάσεις: ${selected.length}</p>
        ${selected.map(v => `
            <div class="card">
                <div class="name">${safeReplaceSignCodes(v.name)}</div>
                <div class="article">Άρθρο: ${v.article}</div>
                <div class="desc">${v.fullDescription || 'Διαθέσιμη περιγραφή'}</div>
                <div style="margin-top:4px;font-size:13px;">
                    <span style="color:#c00;font-weight:bold;">Πρόστιμο: ${typeof v.fine === 'number' ? v.fine + '€' : v.fine}</span>
                    ${v.suspend && v.suspend !== '-' ? ` | Κύρωση: ${v.suspend}` : ''}
                    ${v.points > 0 ? ` | Βαθμοί ΣΕΣΟ: ${v.points}` : ''}
                </div>
            </div>
        `).join('')}
        <div class="summary">
            <h2>Σύνοψη</h2>
            <table>
                <tr><td class="label">Σύνολο Προστίμου</td><td class="value fine">${totalFine.toFixed(2)}€</td></tr>
                <tr><td class="label">Αφαίρεση Άδειας Οδήγησης</td><td class="value">${daysLicense} ημέρες</td></tr>
                <tr><td class="label">Αφαίρεση Στοιχείων Κυκλοφορίας</td><td class="value">${daysDocuments} ημέρες</td></tr>
                <tr><td class="label">Σύνολο Βαθμών ΣΕΣΟ</td><td class="value">${totalPoints} βαθμοί</td></tr>
            </table>
        </div>
        <div class="footer">Πατήστε Ctrl+P ή επιλέξτε «Εκτύπωση» για να αποθηκεύσετε ως PDF.</div>
        <div class="no-print" style="text-align:center;margin-top:20px;">
            <button onclick="window.print()" style="padding:10px 30px;background:#1e3a5f;color:#fff;border:none;border-radius:8px;font-size:16px;cursor:pointer;">Εκτύπωση / Αποθήκευση ως PDF</button>
        </div>
    </body>
    </html>
    `;

    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 500);
}

// ============================================================
// SEARCH
// ============================================================
let searchTimeout = null;

function onSearch() {
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    if (input.value.length > 0) {
        clearBtn.classList.add('visible');
    } else {
        clearBtn.classList.remove('visible');
    }
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        render();
    }, 300);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearBtn').classList.remove('visible');
    render();
    document.getElementById('searchInput').focus();
}

function formatFine(fine) {
    if (typeof fine === 'number') return fine + '€';
    return fine;
}

// ============================================================
// MAKE CALL (global)
// ============================================================
function makeCall() {
    if (confirm('Πατήστε OK για κλήση στο 166 (ΕΚΑΒ) ή Ακύρωση για 112 (Ευρωπαϊκός αριθμός έκτακτης ανάγκης)')) {
        window.location.href = 'tel:166';
    } else {
        window.location.href = 'tel:112';
    }
}