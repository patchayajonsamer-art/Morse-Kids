import { LESSONS, getLessonById, buildLessonCharacters } from '../data/lessons.js';
import { getMorseForCharacter } from '../data/morseData.js';
import { redirectIfLoggedOut } from './auth.js';
import { getActiveProfile, getCurrentLessonNumber, getTotals, getUnlockedLesson, logoutActiveProfile, playMorseCode, updateActiveProfile } from './morse.js';
const page = document.body.dataset.page;
redirectIfLoggedOut();
if (page === 'lessons') initializeLessonsPage();
if (page === 'lesson-content') initializeLessonContentPage();
if (page === 'profile') initializeProfilePage();
function initializeLessonsPage() {
  const profile = getActiveProfile(); if (!profile) return;
  const totals = getTotals(profile); const currentLesson = getCurrentLessonNumber(profile);
  document.getElementById('headerNickname').textContent = profile.nickname;
  document.getElementById('headerEmail').textContent = profile.email;
  document.getElementById('headerLevel').textContent = currentLesson;
  document.getElementById('headerStars').textContent = totals.totalStars;
  document.getElementById('progressSummary').textContent = `ผ่าน ${totals.completedLessons} ด่าน · ดาว ${totals.totalStars} · คะแนน ${totals.totalScore}`;
  document.getElementById('progressBarFill').style.width = `${Math.min(100, (totals.completedLessons / LESSONS.length) * 100)}%`;
  renderLessonCards(profile, 'thaiLessons', (lesson) => lesson.id <= 17);
  renderLessonCards(profile, 'englishLessons', (lesson) => lesson.id >= 18);
  setupAnalytics(profile, totals);
  document.getElementById('logoutButton').addEventListener('click', handleLogout);
}
function renderLessonCards(profile, containerId, predicate) {
  const container = document.getElementById(containerId); container.innerHTML = '';
  LESSONS.filter(predicate).forEach((lesson) => {
    const lessonCharacters = buildLessonCharacters(lesson.id, profile.nickname);
    const progress = profile.progress[String(lesson.id)] || {};
    const unlocked = getUnlockedLesson(profile, lesson.id);
    const card = document.createElement('article');
    card.className = `lesson-card${unlocked ? '' : ' locked'}`;
    card.innerHTML = `<div class="lesson-card-header"><div class="lesson-card-number">${lesson.id}</div><div><h3>${lesson.subtitle}</h3><p>${lessonCharacters.join(' · ')}</p></div></div><div class="lesson-card-footer"><span class="lesson-card-tag">ดาว ${progress.stars || 0} / 3</span><a class="lesson-action" href="${unlocked ? `lesson-content.html?lesson=${lesson.id}` : '#'}" aria-disabled="${unlocked ? 'false' : 'true'}">${unlocked ? 'เริ่มเรียน' : 'ล็อกอยู่'}</a></div>`;
    container.appendChild(card);
  });
}
function setupAnalytics(profile, totals) {
  const dialog = document.getElementById('analyticsDialog');
  const stats = document.getElementById('analyticsStats');
  const lessonList = document.getElementById('analyticsLessons');
  stats.innerHTML = `<div class="analytics-stat"><strong>${totals.completedLessons}</strong><span>ด่านที่ผ่าน</span></div><div class="analytics-stat"><strong>${totals.totalStars}</strong><span>ดาวสะสม</span></div><div class="analytics-stat"><strong>${totals.successRate}%</strong><span>ความสำเร็จรวม</span></div>`;
  lessonList.innerHTML = LESSONS.map((lesson) => { const progress = profile.progress[String(lesson.id)] || {}; return `<div class="analytics-item"><strong>${lesson.title}</strong><span>${lesson.subtitle}</span><span>ดาว ${progress.stars || 0} · คะแนน ${progress.bestScore || 0}</span></div>`; }).join('');
  document.getElementById('analyticsButton').addEventListener('click', () => dialog.showModal());
  document.getElementById('closeAnalytics').addEventListener('click', () => dialog.close());
}
function initializeLessonContentPage() {
  const profile = getActiveProfile(); if (!profile) return;
  const params = new URLSearchParams(window.location.search); const lessonId = Number(params.get('lesson') || 1); const lesson = getLessonById(lessonId);
  if (!lesson) { window.location.replace('lessons.html'); return; }
  const lessonCharacters = buildLessonCharacters(lessonId, profile.nickname); let currentIndex = Number(params.get('step') || 0); currentIndex = Math.max(0, Math.min(currentIndex, lessonCharacters.length - 1));
  document.getElementById('lessonBadge').textContent = `ด่านที่ ${lesson.id}`;
  document.getElementById('lessonTitle').textContent = `${lesson.subtitle} · ${lessonCharacters.length} ตัว`;
  document.getElementById('goToQuizButton').href = `quiz.html?lesson=${lesson.id}`;
  const character = document.getElementById('lessonCharacter'); const morse = document.getElementById('lessonMorse'); const buttons = document.getElementById('characterButtons');
  function render() {
    const activeCharacter = lessonCharacters[currentIndex];
    character.textContent = activeCharacter; morse.textContent = getMorseForCharacter(activeCharacter); buttons.innerHTML = '';
    lessonCharacters.forEach((item, index) => { const button = document.createElement('button'); button.type = 'button'; button.className = `character-chip${index === currentIndex ? ' active' : ''}`; button.textContent = item; button.addEventListener('click', async () => { currentIndex = index; render(); await playMorseCode(getMorseForCharacter(item), profile.settings); }); buttons.appendChild(button); });
  }
  document.getElementById('prevCharacter').addEventListener('click', () => { currentIndex = currentIndex === 0 ? lessonCharacters.length - 1 : currentIndex - 1; render(); });
  document.getElementById('nextCharacter').addEventListener('click', () => { currentIndex = currentIndex === lessonCharacters.length - 1 ? 0 : currentIndex + 1; render(); });
  document.getElementById('replayMorse').addEventListener('click', () => playMorseCode(getMorseForCharacter(lessonCharacters[currentIndex]), profile.settings));
  render();
}
function initializeProfilePage() {
  const profile = getActiveProfile(); if (!profile) return;
  const totals = getTotals(profile); const avatarImage = document.getElementById('profileAvatar'); const defaultAvatar = document.getElementById('defaultAvatar'); const fileInput = document.getElementById('avatarUpload'); const saveButton = document.getElementById('saveAvatar'); const status = document.getElementById('profileStatus'); let pendingAvatar = profile.avatarUrl || '';
  document.getElementById('profileNickname').textContent = profile.nickname;
  document.getElementById('profileEmail').textContent = profile.email;
  document.getElementById('profileLesson').textContent = getCurrentLessonNumber(profile);
  document.getElementById('profileStars').textContent = totals.totalStars;
  document.getElementById('profileSuccess').textContent = `${totals.successRate}%`;
  document.getElementById('profileLogout').addEventListener('click', handleLogout);
  function renderAvatar(value) { if (value) { avatarImage.src = value; avatarImage.hidden = false; defaultAvatar.hidden = true; } else { avatarImage.hidden = true; defaultAvatar.hidden = false; } }
  fileInput.addEventListener('change', () => { const [file] = fileInput.files || []; if (!file) return; const reader = new FileReader(); reader.onload = () => { pendingAvatar = reader.result; renderAvatar(pendingAvatar); status.textContent = 'เลือกรูปแล้ว กดบันทึกได้เลย'; }; reader.readAsDataURL(file); });
  saveButton.addEventListener('click', () => { updateActiveProfile((current) => ({ ...current, avatarUrl: pendingAvatar })); status.textContent = 'บันทึกรูปโปรไฟล์เรียบร้อยแล้ว'; });
  renderAvatar(profile.avatarUrl);
}
function handleLogout() { logoutActiveProfile(); window.location.replace('login.html'); }
