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
// ΕΜΦΑΝΙΣΗ ΔΙΕΥΘΥΝΣΗΣ
// ============================================================
function updateAddress(components) {
    const addressSpan = document.getElementById('addressText');
    if (!addressSpan) return; // Ασφάλεια αν το πεδίο λείπει

    const road = components.road || components.pedestrian || components.path || components.street || '';
    const houseNumber = components.house_number || '';

    if (road) {
        let address = road;
        if (houseNumber) {
            address += ' ' + houseNumber;
        }
        addressSpan.textContent = address;
        addressSpan.className = 'address-found';
        localStorage.setItem('kok_last_address', address);
    } else {
        addressSpan.textContent = 'Η διεύθυνση δεν είναι διαθέσιμη για αυτή την τοποθεσία';
        addressSpan.className = 'address-placeholder';
    }
}

function loadSavedAddress() {
    const saved = localStorage.getItem('kok_last_address');
    if (saved) {
        const addressSpan = document.getElementById('addressText');
        if (addressSpan) {
            addressSpan.textContent = saved;
            addressSpan.className = 'address-found';
        }
    }
}

// ============================================================
// ΓΕΩΤΟΠΟΘΕΣΙΑ (OpenCage API)
// ============================================================
function detectLocation() {
    if (!navigator.geolocation) {
        showToast('⚠️ Η συσκευή σου δεν υποστηρίζει γεωτοποθεσία.');
        const addressSpan = document.getElementById('addressText');
        if (addressSpan) {
            addressSpan.textContent = 'Η συσκευή δεν υποστηρίζει γεωτοποθεσία';
            addressSpan.className = 'address-placeholder';
        }
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
            const addressSpan = document.getElementById('addressText');
            if (addressSpan) {
                addressSpan.textContent = 'Η τοποθεσία δεν είναι διαθέσιμη';
                addressSpan.className = 'address-placeholder';
            }
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

async function reverseGeocode(lat, lon) {
    try {
        // Περίμενε να φορτωθεί η λίστα ΟΤΑ
        let retries = 0;
        while (otaList.length === 0 && retries < 50) {
            await new Promise(resolve => setTimeout(resolve, 300));
            retries++;
        }
        if (otaList.length === 0) {
            showToast('⚠️ Η λίστα ΟΤΑ δεν φορτώθηκε. Δοκίμασε ξανά.');
            const addressSpan = document.getElementById('addressText');
            if (addressSpan) {
                addressSpan.textContent = 'Η λίστα ΟΤΑ δεν φορτώθηκε';
                addressSpan.className = 'address-placeholder';
            }
            return;
        }

        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lon}&key=e693b1d11617416ba9df9797a1d0a66e&language=el`;
        const response = await fetch(url);
        if (!response.ok) {
            showToast('⚠️ Σφάλμα επικοινωνίας με τον server.');
            const addressSpan = document.getElementById('addressText');
            if (addressSpan) {
                addressSpan.textContent = 'Σφάλμα επικοινωνίας με τον server';
                addressSpan.className = 'address-placeholder';
            }
            return;
        }
        const data = await response.json();

        if (data && data.results && data.results.length > 0) {
            const components = data.results[0].components;
            
            // Εύρεση ΟΤΑ
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

            // Ενημέρωση διεύθυνσης
            updateAddress(components);
        } else {
            showToast('⚠️ Δεν βρέθηκε τοποθεσία.');
            const addressSpan = document.getElementById('addressText');
            if (addressSpan) {
                addressSpan.textContent = 'Δεν βρέθηκε διεύθυνση για αυτή την τοποθεσία';
                addressSpan.className = 'address-placeholder';
            }
        }
    } catch (error) {
        console.error('reverseGeocode error:', error);
        showToast('⚠️ Σφάλμα κατά τον εντοπισμό.');
        const addressSpan = document.getElementById('addressText');
        if (addressSpan) {
            addressSpan.textContent = 'Σφάλμα κατά την ανάκτηση διεύθυνσης';
            addressSpan.className = 'address-placeholder';
        }
    }
}