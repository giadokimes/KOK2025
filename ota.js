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
    showToast('🏛️ Επιλέχθηκε: ' + name + ' (' + code + ')');
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
        showToast('⚠️ Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.');
        return;
    }
    geoInProgress = true;
    setGeoButtonState('loading');
    showToast('📍 Εντοπισμός τοποθεσίας...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocode(latitude, longitude);
            geoInProgress = false;
            setGeoButtonState('idle');
        },
        (error) => {
            console.error('Geolocation error:', error);
            let msg = '⚠️ Δεν ήταν δυνατός ο εντοπισμός. Επίλεξε ΟΤΑ χειροκίνητα.';
            if (error.code === error.PERMISSION_DENIED) {
                msg = '⚠️ Δεν δόθηκε άδεια τοποθεσίας. Επίλεξε ΟΤΑ χειροκίνητα.';
            }
            showToast(msg);
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
            showToast('⚠️ Η λίστα ΟΤΑ δεν φορτώθηκε. Δοκίμασε ξανά.');
            return;
        }

        // Nominatim (OpenStreetMap) — δωρεάν reverse geocoding, ΧΩΡΙΣ API key.
        // Usage policy: μέγιστο ~1 αίτημα/δευτερόλεπτο· εδώ καλείται μόνο
        // κατόπιν ρητού αιτήματος του χρήστη, οπότε δεν υπάρχει κίνδυνος.
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=el&zoom=12`;
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });
        if (!response.ok) {
            showToast('⚠️ Σφάλμα επικοινωνίας με τον server.');
            return;
        }
        const result = await response.json();
        const components = (result && result.address) || {};

        const municipality = components.municipality ||
                            components.city ||
                            components.town ||
                            components.city_district ||
                            components.suburb ||
                            components.village;

        if (municipality) {
            const normalized = municipality.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            let found = otaList.find(item => {
                const itemNorm = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                return itemNorm.includes(normalized) || normalized.includes(itemNorm);
            });
            if (found) {
                selectOta(found.name, found.code);
                showToast('✅ Εντοπίστηκε: ' + found.name + ' (' + found.code + ')');
            } else {
                showToast('📍 Εντοπίστηκε: ' + municipality + ' (δεν βρέθηκε σε ΟΤΑ)');
            }
        } else {
            showToast('⚠️ Δεν βρέθηκε δήμος στην τοποθεσία σου.');
        }
    } catch (error) {
        console.error('reverseGeocode error:', error);
        showToast('⚠️ Σφάλμα κατά τον εντοπισμό.');
    }
}