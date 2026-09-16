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
        container.innerHTML = `<div class="empty"><span class="icon">🔍</span>Δεν βρέθηκαν παραβάσεις<br><span style="font-size:13px;">Δοκίμασε άλλη λέξη-κλειδί</span></div>`;
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
                margin-bottom: 18px;
            }
            .pdf-logo {
                width: 60px;
                height: 60px;
                border-radius: 10px;
                background: #1E5AA8;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .pdf-logo svg { width: 40px; height: 40px; }
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
            <div class="pdf-logo">
                <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 28L20 12L28 28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                    <circle cx="20" cy="24" r="2" fill="white"/>
                    <path d="M16 28H24" stroke="white" stroke-width="2" stroke-linecap="round"/>
                </svg>
            </div>
            <div>
                <h1 class="pdf-title">ΚΟΚ ΤΣΕΠΗΣ — Βεβαίωση Κλήσης</h1>
                <p class="pdf-subtitle">Σημείωμα καταγραφής βεβαιωμένων παραβάσεων Κ.Ο.Κ.</p>
            </div>
        </div>

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
            <div class="summary-title">💰 Σύνοψη</div>
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
            <button class="print-btn" onclick="window.print()">🖨️ Εκτύπωση / Αποθήκευση ως PDF</button>
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
