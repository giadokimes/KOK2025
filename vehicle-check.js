/* ΚΟΚ Τσέπης — Έλεγχος οχήματος / ασφάλισης
 *
 * Το OpenCar είναι η επίσημη υπηρεσία του gov.gr που επιτρέπει αναζήτηση
 * με αριθμό κυκλοφορίας και εμφανίζει, μεταξύ άλλων, αν το όχημα είναι
 * ασφαλισμένο και τις ημερομηνίες έναρξης/λήξης ασφάλισης.
 * Δεν υπάρχει εδώ μη εξουσιοδοτημένο scraping ή υποτιθέμενο private API.
 */
const OPENCAR_URL = 'https://www.gov.gr/el/services/1001612/opencar';

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

  // Αποθηκεύεται μόνο προσωρινά για να μπορεί να αντιγραφεί εύκολα στο OpenCar.
  try { sessionStorage.setItem('kok_last_vehicle_plate', plate); } catch (_) {}

  window.open(OPENCAR_URL, '_blank', 'noopener,noreferrer');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeVehicleCheck();
});

document.addEventListener('click', (e) => {
  const modal = document.getElementById('vehicleCheckModal');
  if (modal && e.target === modal) closeVehicleCheck();
});
