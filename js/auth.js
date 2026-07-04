import { loadRemoteProfile, isFirebaseReady } from './firebase-config.js';
import { buildProfileId, buildSystemEmail, getActiveProfile, getActiveProfileId, upsertProfile } from './morse.js';
const page = document.body.dataset.page;
if (page === 'login') initializeLogin();
async function initializeLogin() {
  const form = document.getElementById('loginForm');
  const input = document.getElementById('nicknameInput');
  const status = document.getElementById('loginStatus');
  const activeProfile = getActiveProfile();
  if (activeProfile) input.value = activeProfile.nickname;
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const nickname = input.value.trim();
    if (!nickname) { status.textContent = 'กรุณาใส่ชื่อเล่นก่อนเริ่มเรียน'; return; }
    status.textContent = isFirebaseReady() ? 'กำลังเชื่อมต่อ Firebase...' : 'กำลังบันทึกข้อมูลในเครื่องก่อน';
    const profileId = buildProfileId(nickname); let remoteProfile = null;
    if (isFirebaseReady()) { try { remoteProfile = await loadRemoteProfile(profileId); } catch { status.textContent = 'เชื่อมต่อ Firebase ไม่สำเร็จ ระบบจะบันทึกไว้ในเครื่องก่อน'; } }
    upsertProfile(profileId, { ...(remoteProfile || {}), nickname, email: remoteProfile?.email || buildSystemEmail(nickname), lastLoginAt: new Date().toISOString() });
    window.location.href = 'lessons.html';
  });
}
export function redirectIfLoggedOut() { if (!getActiveProfileId()) window.location.replace('login.html'); }
