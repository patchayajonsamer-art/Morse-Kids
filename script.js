// Settings
let settings = {
    speed: 300,
    frequency: 600,
    vibration: true,
    sound: true
};

// State
let currentCharacter = null;
let currentCategory = 'thai-consonants';
let userAnswer = '';
let score = 0;
let totalQuestions = 0;
let currentTestCategory = 'thai-consonants';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadSettings();
    setupTouchPads();
    loadCategoryLetters('thai-consonants', 'learn');
    selectFirstCharacter();
}

// Navigation
function setupEventListeners() {
    // Nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchSection(e.target.dataset.section);
        });
    });

    // Category buttons for Learn
    document.querySelectorAll('#learn .category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchCategory(e.target.dataset.category, 'learn');
        });
    });

    // Category buttons for Test
    document.querySelectorAll('#test .category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchCategory(e.target.dataset.category, 'test');
        });
    });

    // Check answer button
    document.getElementById('checkBtn').addEventListener('click', checkAnswer);

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearAnswer);

    // Settings sliders
    document.getElementById('speedSlider').addEventListener('input', (e) => {
        settings.speed = parseInt(e.target.value);
        document.getElementById('speedValue').textContent = settings.speed + 'ms';
        saveSettings();
    });

    document.getElementById('frequencySlider').addEventListener('input', (e) => {
        settings.frequency = parseInt(e.target.value);
        document.getElementById('frequencyValue').textContent = settings.frequency + 'Hz';
        saveSettings();
    });

    document.getElementById('vibrationToggle').addEventListener('change', (e) => {
        settings.vibration = e.target.checked;
        saveSettings();
    });

    document.getElementById('soundToggle').addEventListener('change', (e) => {
        settings.sound = e.target.checked;
        saveSettings();
    });
}

function switchSection(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
    });

    // Show selected section
    document.getElementById(section).classList.add('active');

    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');

    // Initialize section
    if (section === 'test') {
        generateQuestion();
    }
}

function switchCategory(category, section) {
    loadCategoryLetters(category, section);

    if (section === 'learn') {
        currentCategory = category;
        selectFirstCharacter();
    } else if (section === 'test') {
        currentTestCategory = category;
        generateQuestion();
    }

    // Update category buttons
    const buttons = section === 'learn' 
        ? document.querySelectorAll('#learn .category-btn')
        : document.querySelectorAll('#test .category-btn');

    buttons.forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
}

function loadCategoryLetters(category, section) {
    const grid = section === 'learn' 
        ? document.getElementById('letterGrid')
        : null;

    if (!grid) return;

    grid.innerHTML = '';
    const data = morseData[category] || [];

    data.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'letter-btn';
        btn.textContent = item.char;
        btn.addEventListener('click', () => {
            selectLetter(item.char);
        });
        grid.appendChild(btn);
    });
}

// Learn Section
function selectLetter(char) {
    currentCharacter = char;
    const morse = getMorseCode(char);

    // Update UI
    document.querySelectorAll('.letter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target?.classList.add('active');

    // Display
    document.getElementById('selectedCharacter').textContent = char;
    document.getElementById('morseCode').textContent = morse;

    // Play
    playMorse(morse);
}

function selectFirstCharacter() {
    const firstBtn = document.querySelector('#learn .letter-btn');
    if (firstBtn) {
        selectLetter(firstBtn.textContent);
        firstBtn.classList.add('active');
    }
}

// Touch Pad - Learn
function setupTouchPads() {
    const learnPad = document.querySelector('.learn-pad');
    const testPad = document.querySelector('.test-pad');

    // Learn pad - Mouse
    learnPad.addEventListener('mousedown', () => {
        if (currentCharacter) {
            learnPad.classList.add('active');
            playMorse(getMorseCode(currentCharacter));
        }
    });

    learnPad.addEventListener('mouseup', () => {
        learnPad.classList.remove('active');
    });

    learnPad.addEventListener('mouseleave', () => {
        learnPad.classList.remove('active');
    });

    // Learn pad - Touch
    learnPad.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (currentCharacter) {
            learnPad.classList.add('active');
            playMorse(getMorseCode(currentCharacter));
        }
    });

    learnPad.addEventListener('touchend', (e) => {
        e.preventDefault();
        learnPad.classList.remove('active');
    });

    // Test pad - Handle press timing
    let pressStart = 0;
    let isPressed = false;

    testPad.addEventListener('mousedown', () => {
        pressStart = Date.now();
        isPressed = true;
        testPad.classList.add('active');
        playTone();
    });

    testPad.addEventListener('mouseup', () => {
        if (isPressed) {
            const pressDuration = Date.now() - pressStart;
            const symbol = pressDuration > 200 ? '−' : '·';
            userAnswer += symbol;
            document.getElementById('userAnswer').textContent = userAnswer || '−−−';
            isPressed = false;
            testPad.classList.remove('active');
        }
    });

    testPad.addEventListener('mouseleave', () => {
        if (isPressed) {
            const pressDuration = Date.now() - pressStart;
            const symbol = pressDuration > 200 ? '−' : '·';
            userAnswer += symbol;
            document.getElementById('userAnswer').textContent = userAnswer || '−−−';
            isPressed = false;
            testPad.classList.remove('active');
        }
    });

    // Test pad - Touch events
    testPad.addEventListener('touchstart', (e) => {
        e.preventDefault();
        pressStart = Date.now();
        isPressed = true;
        testPad.classList.add('active');
        playTone();
    });

    testPad.addEventListener('touchend', (e) => {
        e.preventDefault();
        if (isPressed) {
            const pressDuration = Date.now() - pressStart;
            const symbol = pressDuration > 200 ? '−' : '·';
            userAnswer += symbol;
            document.getElementById('userAnswer').textContent = userAnswer || '−−−';
            isPressed = false;
            testPad.classList.remove('active');
        }
    });
}

// Test Section
function generateQuestion() {
    const data = morseData[currentTestCategory] || [];
    if (data.length === 0) return;

    const randomIndex = Math.floor(Math.random() * data.length);
    currentCharacter = data[randomIndex].char;

    userAnswer = '';
    totalQuestions++;

    document.getElementById('questionCharacter').textContent = currentCharacter;
    document.getElementById('questionMorse').textContent = getMorseCode(currentCharacter);
    document.getElementById('userAnswer').textContent = '−−−';
    document.getElementById('totalQuestions').textContent = totalQuestions;
    document.getElementById('score').textContent = score;
    document.getElementById('resultIcon').textContent = '';

    // Auto-play the question
    playMorse(getMorseCode(currentCharacter));
}

function checkAnswer() {
    const correctMorse = getMorseCode(currentCharacter).replace(/\s/g, '');
    const userMorse = userAnswer.replace(/\s/g, '');

    const resultIcon = document.getElementById('resultIcon');

    if (correctMorse === userMorse) {
        score++;
        resultIcon.textContent = '✅';
    } else {
        resultIcon.textContent = '❌';
    }

    document.getElementById('score').textContent = score;

    // Next question after delay
    setTimeout(() => {
        generateQuestion();
    }, 1500);
}

function clearAnswer() {
    userAnswer = '';
    document.getElementById('userAnswer').textContent = '−−−';
    document.getElementById('resultIcon').textContent = '';
}

// Audio Functions
function playMorse(morse) {
    if (!settings.sound && !settings.vibration) return;

    const dots = morse.split(' ');
    let delay = 0;

    dots.forEach((symbol) => {
        if (symbol === '·') {
            setTimeout(() => {
                playDot();
            }, delay);
            delay += settings.speed;
        } else if (symbol === '−') {
            setTimeout(() => {
                playDash();
            }, delay);
            delay += settings.speed * 3;
        }
        delay += settings.speed;
    });
}

function playDot() {
    if (settings.sound) {
        playTone(settings.speed);
    }
    if (settings.vibration) {
        vibrate(settings.speed);
    }
}

function playDash() {
    if (settings.sound) {
        playTone(settings.speed * 3);
    }
    if (settings.vibration) {
        vibrate(settings.speed * 3);
    }
}

function playTone(duration = 100) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = settings.frequency;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (e) {
        console.log('Audio not supported');
    }
}

function vibrate(duration) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Settings
function saveSettings() {
    localStorage.setItem('morseSettings', JSON.stringify(settings));
}

function loadSettings() {
    const saved = localStorage.getItem('morseSettings');
    if (saved) {
        settings = JSON.parse(saved);
        document.getElementById('speedSlider').value = settings.speed;
        document.getElementById('speedValue').textContent = settings.speed + 'ms';
        document.getElementById('frequencySlider').value = settings.frequency;
        document.getElementById('frequencyValue').textContent = settings.frequency + 'Hz';
        document.getElementById('vibrationToggle').checked = settings.vibration;
        document.getElementById('soundToggle').checked = settings.sound;
    }
}