# Changelog — ΚΟΚ Τσέπης

Όλες οι σημαντικές αλλαγές στα δεδομένα και στην εφαρμογή καταγράφονται εδώ.
Η έκδοση δεδομένων (`DATA_VERSION`) ακολουθεί το σχήμα `YYYY.MM`.

---

## [2025.09.16] — 16 Σεπτεμβρίου 2026

### Προσθήκες — Μηχανή Αναζήτησης

- Greek stemmer — Αφαίρεση κοινών καταλήξεων για πτώσεις
  (π.χ. κράνος ↔ κράνους, φορτηγό ↔ φορτηγά)
- Per-token synonym expansion — Κάθε λέξη επεκτείνεται ξεχωριστά
- Fuzzy matching — Ανοχή σε typos (edit distance ≤ 1) για λέξεις ≥ 5 χαρακτήρων
- 2-level expansion — Επέκταση και των synonyms των synonyms
  (π.χ. παρκ → παρκάρισμα → στάθμευση)
- Stopword removal — Τόσο στο query όσο και στο corpus
- Article search — Αναζήτηση με κωδικό άρθρου (π.χ. 38§2, 7§11, 98§4)
- Unicode-aware tokenization (\p{L}\p{N})

### Προσθήκες — Σενάρια Καθημερινής Γλώσσας

- Νέο αρχείο scenarios.js με 40 σενάρια
- Scenario boost — Τα αποτελέσματα σεναρίου εμφανίζονται πρώτα

### Προσθήκες — Auto-suggest Dropdown

- Εμφανίζεται μετά από 2+ χαρακτήρες
- Τρεις ενότητες: Σενάριο, Παραβάσεις, Λέξεις-κλειδιά
- «Δες όλες τις X παραβάσεις →» button
- Debounce 200ms, κλείσιμο με Escape ή κλικ εκτός

### Αλλαγές — PDF Βεβαίωση Κλήσης

- Νέα θέση σύνοψης — Μετακίνηση πάνω από τις παραβάσεις
- Χρυσή γραμμή (#D9B36C) κάτω από το header
- Αφαίρεση υπογραφών και στοιχείων οδηγού/οχήματος
- Αφαίρεση emoji από επαγγελματικά PDF
- Ημερομηνία σε μορφή el-GR (16/9/2026)
- Ώρα 24h (14:57 αντί 2:57 μ.μ.)

### Αλλαγές — Modals

- Χρυσή γραμμή (border-top: 3px solid #D9B36C) σε όλα τα modals
- Νέο κουμπί κλεισίματος (modal-close-btn) με X πάνω δεξιά
- Backdrop blur (blur(3px))
- Εφαρμόστηκε σε: signModal, guideModal, updateModal, vehicleCheckModal
- Εξαίρεση: First Aid lightbox

### Αλλαγές — Λεξικά

- synonyms.js v2 — ~95 keys, ~320 synonyms
- keywords.js v2 — Καθαρισμός orphan IDs, νέα keywords
### Τεχνικές Αλλαγές

- sw.js — CACHE_VERSION → kok-v35
- ui.js — Auto-suggest dropdown + actions
- app.js — getSuggestions() hook, sortData() με boost

---

## [2025.09.15] — 15 Σεπτεμβρίου 2026

### Προσθήκες — Φάση 2.1 (Monitoring UI)

- data-version.json — Manifest έκδοσης δεδομένων
- data.js — DATA_VERSION, DATA_UPDATED, DATA_SOURCE, APP_VERSION
- index.html — Modal «Νέα Έκδοση Δεδομένων»
- app.js — checkVersionUpdate() + showUpdateModal()
- sw.js — Network-first για data-version.json

### Προσθήκες — Νομικά (Φάση 1)

- index.html — «Πηγή δεδομένων», «Αποποίηση Ευθύνης», «Πολιτική Απορρήτου»

### Διορθώσεις — Δεδομένα

- Κωδικοί άρθρων (IDs: 42, 44, 96, 222)
- Ποσά (IDs: 127 → 150€, 222 → 1.000€)
- Αφαιρέσεις (IDs: 20, 65, 89, 114, 224)
- Σχόλια για 30 km/h & νέο σύστημα υποτροπών

### Αφαιρέσεις — Δεδομένα

- 5 διπλότυπα (IDs: 129, 130, 137, 138, 168)

### Προσθήκες — Δεδομένα

- 14 νέες εγγραφές (IDs: 230–243)
- Τελικός αριθμός: 235 εγγραφές

---

## [Αναβλήθηκε επ' αόριστον]

- Φάση 2.2 — Web scraping search.et.gr
- Φάση 2.3 — Push notifications
- Φάση 2.4 — data.gov.gr API

Αιτιολόγηση: Το auto-monitoring απαιτεί ανθρώπινη επαλήθευση.
Το data.gov.gr παρέχει τα ίδια δεδομένα με το et.gr.

---

## [2025.08.01] — 1 Αυγούστου 2025

### Αρχική έκδοση

- Πρώτη έκδοση του data.js