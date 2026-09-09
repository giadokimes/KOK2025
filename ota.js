// ============================================================
// ota.js – ΚΩΔΙΚΟΣ ΟΤΑ & ΓΕΩΤΟΠΟΘΕΣΙΑ (v24)
// ============================================================

let otaList = [];
let selectedOta = null;

// ===== ΧΕΙΡΟΚΙΝΗΤΗ ΑΝΑΖΗΤΗΣΗ =====
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
    document.getElementById('otaCodeDisplay').textContent = 'Κωδικός: ' + code;
    document.getElementById('otaNameDisplay').textContent = name;
    document.getElementById('otaSuggestions').classList.remove('show');
    localStorage.setItem('kok_selected_ota', JSON.stringify(selectedOta));
    render();
    showToast('Επιλέχθηκε: ' + name + ' (' + code + ')');
}

function loadOtaSelection() {
    try {
        const saved = JSON.parse(localStorage.getItem('kok_selected_ota'));
        if (saved) {
            selectedOta = saved;
            document.getElementById('otaSearchInput').value = saved.name || '';
            document.getElementById('otaCodeDisplay').textContent = 'Κωδικός: ' + (saved.code || '—');
            document.getElementById('otaNameDisplay').textContent = saved.name || '—';
        }
    } catch (e) {}
}

// ===== ΑΥΤΟΜΑΤΗ ΑΝΑΖΗΤΗΣΗ (OpenCage) =====
let geoInProgress = false;

function detectLocation() {
    if (geoInProgress) return;
    if (!navigator.geolocation) {
        showToast('Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.');
        return;
    }
    geoInProgress = true;
    const btn = document.getElementById('geoBtn');
    if (btn) btn.classList.add('loading');
    showToast('Εντοπισμός δήμου...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocodeOta(latitude, longitude);
            geoInProgress = false;
            if (btn) btn.classList.remove('loading');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('Δεν ήταν δυνατός ο εντοπισμός. Επίλεξε ΟΤΑ χειροκίνητα.');
            geoInProgress = false;
            if (btn) btn.classList.remove('loading');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
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
            showToast('Η λίστα ΟΤΑ δεν φορτώθηκε. Δοκίμασε ξανά.');
            return;
        }

        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=e693b1d11617416ba9df9797a1d0a66e&language=el`;
        const response = await fetch(url);
        if (!response.ok) {
            showToast('Σφάλμα επικοινωνίας με τον server.');
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
                    showToast('Εντοπίστηκε: ' + found.name + ' (' + found.code + ')');
                } else {
                    showToast('Εντοπίστηκε: ' + municipality + ' (δεν βρέθηκε σε ΟΤΑ)');
                }
            } else {
                showToast('Δεν βρέθηκε δήμος στην τοποθεσία σου.');
            }
        } else {
            showToast('Δεν βρέθηκε τοποθεσία.');
        }
    } catch (error) {
        console.error('reverseGeocodeOta error:', error);
        showToast('Σφάλμα κατά τον εντοπισμό.');
    }
}

// ===== ΔΙΕΥΘΥΝΣΗ (Nominatim) =====
let addrInProgress = false;

function detectAddress() {
    if (addrInProgress) return;
    if (!navigator.geolocation) {
        showToast('Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.');
        return;
    }
    addrInProgress = true;
    const btn = document.getElementById('addrBtn');
    if (btn) btn.classList.add('loading');
    showToast('Εντοπισμός διεύθυνσης...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocodeAddress(latitude, longitude);
            addrInProgress = false;
            if (btn) btn.classList.remove('loading');
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('Δεν ήταν δυνατός ο εντοπισμός διεύθυνσης.');
            addrInProgress = false;
            if (btn) btn.classList.remove('loading');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

async function reverseGeocodeAddress(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=el&zoom=18&addressdetails=1`;
        const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (!response.ok) {
            showToast('Σφάλμα επικοινωνίας με τον server.');
            return;
        }
        const result = await response.json();
        const components = (result && result.address) || {};

        const found = updateAddress(components, result.display_name);
        showToast(found ? 'Η διεύθυνση ενημερώθηκε' : 'Δεν βρέθηκε διεύθυνση για αυτή την τοποθεσία.');
    } catch (error) {
        console.error('reverseGeocodeAddress error:', error);
        showToast('Σφάλμα κατά τον εντοπισμό διεύθυνσης.');
    }
}

// ===== ΔΙΕΥΘΥΝΣΗ – εμφάνιση / αποθήκευση =====
function updateAddress(components, formatted) {
    const addressSpan = document.getElementById('addressText');
    if (!addressSpan) return;

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
        addressSpan.textContent = 'Τοποθεσία: ' + address;
        addressSpan.className = 'address-found';
        localStorage.setItem('kok_last_address', address);
        return true;
    }
    addressSpan.textContent = 'Τοποθεσία: Άγνωστη';
    addressSpan.className = 'address-placeholder';
    return false;
}

function loadSavedAddress() {
    const saved = localStorage.getItem('kok_last_address');
    const addressSpan = document.getElementById('addressText');
    if (saved && addressSpan) {
        addressSpan.textContent = 'Τοποθεσία: ' + saved;
        addressSpan.className = 'address-found';
    }
}