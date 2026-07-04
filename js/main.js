import { getActiveProfile } from './morse.js';
const startButton = document.getElementById('startButton');
const activeProfile = getActiveProfile();
if (startButton && activeProfile) { startButton.href = 'lessons.html'; startButton.textContent = 'กลับไปเรียนต่อ'; }
