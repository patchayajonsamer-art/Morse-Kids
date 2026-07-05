// ==================== MORSE CODE DATA ====================
const MORSE = {
    // Letters A-Z
    'A': '.-',   'B': '-...', 'C': '-.-.',
    'D': '-..',  'E': '.',    'F': '..-.',
    'G': '--.',  'H': '....', 'I': '..',
    'J': '.---', 'K': '-.-',  'L': '.-..',
    'M': '--',   'N': '-.',   'O': '---',
    'P': '.--.',  'Q': '--.-', 'R': '.-.',
    'S': '...',  'T': '-',    'U': '..-',
    'V': '...-', 'W': '.--',  'X': '-..-',
    'Y': '-.--', 'Z': '--..',
    // Numbers 0-9
    '0': '-----', '1': '.----', '2': '..---',
    '3': '...--', '4': '....-', '5': '.....',
    '6': '-....', '7': '--...', '8': '---..',
    '9': '----.'
};

const LETTERS  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const NUMBERS  = '0123456789'.split('');
const ALL_CHARS = [...LETTERS, ...NUMBERS];

// ==================== STATE ====================
let currentCategory = 'letters';  // 'letters' | 'numbers'
let currentChar     = null;
let quizActive      = false;
let quizScore       = 0;
let quizBest        = parseInt(localStorage.getItem('morseBest') || '0', 10);
let quizTotal       = 0;
let quizAnswer      = null;   // correct morse for current question
let audioCtx        = null;

// ==================== AUDIO ====================
function getAudioContext() {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(startTime, duration, frequency = 700) {
    const ctx  = getAudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = frequency;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.005);
    gain.gain.setValueAtTime(0.4, startTime + duration - 0.005);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

/**
 * Play a morse string.
 * @param {string} morse  e.g. ".-."
 * @returns {Promise<void>} resolves when playback is done
 */
function playMorse(morse) {
    const dotMs  = 120;   // duration of a dot  in ms
    const dashMs = 360;   // duration of a dash in ms
    const gapMs  = 100;   // gap between symbols
    const freq   = 700;

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    let   t   = now;
    let   totalDuration = 0;

    morse.split('').forEach(symbol => {
        const dur = symbol === '.' ? dotMs / 1000 : dashMs / 1000;
        playTone(t, dur, freq);
        t += dur + gapMs / 1000;
        totalDuration += (symbol === '.' ? dotMs : dashMs) + gapMs;
    });

    return new Promise(resolve => {
        setTimeout(resolve, totalDuration);
    });
}

// ==================== VISUAL MORSE DISPLAY ====================
function buildMorseVisual(morse, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (const symbol of morse) {
        const el = document.createElement('span');
        el.className = symbol === '.' ? 'dot-shape' : 'dash-shape';
        container.appendChild(el);
    }
}

function buildMorseText(morse) {
    return morse.split('').map(s => s === '.' ? '·' : '−').join(' ');
}

function animateVisual(containerId, morse) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const dotMs  = 120;
    const dashMs = 360;
    const gapMs  = 100;
    let delay = 0;
    morse.split('').forEach((symbol, i) => {
        const dur = symbol === '.' ? dotMs : dashMs;
        setTimeout(() => {
            const shapes = container.querySelectorAll('.dot-shape, .dash-shape');
            if (shapes[i]) {
                shapes[i].classList.add('pulse');
                setTimeout(() => shapes[i].classList.remove('pulse'), dur + 100);
            }
        }, delay);
        delay += dur + gapMs;
    });
}

// ==================== LEARN TAB ====================
function renderLearnGrid() {
    const grid   = document.getElementById('learnGrid');
    const chars  = currentCategory === 'letters' ? LETTERS : NUMBERS;
    grid.innerHTML = '';
    chars.forEach(ch => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = ch;
        btn.setAttribute('aria-label', `Learn ${ch}`);
        btn.addEventListener('click', () => selectLearnChar(ch));
        grid.appendChild(btn);
    });
}

function selectLearnChar(ch) {
    currentChar = ch;
    const morse = MORSE[ch];

    // Update grid highlight
    document.querySelectorAll('#learnGrid .letter-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.textContent === ch);
    });

    // Update display
    document.getElementById('learnChar').textContent   = ch;
    document.getElementById('learnMorse').textContent  = buildMorseText(morse);
    document.getElementById('learnPlayBtn').disabled   = false;

    buildMorseVisual(morse, 'learnVisual');
    playLearnMorse();
}

async function playLearnMorse() {
    if (!currentChar) return;
    const morse  = MORSE[currentChar];
    const btn    = document.getElementById('learnPlayBtn');

    btn.disabled = true;
    btn.classList.add('playing');
    btn.textContent = '🎵 Playing…';

    // Animate visual shapes in sync with audio
    animateVisual('learnVisual', morse);
    await playMorse(morse);

    btn.disabled = false;
    btn.classList.remove('playing');
    btn.textContent = '🔊 Play Sound';
}

// ==================== QUIZ TAB ====================
function getQuizChars() {
    return ALL_CHARS;
}

function generateOptions(correct) {
    const pool    = getQuizChars().filter(c => c !== correct);
    const options = [correct];
    while (options.length < 4) {
        const rand = pool[Math.floor(Math.random() * pool.length)];
        if (!options.includes(rand)) options.push(rand);
    }
    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
    }
    return options;
}

function startQuiz() {
    quizActive = true;
    quizScore  = 0;
    quizTotal  = 0;
    updateScoreDisplay();
    document.getElementById('startBtn').style.display = 'none';
    document.getElementById('resultDisplay').innerHTML = '';
    nextQuestion();
}

function nextQuestion() {
    const chars  = getQuizChars();
    const ch     = chars[Math.floor(Math.random() * chars.length)];
    quizAnswer   = ch;
    quizTotal++;

    document.getElementById('quizChar').textContent = ch;
    document.getElementById('quizPlayBtn').disabled = false;
    document.getElementById('quizNum').textContent  = quizTotal;
    document.getElementById('resultDisplay').innerHTML = '';
    document.getElementById('nextBtn').style.display = 'none';

    const options = generateOptions(ch);
    const grid    = document.getElementById('optionsGrid');
    grid.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className   = 'option-btn';
        btn.textContent = buildMorseText(MORSE[opt]);
        btn.setAttribute('aria-label', `Option: ${buildMorseText(MORSE[opt])}`);
        btn.addEventListener('click', () => answerQuiz(opt, btn));
        grid.appendChild(btn);
    });
}

function answerQuiz(chosen, btnEl) {
    if (!quizActive) return;

    // Disable all options
    document.querySelectorAll('#optionsGrid .option-btn').forEach(b => {
        b.disabled = true;
    });
    document.getElementById('quizPlayBtn').disabled = true;

    const correct = chosen === quizAnswer;
    const resultDiv = document.getElementById('resultDisplay');

    if (correct) {
        quizScore++;
        btnEl.classList.add('correct');
        resultDiv.innerHTML = `
            <span class="result-emoji">🎉</span>
            <span class="result-text success">Correct! Great job! 🐱</span>`;
    } else {
        btnEl.classList.add('wrong');
        // Highlight correct answer
        document.querySelectorAll('#optionsGrid .option-btn').forEach(b => {
            if (b.textContent === buildMorseText(MORSE[quizAnswer])) {
                b.classList.add('correct');
            }
        });
        resultDiv.innerHTML = `
            <span class="result-emoji">😿</span>
            <span class="result-text fail">Not quite! The answer was: ${buildMorseText(MORSE[quizAnswer])}</span>`;
    }

    // Update best score
    if (quizScore > quizBest) {
        quizBest = quizScore;
        localStorage.setItem('morseBest', quizBest.toString());
    }

    updateScoreDisplay();
    document.getElementById('nextBtn').style.display = 'block';
}

function updateScoreDisplay() {
    document.getElementById('quizScore').textContent = quizScore;
    document.getElementById('quizBest').textContent  = quizBest;
    document.getElementById('quizNum').textContent   = quizTotal;
}

// ==================== CHART TAB ====================
function renderChart() {
    const grid = document.getElementById('chartGrid');
    grid.innerHTML = '';

    ALL_CHARS.forEach(ch => {
        const morse = MORSE[ch];
        const card  = document.createElement('div');
        card.className = 'chart-card';
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `${ch}: ${buildMorseText(morse)}`);
        card.title = `Click to hear ${ch}`;

        const dotsHtml = morse.split('').map(s =>
            `<span class="${s === '.' ? 'chart-dot' : 'chart-dash'}"></span>`
        ).join('');

        card.innerHTML = `
            <span class="chart-char">${ch}</span>
            <span class="chart-morse">${buildMorseText(morse)}</span>
            <div class="chart-dots">${dotsHtml}</div>`;

        card.addEventListener('click', () => playMorse(morse));
        card.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                playMorse(morse);
            }
        });

        grid.appendChild(card);
    });
}

// ==================== TAB NAVIGATION ====================
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            document.querySelectorAll('.tab-btn').forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            document.querySelectorAll('.tab-panel').forEach(p => {
                p.classList.remove('active');
            });

            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');
            document.getElementById(tab).classList.add('active');
        });
    });
}

// ==================== CATEGORY BUTTONS (LEARN) ====================
function initCategoryButtons() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            currentChar = null;

            // Reset display
            document.getElementById('learnChar').textContent   = '?';
            document.getElementById('learnMorse').innerHTML    = '<span class="hint">Select a character above</span>';
            document.getElementById('learnVisual').innerHTML   = '';
            document.getElementById('learnPlayBtn').disabled   = true;

            renderLearnGrid();
        });
    });
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCategoryButtons();
    renderLearnGrid();
    renderChart();

    // Learn play button
    document.getElementById('learnPlayBtn').addEventListener('click', playLearnMorse);

    // Quiz play button
    document.getElementById('quizPlayBtn').addEventListener('click', () => {
        if (quizAnswer) playMorse(MORSE[quizAnswer]);
    });

    // Quiz start / next buttons
    document.getElementById('startBtn').addEventListener('click', startQuiz);
    document.getElementById('nextBtn').addEventListener('click', () => {
        document.getElementById('nextBtn').style.display = 'none';
        nextQuestion();
    });

    // Show best score from storage
    document.getElementById('quizBest').textContent = quizBest;
});
