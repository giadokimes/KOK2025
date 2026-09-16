// ============================================================
// app.js – ΚΥΡΙΕΣ ΣΥΝΑΡΤΗΣΕΙΣ (v25.2)
// Collapsed cards, pagination, sort by severity, bottom nav
// + Greek stemmer, fuzzy, scenarios, per-token synonyms
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

// ============================================================
// GREEK STEMMER (v2) — Αφαιρεί κοινές καταλήξεις για πτώσεις
// ============================================================
const GREEK_SUFFIXES = [
    'ηδες', 'αδες',
    'ους', 'εων', 'ιων', 'εις',
    'ος', 'ου', 'ης', 'ων', 'ες', 'ας', 'οι', 'υς',
    'η', 'α', 'ο', 'ι', 'υ'
];

function stemGreek(word) {
    if (!word || word.length < 5) return word;
    for (const suf of GREEK_SUFFIXES) {
        if (word.length >= suf.length + 3 && word.endsWith(suf)) {
            return word.slice(0, -suf.length);
        }
    }
    return word;
}

// ============================================================
// LEVENSHTEIN (fuzzy) — για typos, μόνο σε λέξεις >= 5 chars
// ============================================================
function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 2) return 99;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost
            );
        }
    }
    return dp[m][n];
}

// ============================================================
// SCENARIO CACHE — υπολογισμός μία φορά ανά query
// ============================================================
let _scenarioCacheKey = null;
let _scenarioCacheValue = null;

function getScenarioMatchesCached(normalizedQuery) {
    if (_scenarioCacheKey === normalizedQuery) return _scenarioCacheValue;
    _scenarioCacheKey = normalizedQuery;
    _scenarioCacheValue = (typeof getScenarioMatches === 'function')
        ? getScenarioMatches(normalizedQuery)
        : new Set();
    return _scenarioCacheValue;
}

// ============================================================
// STOPWORDS (για αναζήτηση)
// ============================================================
const STOPWORDS = new Set([
    'ο', 'η', 'το', 'οι', 'τα', 'του', 'της', 'των', 'τον', 'την', 'τους', 'τις',
    'ενας', 'μια', 'ενα', 'μία', 'ένας', 'ένα',
    'σε', 'με', 'για', 'απο', 'από', 'προς', 'κατα', 'κατά', 'μετα', 'μετά',
    'πριν', 'μεχρι', 'μέχρι', 'επι', 'επί', 'δια', 'διά', 'παρα', 'παρά',
    'περι', 'περί', 'υπο', 'υπό', 'ανα', 'ανά', 'αντι', 'αντί', 'εκτος', 'εκτός',
    'εντος', 'εντός', 'στο', 'στη', 'στην', 'στον', 'στους', 'στις', 'στα',
    'και', 'ή', 'αλλα', 'αλλά', 'ομως', 'όμως', 'ενω', 'ενώ',
    'καθως', 'καθώς', 'ωστε', 'ώστε', 'γιατι', 'γιατί', 'επειδη', 'επειδή',
    'αφου', 'αφού', 'οταν', 'όταν', 'οπου', 'όπου', 'οπως', 'όπως',
    'οτι', 'ότι', 'πως', 'να', 'θα', 'αν', 'μη', 'μην', 'δεν',
    'που', 'αυτο', 'αυτό', 'αυτη', 'αυτή', 'αυτος', 'αυτός', 'αυτα', 'αυτά',
    'αυτες', 'αυτές', 'αυτοι', 'αυτοί', 'οποιος', 'όποιος', 'οποια', 'όποια',
    'οποιο', 'όποιο', 'καθε', 'κάθε', 'καποιος', 'κάποιος', 'καποια', 'κάποια',
    'καποιο', 'κάποιο', 'αλλος', 'άλλος', 'αλλη', 'άλλη', 'αλλο', 'άλλο',
    'πολυ', 'πολύ', 'λιγο', 'λίγο', 'πανω', 'πάνω', 'κατω', 'κάτω',
    'μεσα', 'μέσα', 'εξω', 'έξω', 'μπροστα', 'μπροστά', 'πισω', 'πίσω',
    'διπλα', 'δίπλα', 'κοντα', 'κοντά', 'μακρια', 'μακριά', 'τωρα', 'τώρα',
    'τοτε', 'τότε', 'παντα', 'πάντα', 'ποτε', 'ποτέ', 'ηδη', 'ήδη',
    'ακομα', 'ακόμα', 'μονο', 'μόνο', 'μαζι', 'μαζί', 'χωρις', 'χωρίς',
    'ειναι', 'είναι', 'εχει', 'έχει', 'κανει', 'κάνει', 'γινεται', 'γίνεται',
    'μπορει', 'μπορεί', 'πρεπει', 'πρέπει', 'θελει', 'θέλει',
    'κλπ', 'κ.λπ.', 'κα', 'κ.ά.', 'πχ', 'π.χ.', 'δηλαδη', 'δηλαδή'
]);

// ============================================================
// STATE
// ============================================================
const PAGE_SIZE = 30;
let visibleCount = PAGE_SIZE;
let currentSort = 'severity-asc';
let currentFilter = 'all';
let showFavorites = false;
let activeKeyword = null;
let favorites = JSON.parse(localStorage.getItem('kok_favorites')) || {};
let expandedCards = {};
let openDescriptions = {};
const selectedIds = new Set();

// ============================================================
// SAFE WRAPPERS για signs.js
// ============================================================
function safeReplaceSignCodes(text, id) {
    try {
        if (typeof replaceSignCodes === 'function' &&
            typeof signImageMap !== 'undefined' &&
            signImageMap && typeof signImageMap === 'object') {
            return replaceSignCodes(text, id);
        }
    } catch (e) { console.warn('signReplace:', e); }
    return text;
}

function safeRenderSignIcons(text, id) {
    try {
        if (typeof renderSignIconsRow === 'function' &&
            typeof signImageMap !== 'undefined' &&
            signImageMap && typeof signImageMap === 'object') {
            return renderSignIconsRow(text, id);
        }
    } catch (e) { console.warn('signIcons:', e); }
    return '';
}

function safeStripSignCodes(text) {
    try {
        if (typeof stripSignCodesForDisplay === 'function') {
            return stripSignCodesForDisplay(text);
        }
    } catch (e) { console.warn('signStrip:', e); }
    return text;
}

// ============================================================
// ΑΝΑΖΗΤΗΣΗ — Normalize + Stopwords + Synonyms + Stem + Fuzzy
// ============================================================
function normalizeText(text) {
    if (!text) return '';
    return text.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function removeStopwords(text) {
    return text.split(/\s+/).filter(w => w.length > 0 && !STOPWORDS.has(w)).join(' ');
}

// ============================================================
// QUERY MATCHER (v25.2) — stemmer + per-token synonyms + fuzzy
// ============================================================
function buildQueryMatcher(query) {
    const q = removeStopwords(normalizeText(query).trim());
    if (!q) return () => true;

    const qTokens = q.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const expandedTokens = qTokens.map(tok => {
        const syns = (typeof expandQuery === 'function')
            ? expandQuery(tok).map(normalizeText)
            : [tok];
        return Array.from(new Set([tok, ...syns]));
    });

    const tokenStems = expandedTokens.map(list =>
        list.map(t => ({ word: t, stem: stemGreek(t) }))
    );

    return function matches(violation) {
        const rawSearchable = [
            violation.name,
            violation.article,
            violation.category,
            violation.details || '',
            violation.fullDescription || ''
        ].join(' ');

        const normalized = normalizeText(rawSearchable);
        const noStop = removeStopwords(normalized);
        const words = noStop.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
        const wordStems = words.map(w => stemGreek(w));

        return tokenStems.every(tokenSynonyms => {
            return tokenSynonyms.some(({ word: eq, stem: eqStem }) => {
                if (!eq) return false;
                if (words.includes(eq)) return true;
                if (eqStem.length >= 3 && wordStems.includes(eqStem)) return true;
                const minPrefix = /^\d/.test(eq) ? 2 : 3;
                if (eq.length >= minPrefix && words.some(w => w.startsWith(eq))) return true;
                if (eq.length >= 5 && noStop.includes(eq)) return true;
                if (eq.length >= 5 && words.some(w =>
                    w.length >= 5 && levenshtein(w, eq) <= 1
                )) return true;
                return false;
            });
        });
    };
}

// ============================================================
// SORT
// ============================================================
function getSeverityScore(v) {
    return typeof v.severity === 'number' ? v.severity : 99;
}

function sortData(items, boostIds = null) {
    const sorted = [...items];
    if (boostIds && boostIds.size > 0) {
        sorted.sort((a, b) => {
            const aBoost = boostIds.has(a.id) ? 0 : 1;
            const bBoost = boostIds.has(b.id) ? 0 : 1;
            return aBoost - bBoost;
        });
    }
    switch (currentSort) {
        case 'severity-asc':
            return sorted.sort((a, b) => {
                const sa = getSeverityScore(a);
                const sb = getSeverityScore(b);
                if (sa !== sb) return sa - sb;
                return a.id - b.id;
            });
        case 'severity-desc':
            return sorted.sort((a, b) => {
                const sa = getSeverityScore(a);
                const sb = getSeverityScore(b);
                if (sa !== sb) return sb - sa;
                return a.id - b.id;
            });
        case 'alphabetical':
            return sorted.sort((a, b) => a.name.localeCompare(b.name, 'el'));
        default:
            return sorted.sort((a, b) => a.id - b.id);
    }
}

function setSort(sortType) {
    currentSort = sortType;
    visibleCount = PAGE_SIZE;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================
// KEYWORDS (Αλφαβητικό ευρετήριο)
// ============================================================
function setKeyword(keyword) {
    if (activeKeyword === keyword) {
        activeKeyword = null;
    } else {
        activeKeyword = keyword;
    }
    visibleCount = PAGE_SIZE;
    updateActiveKeywordIndicator();
    render();
}

function clearKeyword() {
    activeKeyword = null;
    updateActiveKeywordIndicator();
    visibleCount = PAGE_SIZE;
    render();
}

function updateActiveKeywordIndicator() {
    const indicator = document.getElementById('activeKeywordIndicator');
    if (!indicator) return;
    if (activeKeyword) {
        indicator.style.display = 'flex';
        const label = indicator.querySelector('.active-keyword-label');
        if (label) label.textContent = activeKeyword;
    } else {
        indicator.style.display = 'none';
    }
}

// ============================================================
// RENDER — Main
// ============================================================
function render() {
    if (typeof data === 'undefined' || !Array.isArray(data) || data.length === 0) {
        const container = document.getElementById('listContainer');
        if (container) {
            container.innerHTML = `<div class="empty"><span class="icon">⏳</span>Φόρτωση δεδομένων...</div>`;
        }
        return;
    }

    const queryEl = document.getElementById('searchInput');
    const query = queryEl ? queryEl.value : '';
    const container = document.getElementById('listContainer');
    const countEl = document.getElementById('countText');
    const favIndicator = document.getElementById('favIndicator');
    const favCount = document.getElementById('favCount');

    const matches = buildQueryMatcher(query);
    const normalizedQ = removeStopwords(normalizeText(query).trim());
    const scenarioIds = normalizedQ.length >= 3
        ? getScenarioMatchesCached(normalizedQ)
        : new Set();

    let filtered = data.filter(v => {
        if (showFavorites && !favorites[v.id]) return false;
        if (currentFilter !== 'all' && v.category !== currentFilter) return false;

        if (activeKeyword && typeof keywordIndex !== 'undefined') {
            const ids = keywordIndex[activeKeyword] || [];
            if (!ids.includes(v.id)) return false;
        }

        if (scenarioIds.has(v.id)) return true;

        if (!matches(v)) return false;
        return true;
    });

    filtered = sortData(filtered, scenarioIds);

    const total = data.length;
    const favsCount = getFavorites().length;
    if (countEl) countEl.textContent = filtered.length + ' από ' + total + ' παραβάσεις';
    if (favIndicator) {
        if (showFavorites) {
            favIndicator.style.display = 'inline';
            if (favCount) favCount.textContent = favsCount;
        } else {
            favIndicator.style.display = 'none';
        }
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty"><span class="icon">${(typeof icon === 'function' ? icon('search', 'icon-svg') : '') || ''}</span>Δεν βρέθηκαν παραβάσεις<br><span style="font-size:13px;">Δοκίμασε άλλη λέξη-κλειδί</span></div>`;
        updateBodyPadding();
        return;
    }

    const visible = filtered.slice(0, visibleCount);
    const hasMore = filtered.length > visibleCount;

    let html = visible.map(v => renderCard(v)).join('');

    if (hasMore) {
        html += `
            <div class="load-more-wrap">
                <button class="load-more-btn" onclick="loadMore()">
                    ${icon('chevronDown', 'icon-svg')}
                    Φόρτωσε περισσότερες (${filtered.length - visibleCount} ακόμα)
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
    updateBodyPadding();
}

function loadMore() {
    visibleCount += PAGE_SIZE;
    render();
}

// ============================================================
// RENDER — Single Card
// ============================================================
function renderCard(v) {
    const halfBadge = v.half ? '<span class="badge-half">½ για μοτοσικλέτα</span>' : '';
    const criminalBadge = v.criminal ? '<span class="badge-criminal">ΠΛΗΜΜΕΛΗΜΑ</span>' : '';
    const isExpanded = expandedCards[v.id] || false;
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
    const severityLabel = getSeverityLabel(v);

    let expandedContent = '';
    if (isExpanded) {
        const signsRow = safeRenderSignIcons(v.name, v.id);
        const offloader = v.offloader_fine ? `
            <div class="card-offloader">
                ${icon('truck', 'icon-svg offloader-icon')}
                <span>Υπεύθυνος φόρτωσης: <strong>+${v.offloader_fine}€</strong></span>
            </div>
        ` : '';

        expandedContent = `
            <div class="card-expanded-content">
                ${signsRow}
                <div class="card-divider"></div>
                <div class="card-details-grid">
                    <div class="detail-item">
                        <span class="label">Αφαιρέσεις</span>
                        <span class="value">${v.suspend && v.suspend !== '-' ? v.suspend : '—'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">ΣΕΣΟ</span>
                        <span class="value purple">${v.points > 0 ? v.points + ' βαθμοί' : '—'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Άρθρο</span>
                        <span class="value">${v.article}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Κατηγορία</span>
                        <span class="value severity-badge">${severityLabel}</span>
                    </div>
                </div>
                ${offloader}
                ${v.fullDescription ? `
                <div class="card-desc-toggle">
                    <button class="details-btn nested" onclick="toggleDescription(${v.id}); event.stopPropagation();">
                        ${isDescOpen ? 'Απόκρυψη περιγραφής' : 'Περιγραφή'}
                        ${isDescOpen ? icon('chevronUp', 'icon-svg') : icon('chevronDown', 'icon-svg')}
                    </button>
                </div>
                <div class="card-full-description ${isDescOpen ? 'open' : ''}">
                    ${v.fullDescription}
                </div>
                ` : ''}
            </div>
        `;
    }

    return `
        <div class="violation-card ${isExpanded ? 'expanded' : 'collapsed'}">
            <div class="card-top">
                <input type="checkbox" class="select-check" data-id="${v.id}" onchange="toggleSelection(${v.id})" ${selectedIds.has(v.id) ? 'checked' : ''}>
                <div class="card-icon">${iconSvg}</div>
                <div class="card-main">
                    <div class="card-title">${safeStripSignCodes(v.name)} ${criminalBadge}</div>
                </div>
                <div class="card-price-wrap">
                    <div class="card-price" style="color:${priceColor};">${fineDisplay}</div>
                    ${halfBadge}
                </div>
                <button class="favorite-btn ${favorites[v.id] ? 'active' : ''}" onclick="toggleFavorite(${v.id}); event.stopPropagation();" aria-label="Αγαπημένο">
                    ${favorites[v.id] ? icon('starFilled', 'icon-svg') : icon('starOutline', 'icon-svg')}
                </button>
            </div>
            <div class="card-expand-toggle">
                <button class="toggle-details-btn" onclick="toggleCardExpand(${v.id})">
                    ${isExpanded ? 'Λιγότερα' : 'Λεπτομέρειες'}
                    ${isExpanded ? icon('chevronUp', 'icon-svg') : icon('chevronDown', 'icon-svg')}
                </button>
            </div>
            ${expandedContent}
        </div>
    `;
}

function getSeverityLabel(v) {
    const s = getSeverityScore(v);
    if (s === 99) return '—';
    const labels = {
        1: 'Ε1-Α', 2: 'Ε1-Β',
        3: 'Ε2-Α', 4: 'Ε2-Β',
        5: 'Ε3-Α', 6: 'Ε3-Β',
        7: 'Ε3-Β + Σ / Ε4', 8: 'Ειδική (ποινική)'
    };
    return labels[s] || '—';
}

// ============================================================
// CARD EXPAND / COLLAPSE
// ============================================================
function toggleCardExpand(id) {
    expandedCards[id] = !expandedCards[id];
    render();
}

function toggleDescription(id) {
    openDescriptions[id] = !openDescriptions[id];
    render();
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
    visibleCount = PAGE_SIZE;
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
    visibleCount = PAGE_SIZE;
    updateBottomNavActive();
    render();
}

function getFavorites() {
    return data.filter(v => favorites[v.id]);
}
// ============================================================
// EXPORT — FAVORITES PDF
// ============================================================
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
        .card .det .offloader { color: #f97316; font-weight: 600; }
        .card .p-ota { font-size: 13px; color: #555; margin-top: 4px; }
        .sign-img { display: inline-block; width: 20px; height: 20px; vertical-align: middle; margin: 0 2px; border: 1px solid #ccc; border-radius: 3px; background: #fff; object-fit: contain; }
        .card .desc { margin-top: 6px; background: #f5f5f5; padding: 8px 10px; border-radius: 6px; font-size: 14px; }
        .footer { margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
        @media print { .no-print { display: none; } body { padding: 20px; } }
    </style>
    </head>
    <body>
        <h1>Αγαπημένες Παραβάσεις Κ.Ο.Κ.</h1>
        <p class="sub">Εξαγωγή από την εφαρμογή «ΚΟΚ – Τσέπης v25» — ${new Date().toLocaleDateString()}</p>
        ${favs.map(v => {
            const ota = selectedOta;
            return `
            <div class="card">
                <div class="name">${safeReplaceSignCodes(v.name)}</div>
                <div class="article">Άρθρο: ${v.article}</div>
                <div class="det">
                    <span class="fine">Πρόστιμο: ${typeof v.fine === 'number' ? v.fine + '€' : v.fine}</span>
                    ${v.offloader_fine ? `<span class="offloader">Υπεύθ. φόρτωσης: +${v.offloader_fine}€</span>` : ''}
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
    if (!footer) return;
    const count = selectedIds.size;
    if (count === 0) {
        footer.classList.remove('show');
        updateBodyPadding();
        return;
    }
    footer.classList.add('show');
    if (countEl) countEl.textContent = count;
    const selected = data.filter(v => selectedIds.has(v.id));
    const names = selected.map(v => v.name).slice(0, 2);
    let namesText = names.join(', ');
    if (selected.length > 2) {
        namesText += ` +${selected.length - 2} ακόμα`;
    }
    if (namesEl) namesEl.textContent = namesText;
    updateBodyPadding();
}

function clearSelection() {
    selectedIds.clear();
    updateSelectionUI();
    render();
}

// ============================================================
// ΥΠΟΛΟΓΙΣΜΟΙ
// ============================================================
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
        if (licenseMatch) daysLicense += parseInt(licenseMatch[1], 10);

        const docMatch = text.match(/(\d+)\s*ημέρες?\s*στοιχ\.\s*κυκλ\./i) || text.match(/(\d+)\s*ημ\.\s*στοιχ\.\s*κυκλ\./i);
        if (docMatch) daysDocuments += parseInt(docMatch[1], 10);

        const monthMatch = text.match(/(\d+)\s*μήνες?\s*αδ\.\s*οδ\./i);
        if (monthMatch) daysLicense += parseInt(monthMatch[1], 10) * 30;

        const docMonthMatch = text.match(/(\d+)\s*μήνες?\s*στοιχ\.\s*κυκλ\./i);
        if (docMonthMatch) daysDocuments += parseInt(docMonthMatch[1], 10) * 30;

        const yearMatch = text.match(/(\d+)\s*έτ(?:ος|η)\s*αδ\.\s*οδ\./i);
        if (yearMatch) daysLicense += parseInt(yearMatch[1], 10) * 365;
    }
    return { daysLicense, daysDocuments };
}

function calculateTotalPoints(selected) {
    return selected.reduce((sum, v) => sum + (v.points || 0), 0);
}

function calculateOffloaderFine(selected) {
    let total = 0;
    for (const v of selected) {
        if (!v.offloader_fine) continue;
        const str = String(v.offloader_fine);
        const match = str.match(/(\d+)\s*-\s*(\d+)/);
        if (match) {
            total += parseInt(match[2], 10);
        } else {
            const num = parseInt(str, 10);
            if (!isNaN(num)) total += num;
        }
    }
    return total;
}

// ============================================================
// EXPORT — SELECTED PDF (Κλήση)
// ============================================================
// ============================================================
// EXPORT — SELECTED PDF (Κλήση)
// ============================================================
function exportSelectedToPDF() {
    const selected = data.filter(v => selectedIds.has(v.id));
    if (selected.length === 0) {
        showToast('Δεν έχετε επιλέξει καμία παράβαση.');
        return;
    }

    const totalFine = calculateTotalFine(selected);
    const { daysLicense, daysDocuments } = calculateSuspension(selected);
    const totalPoints = calculateTotalPoints(selected);
    const offloaderTotal = calculateOffloaderFine(selected);
    const otaText = (typeof selectedOta !== 'undefined' && selectedOta)
        ? `${selectedOta.name} (${selectedOta.code})` : '';
    const addressText = localStorage.getItem('kok_last_address') || '';

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
        showToast('Άνοιξε ένα popup για να συνεχίσεις.');
        return;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="el">
    <head>
        <meta charset="UTF-8">
        <title>Βεβαίωση Κλήσης - ΚΟΚ</title>
        <style>
            * { box-sizing: border-box; }
            body {
                font-family: Arial, 'Helvetica Neue', sans-serif;
                padding: 30px;
                max-width: 900px;
                margin: auto;
                color: #0f172a;
                font-size: 13px;
                line-height: 1.5;
            }

            /* Header */
            .pdf-header {
                display: flex;
                align-items: center;
                gap: 14px;
                border-bottom: 3px solid #1e3a5f;
                padding-bottom: 14px;
                margin-bottom: 0;
            }
            .gold-rule {
                height: 2px;
                background: linear-gradient(90deg, #D9B36C, transparent);
                margin-bottom: 20px;
            }
            .pdf-logo {
                width: 54px;
                height: 54px;
                border-radius: 8px;
                flex-shrink: 0;
                object-fit: cover;
            }
            .pdf-title {
                font-size: 22px;
                font-weight: 700;
                color: #1e3a5f;
                margin: 0 0 4px 0;
            }
            .pdf-subtitle {
                font-size: 13px;
                color: #555;
                margin: 0;
            }

            /* Metadata */
            .meta-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px 24px;
                padding: 14px 18px;
                background: #f5f7fb;
                border-radius: 8px;
                margin-bottom: 16px;
                font-size: 13px;
            }
            .meta-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                gap: 8px;
                padding: 3px 0;
            }
            .meta-label {
                color: #666;
                font-weight: 500;
            }
            .meta-value {
                font-weight: 700;
                color: #0f172a;
                text-align: right;
                border-bottom: 1px solid #999;
                min-width: 100px;
                padding: 0 4px;
            }
            .meta-value.filled {
                border-bottom: none;
                padding: 0;
            }

            /* Summary */
            .summary-box {
                background: #f0f4fa;
                border: 2px solid #1e3a5f;
                border-radius: 10px;
                padding: 16px 20px;
                margin-bottom: 22px;
            }
            .summary-title {
                font-size: 14px;
                font-weight: 700;
                color: #1e3a5f;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 12px 0;
                padding-bottom: 8px;
                border-bottom: 1px solid #cdd7e5;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 8px;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                align-items: baseline;
                font-size: 14px;
                padding: 4px 0;
            }
            .summary-row .label {
                color: #333;
                font-weight: 500;
            }
            .summary-row .value {
                font-weight: 700;
                color: #0f172a;
                font-size: 15px;
            }
            .summary-row.total {
                border-top: 1px solid #cdd7e5;
                margin-top: 4px;
                padding-top: 10px;
            }
            .summary-row.total .label {
                font-weight: 700;
                color: #1e3a5f;
            }
            .summary-row.total .value.fine {
                color: #c00;
                font-size: 20px;
            }
            .summary-row.offloader .value { color: #f97316; }

            /* Violations */
            .violations-title {
                font-size: 14px;
                font-weight: 700;
                color: #1e3a5f;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin: 0 0 12px 0;
                padding-bottom: 6px;
                border-bottom: 2px solid #1e3a5f;
            }
            .violation {
                border: 1px solid #ddd;
                border-left: 4px solid #1e3a5f;
                border-radius: 8px;
                padding: 12px 14px;
                margin-bottom: 10px;
                page-break-inside: avoid;
            }
            .violation-num {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #1e3a5f;
                color: #fff;
                font-size: 12px;
                font-weight: 700;
                margin-right: 8px;
                vertical-align: middle;
            }
            .violation-name {
                font-weight: 700;
                font-size: 14px;
                color: #0f172a;
                display: inline;
                vertical-align: middle;
            }
            .violation-article {
                color: #555;
                font-size: 12px;
                margin: 4px 0 6px 30px;
            }
            .violation-desc {
                font-size: 12px;
                color: #333;
                margin: 4px 0 6px 30px;
                line-height: 1.5;
            }
            .violation-fine {
                color: #c00;
                font-weight: 700;
                font-size: 13px;
                margin-left: 30px;
            }
            .violation-extra {
                color: #555;
                font-size: 12px;
                margin-left: 30px;
                margin-top: 4px;
            }

            /* Footer */
            .pdf-footer {
                margin-top: 30px;
                padding-top: 12px;
                border-top: 1px solid #ddd;
                font-size: 11px;
                color: #888;
                line-height: 1.5;
                text-align: justify;
            }
            .pdf-footer strong { color: #666; }

            /* Print */
            @media print {
                body { padding: 15px; font-size: 12px; }
                .no-print { display: none !important; }
                .violation { page-break-inside: avoid; }
                .summary-box { page-break-inside: avoid; }
            }

            /* Print button (screen only) */
            .print-btn-wrap {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px dashed #ccc;
            }
            .print-btn {
                padding: 12px 32px;
                background: #1e3a5f;
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 15px;
                font-weight: 600;
                cursor: pointer;
                font-family: inherit;
            }
            .print-btn:hover { background: #2a4a7a; }
        </style>
    </head>
    <body>

        <!-- Header -->
        <div class="pdf-header">
            <img class="pdf-logo" src="data:image/png;base64,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" alt="ΚΟΚ Τσέπης">
            <div>
                <h1 class="pdf-title">ΚΟΚ ΤΣΕΠΗΣ — Βεβαίωση Κλήσης</h1>
                <p class="pdf-subtitle">Σημείωμα καταγραφής βεβαιωμένων παραβάσεων Κ.Ο.Κ.</p>
            </div>
        </div>
        <div class="gold-rule"></div>

        <!-- Metadata -->
        <div class="meta-grid">
            <div class="meta-row">
                <span class="meta-label">Αριθμός Δελτίου</span>
                <span class="meta-value"></span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Ημερομηνία</span>
                <span class="meta-value filled">${new Date().toLocaleDateString('el-GR')}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Ώρα</span>
                <span class="meta-value filled">${new Date().toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="meta-row">
                <span class="meta-label">Σημείο ελέγχου</span>
                <span class="meta-value filled">${addressText || '—'}</span>
            </div>
            ${otaText ? `
            <div class="meta-row">
                <span class="meta-label">Δήμος (ΟΤΑ)</span>
                <span class="meta-value filled">${otaText}</span>
            </div>
            ` : ''}
            <div class="meta-row">
                <span class="meta-label">Πλήθος παραβάσεων</span>
                <span class="meta-value filled">${selected.length}</span>
            </div>
        </div>

        <!-- Summary -->
        <div class="summary-box">
            <div class="summary-title">Σύνοψη</div>
            <div class="summary-grid">
                <div class="summary-row total">
                    <span class="label">Σύνολο Προστίμου</span>
                    <span class="value fine">${totalFine.toFixed(2)}€</span>
                </div>
                ${offloaderTotal > 0 ? `
                <div class="summary-row offloader">
                    <span class="label">Πρόστιμο Υπεύθυνου Φόρτωσης</span>
                    <span class="value">+${offloaderTotal}€</span>
                </div>
                ` : ''}
                <div class="summary-row">
                    <span class="label">Αφαίρεση Άδειας Οδήγησης</span>
                    <span class="value">${daysLicense} ημέρες</span>
                </div>
                <div class="summary-row">
                    <span class="label">Αφαίρεση Στοιχείων Κυκλοφορίας</span>
                    <span class="value">${daysDocuments} ημέρες</span>
                </div>
                <div class="summary-row">
                    <span class="label">Σύνολο Βαθμών ΣΕΣΟ</span>
                    <span class="value">${totalPoints} βαθμοί</span>
                </div>
            </div>
        </div>

        <!-- Violations -->
        <h2 class="violations-title">Βεβαιωμένες Παραβάσεις</h2>
        ${selected.map((v, idx) => `
            <div class="violation">
                <div>
                    <span class="violation-num">${idx + 1}</span>
                    <span class="violation-name">${safeReplaceSignCodes(v.name)}</span>
                </div>
                <div class="violation-article">Άρθρο: ${v.article}</div>
                ${v.fullDescription ? `<div class="violation-desc">${v.fullDescription}</div>` : ''}
                <div class="violation-fine">Πρόστιμο: ${typeof v.fine === 'number' ? v.fine + '€' : v.fine}</div>
                ${v.offloader_fine ? `<div class="violation-extra">Υπεύθυνος φόρτωσης: +${v.offloader_fine}€</div>` : ''}
                ${v.suspend && v.suspend !== '-' ? `<div class="violation-extra">Κύρωση: ${v.suspend}</div>` : ''}
                ${v.points > 0 ? `<div class="violation-extra">Βαθμοί ΣΕΣΟ: ${v.points}</div>` : ''}
            </div>
        `).join('')}

        <!-- Footer -->
        <div class="pdf-footer">
            <strong>Σημείωση:</strong> Το παρόν αποτελεί βοηθητικό σημείωμα καταγραφής και δεν υποκαθιστά το επίσημο έντυπο βεβαίωσης παράβασης. Τα στοιχεία πρέπει να επαληθεύονται με τις ισχύουσες διατάξεις του Κ.Ο.Κ.
            <br>
            Δημιουργήθηκε με <strong>ΚΟΚ Τσέπης v25</strong> — Πατήστε Ctrl+P ή «Εκτύπωση» για αποθήκευση ως PDF.
        </div>

        <!-- Print button (screen only) -->
        <div class="print-btn-wrap no-print">
            <button class="print-btn" onclick="window.print()">Εκτύπωση / Αποθήκευση ως PDF</button>
        </div>

    </body>
    </html>
    `;

    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.focus(); }, 300);
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
        visibleCount = PAGE_SIZE;
        render();
    }, 300);
}

function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearBtn').classList.remove('visible');
    visibleCount = PAGE_SIZE;
    render();
    document.getElementById('searchInput').focus();
}

function formatFine(fine) {
    if (typeof fine === 'number') return fine + '€';
    return fine;
}

// ============================================================
// MAKE CALL
// ============================================================
function makeCall() {
    if (confirm('Πατήστε OK για κλήση στο 166 (ΕΚΑΒ) ή Ακύρωση για 112 (Ευρωπαϊκός αριθμός έκτακτης ανάγκης)')) {
        window.location.href = 'tel:166';
    } else {
        window.location.href = 'tel:112';
    }
}

// ============================================================
// DATA VERSION CHECK
// ============================================================
const VERSION_URL = 'data-version.json';
const LAST_SEEN_KEY = 'kok_lastSeenVersion';

async function checkVersionUpdate() {
    try {
        const response = await fetch(VERSION_URL, { cache: 'no-cache' });
        if (!response.ok) return;
        const remote = await response.json();
        const lastSeen = localStorage.getItem(LAST_SEEN_KEY);

        if (!lastSeen) {
            localStorage.setItem(LAST_SEEN_KEY, remote.version);
            return;
        }
        if (lastSeen !== remote.version) {
            showUpdateModal(lastSeen, remote);
            localStorage.setItem(LAST_SEEN_KEY, remote.version);
        }
    } catch (err) {
        console.warn('Αδυναμία ελέγχου έκδοσης:', err);
    }
}

function showUpdateModal(prevVersion, remote) {
    document.getElementById('prevVersion').textContent = prevVersion || '—';
    document.getElementById('newVersion').textContent = remote.version || '—';
    document.getElementById('newDate').textContent = remote.updated || '—';

    const list = document.getElementById('changelogList');
    list.innerHTML = '';
    (remote.changelog || []).forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });

    document.getElementById('updateModal').style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeUpdateModal() {
    document.getElementById('updateModal').style.display = 'none';
    document.body.classList.remove('modal-open');
}

// ============================================================
// AUTO-SUGGEST HOOK (χρησιμοποιείται από ui.js)
// ============================================================
function getSuggestions(query) {
    if (!query || query.length < 2) return { scenarios: [], keywords: [], violations: [], totalCount: 0 };
    const q = normalizeText(query).trim();

    const scenarios = (typeof findMatchingScenarios === 'function')
        ? findMatchingScenarios(q).slice(0, 3)
        : [];

    const kws = (typeof findMatchingKeywords === 'function')
        ? findMatchingKeywords(q).slice(0, 5)
        : [];

    const matcher = buildQueryMatcher(query);
    const allMatches = data.filter(v => matcher(v));
    const viols = allMatches.slice(0, 5)
        .map(v => ({ id: v.id, name: v.name, fine: v.fine }));

    return { scenarios, keywords: kws, violations: viols, totalCount: allMatches.length };
}
