// Global State
let currentUser = null;
let currentChapter = 0;
let currentQuestion = 0;
let testAnswers = [];
let testQuestions = [];
let allCharacters = [];
let chapterCharacters = {};

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadMorseData();
    goToPage('welcome');
});

function loadMorseData() {
    if (typeof morseDataArray !== 'undefined') {
        allCharacters = morseDataArray;
        prepareChapters();
    }
}

function prepareChapters() {
    chapterCharacters = {
        0: allCharacters.slice(0, 6),     // ก-ฮ
        1: allCharacters.slice(6, 13).concat(allCharacters.slice(0, 6)),     // ค-ญ + ก-ฮ
        2: allCharacters.slice(13, 19).concat(allCharacters.slice(0, 13)),   // ฎ-ณ + ก-ญ
        3: allCharacters.slice(19, 25).concat(allCharacters.slice(0, 19)),   // ด-ฬ + ก-ณ
        4: allCharacters.slice(25, 31).concat(allCharacters.slice(0, 25)),   // บ-ฟ + ก-ฬ
        5: allCharacters.slice(31, 36).concat(allCharacters.slice(0, 31)),   // ภ-ษ + ก-ฟ
        6: allCharacters.slice(36, 44).concat(allCharacters.slice(0, 36)),   // ซ-อ + ก-ษ
        7: allCharacters.slice(44, 50).concat(allCharacters.slice(0, 44)),   // สระยาว + ก-อ
        8: allCharacters.slice(50, 56).concat(allCharacters.slice(0, 50))    // สระสั้น + ก-สระยาว
    };
}

function goToPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + pageName).classList.add('active');

    if (pageName === 'learn') {
        renderChapters();
    } else if (pageName === 'home') {
        if (!currentUser && sessionStorage.getItem('guestMode') !== 'true') {
            goToPage('login');
        }
    }
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username && password) {
        currentUser = username;
        sessionStorage.setItem('currentUser', username);
        sessionStorage.removeItem('guestMode');
        goToPage('home');
    } else {
        alert('Please fill in all fields');
    }
}

function handleGuestLogin() {
    currentUser = 'Guest';
    sessionStorage.setItem('guestMode', 'true');
    goToPage('home');
}

function handleLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('guestMode');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    goToPage('login');
}

function renderChapters() {
    const list = document.getElementById('chapters-list');
    list.innerHTML = '';

    const chapterNames = [
        'สำนัก 1: ก - ฮ (6 ตัว)',
        'สำนัก 2: ค - ญ (7 ตัว)',
        'สำนัก 3: ฎ - ณ (6 ตัว)',
        'สำนัก 4: ด - ฬ (6 ตัว)',
        'สำนัก 5: บ - ฟ (6 ตัว)',
        'สำนัก 6: ภ - ษ (5 ตัว)',
        'สำนัก 7: ซ - อ (8 ตัว)',
        'สำนัก 8: สระยาว (6 ตัว)',
        'สำนัก 9: สระสั้น (6 ตัว)'
    ];

    chapterNames.forEach((name, index) => {
        const card = document.createElement('div');
        card.className = 'chapter-card';
        card.innerHTML = `
            <div style="display: flex; align-items: center; flex: 1;">
                <div class="chapter-number">${index + 1}</div>
                <div class="chapter-info">
                    <h3>${name}</h3>
                </div>
            </div>
            <div class="chapter-stars">⭐⭐⭐</div>
        `;
        card.onclick = () => startTest(index);
        list.appendChild(card);
    });
}

function startTest(chapterIndex) {
    currentChapter = chapterIndex;
    currentQuestion = 0;
    testAnswers = [];
    testQuestions = [];

    const characters = chapterCharacters[chapterIndex] || [];
    const selectedCharacters = characters.sort(() => 0.5 - Math.random()).slice(0, 6);

    testQuestions = selectedCharacters.map(char => ({
        character: char.character,
        morse: char.morse,
        options: getRandomOptions(char.character, selectedCharacters, 4)
    }));

    goToPage('test');
    showTestQuestion();
}

function getRandomOptions(correct, available, count) {
    let options = [correct];
    const others = available.filter(c => c.character !== correct);
    others.sort(() => 0.5 - Math.random());
    for (let i = 0; i < count - 1 && i < others.length; i++) {
        options.push(others[i].character);
    }
    return options.sort(() => 0.5 - Math.random());
}

function showTestQuestion() {
    if (currentQuestion >= testQuestions.length) {
        showTestResults();
        return;
    }

    const question = testQuestions[currentQuestion];
    const chapterNames = ['บท 1', 'บท 2', 'บท 3', 'บท 4', 'บท 5', 'บท 6', 'บท 7', 'บท 8', 'บท 9'];

    document.getElementById('test-chapter').textContent = `${chapterNames[currentChapter]} ข้อที่ ${currentQuestion + 1}/${testQuestions.length}`;
    document.getElementById('progress-text').textContent = `ข้อ ${currentQuestion + 1} จาก ${testQuestions.length}`;
    document.getElementById('progress-fill').style.width = ((currentQuestion / testQuestions.length) * 100) + '%';

    const morseDisplay = document.getElementById('test-morse');
    morseDisplay.textContent = question.morse.split('').join(' ');

    const optionsContainer = document.getElementById('test-options');
    optionsContainer.innerHTML = '';
    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        btn.onclick = () => selectOption(option, btn);
        optionsContainer.appendChild(btn);
    });

    document.getElementById('test-submit').textContent = '✅ ตรวจสอบ';
}

function selectOption(option, element) {
    document.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    testAnswers[currentQuestion] = option;
}

function submitTestAnswer() {
    if (testAnswers[currentQuestion] === undefined) {
        alert('Please select an option');
        return;
    }
    currentQuestion++;
    showTestQuestion();
}

function showTestResults() {
    let correct = 0;
    testQuestions.forEach((q, i) => {
        if (testAnswers[i] === q.character) correct++;
    });

    const percentage = Math.round((correct / testQuestions.length) * 100);
    let stars = '';
    if (percentage >= 80) stars = '⭐⭐⭐';
    else if (percentage >= 60) stars = '⭐⭐';
    else stars = '⭐';

    document.getElementById('score-text').textContent = `${correct}/${testQuestions.length}`;
    document.getElementById('stars').textContent = stars;
    document.getElementById('correct-count').textContent = correct;
    document.getElementById('wrong-count').textContent = testQuestions.length - correct;

    goToPage('results');
}

function retakeTest() {
    startTest(currentChapter);
}

function goToNextChapter() {
    if (currentChapter < 8) {
        startTest(currentChapter + 1);
    } else {
        alert('Congratulations! You completed all chapters!');
        goToPage('learn');
    }
}

function startPracticeMode(mode) {
    alert('Practice mode: ' + mode + ' (Coming soon!)');
}