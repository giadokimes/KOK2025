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