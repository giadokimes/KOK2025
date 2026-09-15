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
    // Stopword removal ΚΑΙ στο query
    const q = removeStopwords(normalizeText(query).trim());
    if (!q) return () => true;

    // Per-token synonym expansion — κάθε token ξεχωριστά
    const qTokens = q.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
    const expandedTokens = qTokens.map(tok => {
        const syns = (typeof expandQuery === 'function')
            ? expandQuery(tok).map(normalizeText)
            : [tok];
        return Array.from(new Set([tok, ...syns]));
    });

    // Cache των stems των query tokens
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

        // ΚΑΘΕ query token πρέπει να βρει match (AND logic)
        return tokenStems.every(tokenSynonyms => {
            return tokenSynonyms.some(({ word: eq, stem: eqStem }) => {
                if (!eq) return false;

                // 1. Ακριβής λέξη
                if (words.includes(eq)) return true;

                // 2. Stem match (πτώσεις: κράνος ↔ κράνους)
                if (eqStem.length >= 3 && wordStems.includes(eqStem)) return true;

                // 3. Prefix match — min 2 για αριθμούς, 3 για λέξεις
                const minPrefix = /^\d/.test(eq) ? 2 : 3;
                if (eq.length >= minPrefix && words.some(w => w.startsWith(eq))) return true;

                // 4. Substring — μόνο για >= 5 chars
                if (eq.length >= 5 && noStop.includes(eq)) return true;

                // 5. Fuzzy — typos, μόνο για >= 5 chars, edit distance ≤ 1
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
    // Scenario boost: όσα είναι στο boostIds πάνε πρώτα
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

    // Φιλτράρισμα — ο matcher υπολογίζεται ΜΙΑ φορά
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

        // Αν το record είναι σε scenario → πάντα match
        if (scenarioIds.has(v.id)) return true;

        if (!matches(v)) return false;
        return true;
    });

    // Ταξινόμηση με scenario boost
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

    // Empty state
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty"><span class="icon">🔍</span>Δεν βρέθηκαν παραβάσεις<br><span style="font-size:13px;">Δοκίμασε άλλη λέξη-κλειδί</span></div>`;
        updateBodyPadding();
        return;
    }

    // Pagination
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
    const otaText = (typeof selectedOta !== 'undefined' && selectedOta) ? `Κωδικός ΟΤΑ: ${selectedOta.name} (${selectedOta.code})` : '';
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
        .summary .offloader { color: #f97316; }
        .sign-img { display: inline-block; width: 20px; height: 20px; vertical-align: middle; margin: 0 2px; border: 1px solid #ccc; border-radius: 3px; background: #fff; object-fit: contain; }
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
                <div class="desc">${v.fullDescription || ''}</div>
                <div style="margin-top:4px;font-size:13px;">
                    <span style="color:#c00;font-weight:bold;">Πρόστιμο: ${typeof v.fine === 'number' ? v.fine + '€' : v.fine}</span>
                    ${v.offloader_fine ? ` | <span style="color:#f97316;font-weight:600;">Υπεύθ. φόρτωσης: +${v.offloader_fine}€</span>` : ''}
                    ${v.suspend && v.suspend !== '-' ? ` | Κύρωση: ${v.suspend}` : ''}
                    ${v.points > 0 ? ` | Βαθμοί ΣΕΣΟ: ${v.points}` : ''}
                </div>
            </div>
        `).join('')}
        <div class="summary">
            <h2>Σύνοψη</h2>
            <table>
                <tr><td class="label">Σύνολο Προστίμου</td><td class="value fine">${totalFine.toFixed(2)}€</td></tr>
                ${offloaderTotal > 0 ? `<tr><td class="label">Πρόστιμο Υπεύθυνου Φόρτωσης</td><td class="value offloader">+${offloaderTotal}€</td></tr>` : ''}
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
// HAMBURGER (ΣΧΟΛΙΑΣΜΕΝΟ — για rollback)
// ============================================================
/*
function toggleHamburger() {
    const overlay = document.getElementById('hamburgerOverlay');
    if (overlay.style.display === 'flex') {
        overlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    } else {
        overlay.style.display = 'flex';
        document.body.classList.add('modal-open');
    }
}
*/

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
    if (!query || query.length < 2) return { scenarios: [], keywords: [], violations: [] };
    const q = normalizeText(query).trim();

    // 1. Scenarios
    const scenarios = (typeof findMatchingScenarios === 'function')
        ? findMatchingScenarios(q).slice(0, 3)
        : [];

    // 2. Keywords
    const kws = (typeof findMatchingKeywords === 'function')
        ? findMatchingKeywords(q).slice(0, 5)
        : [];

    // 3. Top violations (max 3)
    const matcher = buildQueryMatcher(query);
    const viols = data.filter(v => matcher(v)).slice(0, 3)
        .map(v => ({ id: v.id, name: v.name, fine: v.fine }));

    return { scenarios, keywords: kws, violations: viols };
}