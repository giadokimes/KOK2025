// ============================================================
// ota.js – ΚΩΔΙΚΟΣ ΟΤΑ & ΓΕΩΤΟΠΟΘΕΣΙΑ
// ============================================================
// Δύο ΑΝΕΞΑΡΤΗΤΕΣ λειτουργίες γεωτοποθεσίας, με διαφορετικό provider
// η καθεμία, ώστε να μη σπαταλιέται το όριο του OpenCage (2.500 δωρεάν
// κλήσεις/ημέρα) σε αιτήματα που δεν χρειάζονται την ακρίβειά του:
//   1) Κωδικός ΟΤΑ  → κουμπί 📍 → OpenCage (ακριβές, αναγνωρίζει σωστά
//      δήμους όπως η Καλαμαριά μέσα σε μεγάλο αστικό συγκρότημα)
//   2) Διεύθυνση    → κουμπί 🧭 → Nominatim/OpenStreetMap (δωρεάν,
//      χωρίς κλειδί, χωρίς όριο — αρκετά ακριβές για απλή εμφάνιση οδού)
// Καμία από τις δύο δεν καλείται αυτόματα στο άνοιγμα της εφαρμογής.

let otaList = [];
let selectedOta = null;

function getOtaSuggestions(query) {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return otaList
        .filter(item => {
            const name = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const code = item.code.toLowerCase();
            return name.includes(q) || code.includes(q);
        })
        .slice(0, 10);
}

function onOtaSearch() {
    const input = document.getElementById('otaSearchInput');
    const suggestionsDiv = document.getElementById('otaSuggestions');
    const val = input.value;
    const suggestions = getOtaSuggestions(val);
    if (suggestions.length === 0) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    suggestionsDiv.classList.add('show');
    suggestionsDiv.innerHTML = suggestions.map(item =>
        `<div class="suggestion-item" onclick="selectOta('${item.name}', '${item.code}')">
            ${item.name} (${item.code})
        </div>`
    ).join('');
}

function selectOta(name, code) {
    selectedOta = { name, code };
    document.getElementById('otaSearchInput').value = name;
    document.getElementById('otaCodeDisplay').textContent = code;
    document.getElementById('otaSuggestions').classList.remove('show');
    localStorage.setItem('kok_selected_ota', JSON.stringify(selectedOta));
    render();
    showToast('Επιλέχθηκε: ' + name + ' (' + code + ')', 'success');
}

function loadOtaSelection() {
    try {
        const saved = JSON.parse(localStorage.getItem('kok_selected_ota'));
        if (saved) {
            selectedOta = saved;
            document.getElementById('otaSearchInput').value = saved.name || '';
            document.getElementById('otaCodeDisplay').textContent = saved.code || '—';
        }
    } catch (e) {}
}

// ============================================================
// 1) ΚΩΔΙΚΟΣ ΟΤΑ — OpenCage (κουμπί 📍)
// ============================================================
let geoInProgress = false;

function detectLocation() {
    if (geoInProgress) return;
    if (!navigator.geolocation) {
        showToast('Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.', 'warning');
        return;
    }
    geoInProgress = true;
    setButtonState('geoBtn', 'loading');
    showToast('Εντοπισμός δήμου...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocodeOta(latitude, longitude);
            geoInProgress = false;
            setButtonState('geoBtn', 'idle');
        },
        (error) => {
            console.error('Geolocation error:', error);
            let msg = 'Δεν ήταν δυνατός ο εντοπισμός. Επίλεξε ΟΤΑ χειροκίνητα.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = 'Δεν δόθηκε άδεια τοποθεσίας. Επίλεξε ΟΤΑ χειροκίνητα.';
            }
            showToast(msg, 'warning');
            geoInProgress = false;
            setButtonState('geoBtn', 'idle');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function setButtonState(btnId, state) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('loading', state === 'loading');
    btn.disabled = state === 'loading';
}

async function waitForOtaList() {
    let retries = 0;
    while (otaList.length === 0 && retries < 20) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries++;
    }
    return otaList.length > 0;
}

async function reverseGeocodeOta(lat, lon) {
    try {
        if (!(await waitForOtaList())) {
            showToast('Η λίστα ΟΤΑ δεν φορτώθηκε. Δοκίμασε ξανά.', 'warning');
            return;
        }

        // OpenCage: πιο ακριβές στη διάκριση δήμων μέσα σε μεγάλα αστικά
        // συγκροτήματα (π.χ. Καλαμαριά vs Θεσσαλονίκη) — γι' αυτό
        // χρησιμοποιείται ειδικά για τον κωδικό ΟΤΑ.
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=e693b1d11617416ba9df9797a1d0a66e&language=el`;
        const response = await fetch(url);
        if (!response.ok) {
            showToast('Σφάλμα επικοινωνίας με τον server.', 'warning');
            return;
        }
        const data = await response.json();

        if (data && data.results && data.results.length > 0) {
            const components = data.results[0].components;
            const municipality = components.city_district ||
                                components.suburb ||
                                components.town ||
                                components.village ||
                                components.municipality ||
                                components.city;

            if (municipality) {
                const normalized = municipality.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                let found = otaList.find(item => {
                    const itemNorm = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    return itemNorm.includes(normalized) || normalized.includes(itemNorm);
                });
                if (found) {
                    selectOta(found.name, found.code);
                    showToast('Εντοπίστηκε: ' + found.name + ' (' + found.code + ')', 'success');
                } else {
                    showToast('Εντοπίστηκε: ' + municipality + ' (δεν βρέθηκε σε ΟΤΑ)');
                }
            } else {
                showToast('Δεν βρέθηκε δήμος στην τοποθεσία σου.', 'warning');
            }
        } else {
            showToast('Δεν βρέθηκε τοποθεσία.', 'warning');
        }
    } catch (error) {
        console.error('reverseGeocodeOta error:', error);
        showToast('Σφάλμα κατά τον εντοπισμό.', 'warning');
    }
}

// ============================================================
// 2) ΔΙΕΥΘΥΝΣΗ — Nominatim / OpenStreetMap (κουμπί 🧭, χωρίς κλειδί)
// ============================================================
let addrInProgress = false;

function detectAddress() {
    if (addrInProgress) return;
    if (!navigator.geolocation) {
        showToast('Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.', 'warning');
        return;
    }
    addrInProgress = true;
    setButtonState('addrBtn', 'loading');
    showToast('Εντοπισμός διεύθυνσης...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocodeAddress(latitude, longitude);
            addrInProgress = false;
            setButtonState('addrBtn', 'idle');
        },
        (error) => {
            console.error('Geolocation error:', error);
            let msg = 'Δεν ήταν δυνατός ο εντοπισμός διεύθυνσης.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = 'Δεν δόθηκε άδεια τοποθεσίας.';
            }
            showToast(msg, 'warning');
            addrInProgress = false;
            setButtonState('addrBtn', 'idle');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

async function reverseGeocodeAddress(lat, lon) {
    try {
        // Nominatim: δωρεάν, χωρίς κλειδί, χωρίς ημερήσιο όριο — αρκετά
        // ακριβές για την εμφάνιση ονόματος οδού (όχι για τον κωδικό ΟΤΑ,
        // βλ. σημείωση στην αρχή του αρχείου).
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=el&zoom=18&addressdetails=1`;
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
            showToast('Σφάλμα επικοινωνίας με τον server.', 'warning');
            return;
        }
        const result = await response.json();
        const components = (result && result.address) || {};

        const found = updateAddress(components, result.display_name);
        showToast(found ? 'Η διεύθυνση ενημερώθηκε' : 'Δεν βρέθηκε διεύθυνση για αυτή την τοποθεσία.', found ? 'success' : 'warning');
    } catch (error) {
        console.error('reverseGeocodeAddress error:', error);
        showToast('Σφάλμα κατά τον εντοπισμό διεύθυνσης.', 'warning');
    }
}

// ============================================================
// ΔΙΕΥΘΥΝΣΗ ΤΟΠΟΘΕΣΙΑΣ — κοινή εμφάνιση/αποθήκευση
// ============================================================
// Η τελευταία γνωστή διεύθυνση αποθηκεύεται τοπικά και εμφανίζεται ξανά
// στο επόμενο άνοιγμα της εφαρμογής, χωρίς νέο αίτημα δικτύου.
function updateAddress(components, formatted) {
    const box = document.getElementById('locationAddress');
    const addressSpan = document.getElementById('addressText');
    if (!box || !addressSpan) return;

    const road = components.road ||
                 components.pedestrian ||
                 components.path ||
                 components.street ||
                 components.footway ||
                 components.cycleway ||
                 components.residential || '';
    const houseNumber = components.house_number || '';

    let address = '';
    if (road) {
        address = houseNumber ? road + ' ' + houseNumber : road;
    } else if (formatted) {
        address = formatted.split(',')[0].trim();
    }

    if (address) {
        addressSpan.textContent = address;
        addressSpan.className = 'address-found';
        localStorage.setItem('kok_last_address', address);
        return true;
    }
    addressSpan.textContent = 'Άγνωστη διεύθυνση';
    addressSpan.className = 'address-placeholder';
    return false;
}

function loadSavedAddress() {
    const saved = localStorage.getItem('kok_last_address');
    const addressSpan = document.getElementById('addressText');
    if (saved && addressSpan) {
        addressSpan.textContent = saved;
        addressSpan.className = 'address-found';
    }
}
