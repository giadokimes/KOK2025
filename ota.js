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
// ΓΕΩΤΟΠΟΘΕΣΙΑ (OpenCage API)
// ============================================================
function detectLocation() {
    if (!navigator.geolocation) {
        showToast('⚠️ Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.');
        return;
    }
    showToast('📍 Εντοπισμός τοποθεσίας...');
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const { latitude, longitude } = position.coords;
            await reverseGeocode(latitude, longitude);
        },
        (error) => {
            console.error('Geolocation error:', error);
            showToast('⚠️ Δεν ήταν δυνατός ο εντοπισμός. Επίλεξε ΟΤΑ χειροκίνητα.');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
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

        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=e693b1d11617416ba9df9797a1d0a66e&language=el`;
        const response = await fetch(url);
        if (!response.ok) {
            showToast('⚠️ Σφάλμα επικοινωνίας με τον server.');
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
                    showToast('✅ Εντοπίστηκε: ' + found.name + ' (' + found.code + ')');
                } else {
                    showToast('📍 Εντοπίστηκε: ' + municipality + ' (δεν βρέθηκε σε ΟΤΑ)');
                }
            } else {
                showToast('⚠️ Δεν βρέθηκε δήμος στην τοποθεσία σου.');
            }
        } else {
            showToast('⚠️ Δεν βρέθηκε τοποθεσία.');
        }
    } catch (error) {
        console.error('reverseGeocode error:', error);
        showToast('⚠️ Σφάλμα κατά τον εντοπισμό.');
    }
}