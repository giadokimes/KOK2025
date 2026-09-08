// ============================================================
// first-aid.js – Πρώτες Βοήθειες (ΚΑΡΠΑ + AED + 166/112)
// ============================================================

let metronomeInterval = null;
let timerInterval = null;
let timerSeconds = 120;
let audioCtx = null;
let isMetronomeActive = false;
let isTimerActive = false;

// ============================================================
// MODAL (BOTTOM SHEET)
// ============================================================
function openFirstAidModal() {
    const modal = document.getElementById('firstAidModal');
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeFirstAidModal() {
    const modal = document.getElementById('firstAidModal');
    modal.classList.remove('show');
    document.body.style.overflow = '';
    stopMetronome();
    stopTimer();
}

// ============================================================
// ΚΛΗΣΗ 166/112
// ============================================================
function makeCall() {
    if (confirm('Πατήστε OK για κλήση στο 166 (ΕΚΑΒ) ή Ακύρωση για 112 (Ευρωπαϊκός αριθμός έκτακτης ανάγκης)')) {
        window.location.href = 'tel:166';
    } else {
        window.location.href = 'tel:112';
    }
}

// ============================================================
// ΜΕΤΡΟΝΟΜΟΣ 110 BPM (ήχος + δόνηση)
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
    const btn = document.getElementById('metronomeBtn');
    const status = document.getElementById('metronomeStatus');
    const indicator = document.getElementById('pulseIndicator');
    btn.classList.add('active');
    status.textContent = 'Διακοπή';
    indicator.classList.add('active');
    isMetronomeActive = true;
    const interval = 545; // 110 BPM
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
    const btn = document.getElementById('metronomeBtn');
    const status = document.getElementById('metronomeStatus');
    const indicator = document.getElementById('pulseIndicator');
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
    const btn = document.getElementById('timerBtn');
    const status = document.getElementById('timerStatus');
    const display = document.getElementById('timerDisplay');
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
            showToast('⏰ Ολοκληρώθηκε ο κύκλος των 2 λεπτών!');
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
    const btn = document.getElementById('timerBtn');
    const status = document.getElementById('timerStatus');
    btn.classList.remove('active');
    status.textContent = 'Έναρξη';
    isTimerActive = false;
    timerSeconds = 120;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.getElementById('timerDisplay');
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
// ΚΛΕΙΣΙΜΟ MODAL ΜΕ ESCAPE / CLICK ΕΞΩ
// ============================================================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFirstAidModal();
});

document.getElementById('firstAidModal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeFirstAidModal();
});

// ============================================================
// ΕΚΘΕΣΗ ΤΗΣ ΣΥΝΑΡΤΗΣΗΣ ΓΙΑ LAZY LOADING
// ============================================================
window.openFirstAidModal = openFirstAidModal;