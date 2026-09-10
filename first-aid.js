// ============================================================
// first-aid.js – Πρώτες Βοήθειες (Lightbox Full Screen)
// ============================================================

let metronomeInterval = null;
let timerInterval = null;
let timerSeconds = 120;
let audioCtx = null;
let isMetronomeActive = false;
let isTimerActive = false;
let currentCard = 'cpr';

// ============================================================
// ΑΝΟΙΓΜΑ / ΚΛΕΙΣΙΜΟ LIGHTBOX
// ============================================================
function openFirstAidLightbox() {
    const lightbox = document.getElementById('firstAidLightbox');
    lightbox.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    switchCard('cpr');
}

function closeFirstAidLightbox() {
    const lightbox = document.getElementById('firstAidLightbox');
    lightbox.style.display = 'none';
    document.body.style.overflow = '';
    stopMetronome();
    stopTimer();
}

// ============================================================
// ΕΝΑΛΛΑΓΗ ΚΑΡΤΑΣ
// ============================================================
function switchCard(card) {
    currentCard = card;
    const img = document.getElementById('lightboxImage');
    const tabs = document.querySelectorAll('.lightbox-tab');
    const metronomeGroup = document.getElementById('lightboxMetronomeGroup');
    const timerGroup = document.getElementById('lightboxTimerGroup');

    if (card === 'cpr') {
        img.src = 'cpr-card.png';
        img.alt = 'ΚΑΡΠΑ';
        metronomeGroup.style.display = 'flex';
        timerGroup.style.display = 'none';
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.card === 'cpr');
        });
    } else {
        img.src = 'aed-card.png';
        img.alt = 'AED';
        metronomeGroup.style.display = 'none';
        timerGroup.style.display = 'flex';
        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.card === 'aed');
        });
    }
}

// ============================================================
// ΜΕΤΡΟΝΟΜΟΣ 110 BPM
// ============================================================
function toggleMetronome() {
    if (isMetronomeActive) {
        stopMetronome();
    } else {
        startMetronome();
    }
}

function startMetronome() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const btn = document.getElementById('lightboxMetronomeBtn');
    const status = document.getElementById('lightboxMetronomeStatus');
    const indicator = document.getElementById('lightboxPulseIndicator');
    btn.classList.add('active');
    status.textContent = 'Διακοπή';
    indicator.classList.add('active');
    isMetronomeActive = true;
    const interval = 545;
    metronomeInterval = setInterval(() => {
        playClick();
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
        indicator.style.background = indicator.style.background === '#dc2626' ? '#94a3b8' : '#dc2626';
    }, interval);
}

function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }
    const btn = document.getElementById('lightboxMetronomeBtn');
    const status = document.getElementById('lightboxMetronomeStatus');
    const indicator = document.getElementById('lightboxPulseIndicator');
    btn.classList.remove('active');
    status.textContent = 'Έναρξη';
    indicator.classList.remove('active');
    indicator.style.background = '#94a3b8';
    isMetronomeActive = false;
}

function playClick() {
    if (!audioCtx) return;
    try {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.3;
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.05);
    } catch (e) {}
}

// ============================================================
// ΧΡΟΝΟΜΕΤΡΟ 2 ΛΕΠΤΩΝ
// ============================================================
function toggleTimer() {
    if (isTimerActive) {
        stopTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    timerSeconds = 120;
    const btn = document.getElementById('lightboxTimerBtn');
    const status = document.getElementById('lightboxTimerStatus');
    const display = document.getElementById('lightboxTimerDisplay');
    btn.classList.add('active');
    status.textContent = 'Διακοπή';
    isTimerActive = true;
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        if (timerSeconds <= 0) {
            stopTimer();
            playAlert();
            showToast('Ολοκληρώθηκε ο κύκλος των 2 λεπτών!', 'success');
            display.style.color = '#dc2626';
            setTimeout(() => { display.style.color = ''; }, 3000);
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    const btn = document.getElementById('lightboxTimerBtn');
    const status = document.getElementById('lightboxTimerStatus');
    btn.classList.remove('active');
    status.textContent = 'Έναρξη';
    isTimerActive = false;
    timerSeconds = 120;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.getElementById('lightboxTimerDisplay');
    const mins = Math.floor(timerSeconds / 60);
    const secs = timerSeconds % 60;
    display.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

function playAlert() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    try {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const oscillator = audioCtx.createOscillator();
                const gainNode = audioCtx.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioCtx.destination);
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.4;
                oscillator.start();
                oscillator.stop(audioCtx.currentTime + 0.1);
            }, i * 200);
        }
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
    } catch (e) {}
}

// ============================================================
// ΚΛΕΙΣΙΜΟ ΜΕ ESCAPE / CLICK ΕΞΩ
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFirstAidLightbox();
});

document.getElementById('firstAidLightbox').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFirstAidLightbox();
});

// ============================================================
// ΕΚΘΕΣΗ ΣΤΟ GLOBAL
// ============================================================
window.openFirstAidLightbox = openFirstAidLightbox;
window.closeFirstAidLightbox = closeFirstAidLightbox;
window.switchCard = switchCard;
window.toggleMetronome = toggleMetronome;
window.toggleTimer = toggleTimer;