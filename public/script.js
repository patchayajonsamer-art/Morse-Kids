const LESSONS = [
    {
        id: 'thai-consonants',
        title: 'พยัญชนะไทย',
        subtitle: 'เริ่มจากตัวอักษรไทยที่ใช้บ่อยและจำง่าย',
        mascot: '🦆',
        difficulty: 3
    },
    {
        id: 'thai-vowels',
        title: 'สระไทย',
        subtitle: 'ฝึกสระสั้น สระยาว และรูปสระหลัก',
        mascot: '🐤',
        difficulty: 2
    },
    {
        id: 'thai-tones',
        title: 'วรรณยุกต์',
        subtitle: 'จำเครื่องหมายเสียงให้แม่นด้วยจังหวะสั้นยาว',
        mascot: '🌟',
        difficulty: 2
    },
    {
        id: 'english-upper',
        title: 'English Uppercase',
        subtitle: 'อักษรอังกฤษตัวพิมพ์ใหญ่สำหรับฝึกเพิ่มเติม',
        mascot: '🚀',
        difficulty: 4
    },
    {
        id: 'english-lower',
        title: 'English Lowercase',
        subtitle: 'บทสรุปท้ายทางสำหรับฝึกครบทั้งชุด',
        mascot: '🎈',
        difficulty: 4
    }
];

const STORAGE_KEYS = {
    settings: 'morseSettings',
    progress: 'morseProgress'
};

let settings = {
    speed: 300,
    frequency: 600,
    vibration: true,
    sound: true
};

let progress = {
    completedLessonIds: []
};

let currentLessonId = LESSONS[0].id;
let currentCharacterIndex = 0;
let currentQuestion = null;
let userAnswer = '';
let score = 0;
let totalQuestions = 0;
let audioContext = null;
let pressStart = 0;
let isPressed = false;

const elements = {};

document.addEventListener('DOMContentLoaded', () => {
    cacheElements();
    loadSettings();
    loadProgress();
    setupEventListeners();
    setCurrentLesson(getFirstUnlockedLesson().id, 0);
    renderLessonCards();
    renderPracticeLessons();
    updateProgressBadge();
    updateSettingsUI();
    updateLessonView();
    generateQuestion();
    openSection('home');
});

function cacheElements() {
    const ids = [
        'progressBadge',
        'lessonList',
        'lessonProgressText',
        'lessonLabel',
        'lessonTitle',
        'lessonDifficulty',
        'lessonMascot',
        'selectedCharacter',
        'morseVisual',
        'characterRail',
        'referenceText',
        'prevCharBtn',
        'nextCharBtn',
        'playMorseBtn',
        'backHomeBtn',
        'practiceLessonLabel',
        'practiceLessonList',
        'questionCharacter',
        'questionMorse',
        'userAnswer',
        'resultIcon',
        'testPad',
        'clearBtn',
        'checkBtn',
        'score',
        'totalQuestions',
        'speedSlider',
        'speedValue',
        'frequencySlider',
        'frequencyValue',
        'vibrationToggle',
        'soundToggle'
    ];

    ids.forEach((id) => {
        elements[id] = document.getElementById(id);
    });
}

function setupEventListeners() {
    document.querySelectorAll('.tab-btn').forEach((button) => {
        button.addEventListener('click', () => openSection(button.dataset.section));
    });

    elements.lessonList.addEventListener('click', (event) => {
        const card = event.target.closest('[data-lesson-id]');
        if (!card || card.disabled) return;

        setCurrentLesson(card.dataset.lessonId, 0);
        openSection('lesson');
    });

    elements.practiceLessonList.addEventListener('click', (event) => {
        const button = event.target.closest('[data-practice-lesson-id]');
        if (!button || button.disabled) return;

        setCurrentLesson(button.dataset.practiceLessonId, 0);
        updateLessonView();
        generateQuestion();
        openSection('practice');
    });

    elements.characterRail.addEventListener('click', (event) => {
        const button = event.target.closest('[data-character-index]');
        if (!button) return;

        currentCharacterIndex = Number(button.dataset.characterIndex);
        updateLessonView();
    });

    elements.playMorseBtn.addEventListener('click', () => {
        playCurrentCharacter();
    });

    elements.prevCharBtn.addEventListener('click', () => moveCharacter(-1));
    elements.nextCharBtn.addEventListener('click', () => moveCharacter(1));
    elements.backHomeBtn.addEventListener('click', () => openSection('home'));
    elements.clearBtn.addEventListener('click', clearAnswer);
    elements.checkBtn.addEventListener('click', checkAnswer);

    elements.speedSlider.addEventListener('input', (event) => {
        settings.speed = Number(event.target.value);
        updateSettingsUI();
        saveSettings();
    });

    elements.frequencySlider.addEventListener('input', (event) => {
        settings.frequency = Number(event.target.value);
        updateSettingsUI();
        saveSettings();
    });

    elements.vibrationToggle.addEventListener('change', (event) => {
        settings.vibration = event.target.checked;
        saveSettings();
    });

    elements.soundToggle.addEventListener('change', (event) => {
        settings.sound = event.target.checked;
        saveSettings();
    });

    setupPracticePad();
}

function openSection(sectionId) {
    document.querySelectorAll('.screen').forEach((section) => {
        section.classList.toggle('active', section.id === sectionId);
    });

    document.querySelectorAll('.tab-btn').forEach((button) => {
        button.classList.toggle('active', button.dataset.section === sectionId);
    });

    if (sectionId === 'practice') {
        generateQuestion();
    }
}

function renderLessonCards() {
    const unlockedCount = getUnlockedLessonCount();

    elements.lessonList.innerHTML = LESSONS.map((lesson, index) => {
        const unlocked = index < unlockedCount;
        const stars = '★'.repeat(lesson.difficulty);

        return `
            <button class="lesson-card-button ${unlocked ? 'unlocked' : 'locked'}" type="button" data-lesson-id="${lesson.id}" ${unlocked ? '' : 'disabled'}>
                <div class="lesson-card-top">
                    <div class="lesson-number">${String(index + 1).padStart(2, '0')}</div>
                    <span class="lesson-badge">${unlocked ? 'เปิดแล้ว' : 'ล็อกอยู่'}</span>
                </div>
                <div class="lesson-summary">
                    <h3>${lesson.mascot} ${lesson.title}</h3>
                    <p>${lesson.subtitle}</p>
                </div>
                <div class="lesson-card-bottom">
                    <span class="lesson-stars" aria-label="difficulty ${lesson.difficulty}">${stars}</span>
                    <span>${unlocked ? 'เริ่มบทเรียน' : 'ปลดล็อกเมื่อผ่านสำนักก่อนหน้า'}</span>
                </div>
            </button>
        `;
    }).join('');
}

function renderPracticeLessons() {
    const unlockedCount = getUnlockedLessonCount();

    elements.practiceLessonList.innerHTML = LESSONS.map((lesson, index) => `
        <button
            class="practice-lesson-btn ${lesson.id === currentLessonId ? 'active' : ''}"
            type="button"
            data-practice-lesson-id="${lesson.id}"
            ${index < unlockedCount ? '' : 'disabled'}
        >
            ${lesson.mascot} ${lesson.title}
        </button>
    `).join('');
}

function setCurrentLesson(lessonId, characterIndex = 0) {
    const lesson = getLessonById(lessonId);
    if (!lesson) return;

    currentLessonId = lessonId;
    currentCharacterIndex = Math.max(0, Math.min(characterIndex, getLessonCharacters(lessonId).length - 1));

    renderPracticeLessons();
}

function updateLessonView() {
    const lesson = getLessonById(currentLessonId);
    const characters = getLessonCharacters(currentLessonId);
    const character = characters[currentCharacterIndex];

    if (!lesson || !character) return;

    elements.lessonLabel.textContent = `สำนัก ${getLessonIndex(currentLessonId) + 1}`;
    elements.lessonTitle.textContent = lesson.title;
    elements.lessonDifficulty.textContent = '★'.repeat(lesson.difficulty);
    elements.lessonMascot.textContent = lesson.mascot;
    elements.selectedCharacter.textContent = character.char;
    elements.lessonProgressText.textContent = `สำนัก ${getLessonIndex(currentLessonId) + 1} ข้อที่ ${currentCharacterIndex + 1}/${characters.length}`;
    elements.referenceText.textContent = `${character.char} อยู่ในหมวด ${lesson.title} และใช้รหัสมอร์ส ${character.morse} ลองฟังเสียง อ่านจุดกับขีด แล้วแตะข้อก่อนหน้าหรือข้อถัดไปเพื่อฝึกจำทีละตัวอย่างเป็นลำดับ.`;
    elements.practiceLessonLabel.textContent = `กำลังฝึก: ${lesson.title}`;

    renderMorseVisual(character.morse);
    renderCharacterRail(characters);

    elements.prevCharBtn.disabled = currentCharacterIndex === 0;
    elements.nextCharBtn.textContent = currentCharacterIndex === characters.length - 1 ? 'จบสำนัก ✓' : 'ข้อถัดไป →';
}

function renderCharacterRail(characters) {
    elements.characterRail.innerHTML = characters.map((item, index) => `
        <button class="character-pill ${index === currentCharacterIndex ? 'active' : ''}" type="button" data-character-index="${index}">
            ${item.char}
        </button>
    `).join('');
}

function renderMorseVisual(morse) {
    const symbols = morse.split(' ').filter(Boolean);

    elements.morseVisual.innerHTML = symbols.map((symbol) => `
        <span class="morse-symbol ${symbol === '−' ? 'dash' : 'dot'}">${symbol}</span>
    `).join('');
}

function moveCharacter(direction) {
    const characters = getLessonCharacters(currentLessonId);
    const nextIndex = currentCharacterIndex + direction;

    if (direction > 0 && currentCharacterIndex === characters.length - 1) {
        completeCurrentLesson();
        const nextLesson = getLessonByIndex(getLessonIndex(currentLessonId) + 1);

        if (nextLesson && isLessonUnlocked(getLessonIndex(nextLesson.id))) {
            setCurrentLesson(nextLesson.id, 0);
        } else {
            currentCharacterIndex = 0;
        }

        renderLessonCards();
        renderPracticeLessons();
        updateProgressBadge();
        updateLessonView();
        return;
    }

    if (nextIndex < 0 || nextIndex >= characters.length) return;

    currentCharacterIndex = nextIndex;
    updateLessonView();
}

function completeCurrentLesson() {
    const lessonId = currentLessonId;
    const completionIndex = progress.completedLessonIds.length;

    if (LESSONS[completionIndex] && LESSONS[completionIndex].id === lessonId) {
        progress.completedLessonIds.push(lessonId);
        saveProgress();
    }
}

function updateProgressBadge() {
    elements.progressBadge.textContent = `🦆 ผ่าน ${progress.completedLessonIds.length} / ${LESSONS.length} สำนัก`;
}

function setupPracticePad() {
    const pad = elements.testPad;

    const startPress = (event) => {
        event.preventDefault();
        pressStart = Date.now();
        isPressed = true;
        pad.classList.add('active');
        playTone();
    };

    const endPress = (event) => {
        event.preventDefault();
        if (!isPressed) return;

        const pressDuration = Date.now() - pressStart;
        const symbol = pressDuration > 200 ? '−' : '·';
        userAnswer += symbol;
        isPressed = false;
        pad.classList.remove('active');
        updateUserAnswer();
    };

    pad.addEventListener('mousedown', startPress);
    pad.addEventListener('mouseup', endPress);
    pad.addEventListener('mouseleave', endPress);
    pad.addEventListener('touchstart', startPress, { passive: false });
    pad.addEventListener('touchend', endPress, { passive: false });
}

function generateQuestion() {
    const characters = getLessonCharacters(currentLessonId);
    if (!characters.length) return;

    currentQuestion = characters[Math.floor(Math.random() * characters.length)];
    userAnswer = '';
    totalQuestions += 1;

    elements.questionCharacter.textContent = currentQuestion.char;
    elements.questionMorse.textContent = currentQuestion.morse;
    elements.resultIcon.textContent = '';
    elements.score.textContent = score;
    elements.totalQuestions.textContent = totalQuestions;
    updateUserAnswer();

    playMorse(currentQuestion.morse);
}

function checkAnswer() {
    if (!currentQuestion) return;

    const expected = currentQuestion.morse.replace(/\s/g, '');
    const received = userAnswer.replace(/\s/g, '');

    if (expected === received) {
        score += 1;
        elements.resultIcon.textContent = '✅ เก่งมาก!';
        elements.resultIcon.style.color = 'var(--success)';
    } else {
        elements.resultIcon.textContent = '❌ ลองอีกครั้ง';
        elements.resultIcon.style.color = 'var(--danger)';
    }

    elements.score.textContent = score;

    setTimeout(() => {
        generateQuestion();
    }, 1200);
}

function clearAnswer() {
    userAnswer = '';
    elements.resultIcon.textContent = '';
    updateUserAnswer();
}

function updateUserAnswer() {
    elements.userAnswer.textContent = userAnswer || 'แตะเพื่อเริ่มตอบ';
}

function playCurrentCharacter() {
    const characters = getLessonCharacters(currentLessonId);
    const character = characters[currentCharacterIndex];
    if (character) {
        playMorse(character.morse);
    }
}

function playMorse(morse) {
    if (!morse || (!settings.sound && !settings.vibration)) return;

    const symbols = morse.split(' ').filter(Boolean);
    let delay = 0;

    symbols.forEach((symbol) => {
        if (symbol === '·') {
            setTimeout(() => playDot(), delay);
            delay += settings.speed;
        } else if (symbol === '−') {
            setTimeout(() => playDash(), delay);
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
    if (!settings.sound) return;

    try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = settings.frequency;
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
        console.log('Audio not supported', error);
    }
}

function vibrate(duration) {
    if (settings.vibration && navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

function saveSettings() {
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadSettings() {
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);
    if (!savedSettings) return;

    settings = { ...settings, ...JSON.parse(savedSettings) };
}

function updateSettingsUI() {
    elements.speedSlider.value = settings.speed;
    elements.speedValue.textContent = `${settings.speed}ms`;
    elements.frequencySlider.value = settings.frequency;
    elements.frequencyValue.textContent = `${settings.frequency}Hz`;
    elements.vibrationToggle.checked = settings.vibration;
    elements.soundToggle.checked = settings.sound;
}

function saveProgress() {
    localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(progress));
}

function loadProgress() {
    const savedProgress = localStorage.getItem(STORAGE_KEYS.progress);
    if (!savedProgress) return;

    const parsed = JSON.parse(savedProgress);
    progress.completedLessonIds = Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [];
}

function getLessonById(lessonId) {
    return LESSONS.find((lesson) => lesson.id === lessonId);
}

function getLessonByIndex(index) {
    return LESSONS[index] || null;
}

function getLessonIndex(lessonId) {
    return LESSONS.findIndex((lesson) => lesson.id === lessonId);
}

function getLessonCharacters(lessonId) {
    return morseData[lessonId] || [];
}

function getUnlockedLessonCount() {
    return Math.min(progress.completedLessonIds.length + 1, LESSONS.length);
}

function isLessonUnlocked(index) {
    return index < getUnlockedLessonCount();
}

function getFirstUnlockedLesson() {
    return LESSONS[Math.max(0, getUnlockedLessonCount() - 1)] || LESSONS[0];
}
