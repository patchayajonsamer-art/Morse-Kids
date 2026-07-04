import { buildLessonCharacters, getLessonById } from '../data/lessons.js';
import { getMorseForCharacter } from '../data/morseData.js';
import { redirectIfLoggedOut } from './auth.js';
import { getActiveProfile, playMorseCode, saveLessonResult } from './morse.js';
redirectIfLoggedOut();
const profile = getActiveProfile();
if (profile) initializeQuiz();
function initializeQuiz() {
  const params = new URLSearchParams(window.location.search); const lessonId = Number(params.get('lesson') || 1); const lesson = getLessonById(lessonId);
  if (!lesson) { window.location.replace('lessons.html'); return; }
  const characters = buildLessonCharacters(lessonId, `${profile.nickname}-quiz`); const questions = [...characters].sort((left, right) => left.localeCompare(right, 'th'));
  const ui = { quizBadge: document.getElementById('quizBadge'), quizTitle: document.getElementById('quizTitle'), quizProgress: document.getElementById('quizProgress'), quizMorse: document.getElementById('quizMorse'), answerPreview: document.getElementById('answerPreview'), characterOptions: document.getElementById('characterOptions'), feedback: document.getElementById('quizFeedback'), quizCard: document.getElementById('quizCard'), resultCard: document.getElementById('resultCard'), resultHeadline: document.getElementById('resultHeadline'), resultStars: document.getElementById('resultStars'), resultSummary: document.getElementById('resultSummary'), retryLesson: document.getElementById('retryLesson') };
  let questionIndex = 0; let score = 0; let currentAnswer = { morse: '', character: '' };
  ui.quizBadge.textContent = `ด่านที่ ${lessonId}`; ui.quizTitle.textContent = `${lesson.subtitle} · แบบทดสอบ ${questions.length} ข้อ`; ui.retryLesson.href = `quiz.html?lesson=${lessonId}`;
  document.getElementById('dotButton').addEventListener('click', () => updateAnswer(`${currentAnswer.morse}·`));
  document.getElementById('dashButton').addEventListener('click', () => updateAnswer(`${currentAnswer.morse}−`));
  document.getElementById('spaceButton').addEventListener('click', () => updateAnswer(`${currentAnswer.morse} `));
  document.getElementById('clearButton').addEventListener('click', () => updateAnswer(''));
  document.getElementById('submitAnswer').addEventListener('click', handleSubmit);
  document.getElementById('replayQuestion').addEventListener('click', () => playQuestion());
  function updateAnswer(value) { currentAnswer.morse = value; ui.answerPreview.textContent = value.trim() || 'ยังไม่ได้พิมพ์'; }
  function selectCharacter(character) { currentAnswer.character = character; renderOptions(); }
  function renderOptions() { ui.characterOptions.innerHTML = ''; characters.forEach((character) => { const button = document.createElement('button'); button.type = 'button'; button.className = `character-chip${currentAnswer.character === character ? ' selected' : ''}`; button.textContent = character; button.addEventListener('click', () => selectCharacter(character)); ui.characterOptions.appendChild(button); }); }
  function playQuestion() { return playMorseCode(getMorseForCharacter(questions[questionIndex]), profile.settings); }
  function renderQuestion() { currentAnswer = { morse: '', character: '' }; ui.feedback.textContent = ''; ui.quizProgress.textContent = `ข้อ ${questionIndex + 1}/${questions.length}`; ui.quizMorse.textContent = getMorseForCharacter(questions[questionIndex]); ui.answerPreview.textContent = 'ยังไม่ได้พิมพ์'; renderOptions(); playQuestion(); }
  function handleSubmit() { const currentCharacter = questions[questionIndex]; const morse = getMorseForCharacter(currentCharacter).replace(/\s+/g, ' ').trim(); const answer = currentAnswer.morse.replace(/\s+/g, ' ').trim(); const isCorrect = currentAnswer.character === currentCharacter && answer === morse; ui.feedback.textContent = isCorrect ? 'ถูกต้องมากเลย!' : `คำตอบที่ถูกคือ ${currentCharacter} · ${morse}`; if (isCorrect) score += 1; questionIndex += 1; if (questionIndex >= questions.length) { showResult(); return; } window.setTimeout(renderQuestion, 900); }
  function showResult() { const stars = calculateStars(lessonId, score, questions.length); const message = buildResultMessage(profile.nickname, stars); saveLessonResult(lessonId, { score, totalQuestions: questions.length, stars }); ui.quizCard.classList.add('hidden'); ui.resultCard.classList.remove('hidden'); ui.resultHeadline.textContent = message.headline; ui.resultStars.textContent = '⭐'.repeat(stars); ui.resultSummary.textContent = `${message.body} · ทำได้ ${score}/${questions.length} ข้อ`; }
  renderQuestion();
}
function calculateStars(lessonId, score, totalQuestions) { if (lessonId === 1) { if (score === 5) return 3; if (score >= 3) return 2; return 1; } if (totalQuestions === 8) { if (score === 8) return 3; if (score >= 5) return 2; return 1; } if (score === totalQuestions) return 3; if (score / totalQuestions >= 0.6) return 2; return 1; }
function buildResultMessage(nickname, stars) { if (stars === 3) return { headline: 'น้องเก่งมากเลยน้า! 🎉', body: `${nickname} ทำได้ดีมาก แมวดีใจจนเด้งและปรบมือเลย` }; if (stars === 2) return { headline: 'ยอดไปเลย! ✨', body: `${nickname} ทำได้ดีแล้ว พยายามอีกนิดจะได้ครบสามดาว` }; return { headline: 'อย่าเพิ่งท้อน้า 💛', body: `${nickname} ลองอีกครั้งได้เสมอ แมวจะคอยเป็นกำลังใจให้` }; }
