// ============================================================
// ota.js – ΚΩΔΙΚΟΣ ΟΤΑ & ΓΕΩΤΟΠΟΘΕΣΙΑ
// ============================================================

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
// ΓΕΩΤΟΠΟΘΕΣΙΑ (Nominatim / OpenStreetMap — χωρίς API key)
// ============================================================
// Σημείωση: η γεωτοποθεσία ΔΕΝ καλείται ποτέ αυτόματα· ενεργοποιείται
// μόνο όταν ο χρήστης πατήσει ρητά το κουμπί εντοπισμού (βλ. ui.js).
// Έτσι δεν καταναλώνεται το όριο αιτημάτων χωρίς λόγο, και ο χρήστης
// έχει πλήρη έλεγχο στο πότε ζητείται η άδεια τοποθεσίας.
let geoInProgress = false;

function detectLocation() {
    if (geoInProgress) return;
    if (!navigator.geolocation) {
        showToast('Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.', 'warning');
        return;
    }
    geoInProgress = true;
    setGeoButtonState('loading');
    showToast('Εντοπισμός τοποθεσίας...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocode(latitude, longitude);
            geoInProgress = false;
            setGeoButtonState('idle');
        },
        (error) => {
            console.error('Geolocation error:', error);
            let msg = 'Δεν ήταν δυνατός ο εντοπισμός. Επίλεξε ΟΤΑ χειροκίνητα.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = 'Δεν δόθηκε άδεια τοποθεσίας. Επίλεξε ΟΤΑ χειροκίνητα.';
            }
            showToast(msg, 'warning');
            geoInProgress = false;
            setGeoButtonState('idle');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function setGeoButtonState(state) {
    const btn = document.getElementById('geoBtn');
    if (!btn) return;
    btn.classList.toggle('loading', state === 'loading');
    btn.disabled = state === 'loading';
}

async function reverseGeocode(lat, lon) {
    try {
        // Περίμενε να φορτωθεί η λίστα ΟΤΑ
        let retries = 0;
        while (otaList.length === 0 && retries < 20) {
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }
        if (otaList.length === 0) {
            showToast('Η λίστα ΟΤΑ δεν φορτώθηκε. Δοκίμασε ξανά.', 'warning');
            return;
        }

        // OpenCage — επαναφορά κατόπιν ρητού αιτήματος: η Nominatim έδινε
        // ανακριβή αποτελέσματα σε περιοχές όπως η Καλαμαριά (επέστρεφε
        // "Θεσσαλονίκη" αντί για τον σωστό δήμο). Ενεργοποιείται πλέον
        // μόνο κατόπιν ρητού πατήματος του κουμπιού 📍 (όχι αυτόματα).
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
            updateAddress(components, data.results[0].formatted);
        } else {
            showToast('Δεν βρέθηκε τοποθεσία.', 'warning');
        }
    } catch (error) {
        console.error('reverseGeocode error:', error);
        showToast('Σφάλμα κατά τον εντοπισμό.', 'warning');
    }
}
// ============================================================
// ΔΙΕΥΘΥΝΣΗ ΤΟΠΟΘΕΣΙΑΣ
// ============================================================
// Εμφανίζει την πλησιέστερη οδό/διεύθυνση μετά από επιτυχή γεωτοποθεσία
// (κλήση μόνο μέσα από reverseGeocode, άρα μόνο κατόπιν ρητού πατήματος
// του κουμπιού 📍). Η τελευταία γνωστή διεύθυνση αποθηκεύεται τοπικά και
// εμφανίζεται ξανά στο επόμενο άνοιγμα της εφαρμογής, χωρίς νέο αίτημα.
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
        box.style.display = 'flex';
        localStorage.setItem('kok_last_address', address);
    } else {
        box.style.display = 'none';
    }
}

function loadSavedAddress() {
    const saved = localStorage.getItem('kok_last_address');
    const box = document.getElementById('locationAddress');
    const addressSpan = document.getElementById('addressText');
    if (saved && box && addressSpan) {
        addressSpan.textContent = saved;
        addressSpan.className = 'address-found';
        box.style.display = 'flex';
    }
}
