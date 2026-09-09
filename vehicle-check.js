/* ΚΟΚ Τσέπης — Έλεγχος οχήματος / ασφάλισης
 *
 * Το OpenCar είναι η επίσημη υπηρεσία του gov.gr.
 * Δεν υποστηρίζει προ-συμπλήρωση πινακίδας μέσω URL.
 */

// Σωστό URL – απευθείας στη φόρμα με το CAPTCHA
const OPENCAR_URL = 'https://dilosi.services.gov.gr/templates/VEHICLE-INSURANCE/create';

function normalizePlate(value) {
    return (value || '').toUpperCase().replace(/[\s-]/g, '').trim();
}

function openVehicleCheck() {
    const modal = document.getElementById('vehicleCheckModal');
    if (!modal) return;
    modal.style.display = 'flex';
    const input = document.getElementById('vehiclePlateInput');
    if (input) {
        input.focus();
        input.select();
        // Αν υπάρχει αποθηκευμένη πινακίδα από προηγούμενη φορά, τη βάζουμε
        const saved = sessionStorage.getItem('kok_last_vehicle_plate');
        if (saved) input.value = saved;
    }
    document.body.classList.add('modal-open');
}

function closeVehicleCheck() {
    const modal = document.getElementById('vehicleCheckModal');
    if (modal) modal.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function openOpenCar() {
    const input = document.getElementById('vehiclePlateInput');
    const plate = normalizePlate(input ? input.value : '');
    if (!plate) {
        if (typeof showToast === 'function') showToast('⚠️ Συμπλήρωσε αριθμό κυκλοφορίας.');
        else alert('Συμπλήρωσε αριθμό κυκλοφορίας.');
        if (input) input.focus();
        return;
    }

    // Αποθήκευση για να την ξαναβρεί ο χρήστης
    sessionStorage.setItem('kok_last_vehicle_plate', plate);

    // Αντιγραφή στο clipboard για εύκολη επικόλληση στη φόρμα
    try {
        navigator.clipboard.writeText(plate).then(() => {
            if (typeof showToast === 'function') {
                showToast('✅ Η πινακίδα αντιγράφηκε στο πρόχειρο!');
            }
        }).catch(() => {});
    } catch (_) {}

    // Άνοιγμα της επίσημης σελίδας σε νέα καρτέλα
    window.open(OPENCAR_URL, '_blank', 'noopener,noreferrer');
}

// Κλείσιμο με Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeVehicleCheck();
});

// Κλείσιμο με κλικ έξω από το modal
document.addEventListener('click', (e) => {
    const modal = document.getElementById('vehicleCheckModal');
    if (modal && e.target === modal) closeVehicleCheck();
});

// Έκθεση συναρτήσεων στο global
window.openVehicleCheck = openVehicleCheck;
window.closeVehicleCheck = closeVehicleCheck;