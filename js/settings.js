import { redirectIfLoggedOut } from './auth.js';
import { getActiveProfile, updateActiveProfile } from './morse.js';
redirectIfLoggedOut();
const profile = getActiveProfile();
if (profile) initializeSettings(profile.settings);
function initializeSettings(settings) {
  const vibrationSpeed = document.getElementById('vibrationSpeed'); const soundFrequency = document.getElementById('soundFrequency'); const vibrationEnabled = document.getElementById('vibrationEnabled'); const soundEnabled = document.getElementById('soundEnabled'); const status = document.getElementById('settingsStatus');
  vibrationSpeed.value = settings.vibrationSpeed; soundFrequency.value = settings.soundFrequency; vibrationEnabled.checked = settings.vibrationEnabled; soundEnabled.checked = settings.soundEnabled;
  const renderValues = () => { document.getElementById('vibrationSpeedValue').textContent = `${vibrationSpeed.value} ms`; document.getElementById('soundFrequencyValue').textContent = `${soundFrequency.value} Hz`; };
  const saveSettings = () => { updateActiveProfile((profileData) => ({ ...profileData, settings: { ...profileData.settings, vibrationSpeed: Number(vibrationSpeed.value), soundFrequency: Number(soundFrequency.value), vibrationEnabled: vibrationEnabled.checked, soundEnabled: soundEnabled.checked } })); status.textContent = 'บันทึกการตั้งค่าเรียบร้อยแล้ว'; renderValues(); };
  [vibrationSpeed, soundFrequency].forEach((input) => input.addEventListener('input', saveSettings)); [vibrationEnabled, soundEnabled].forEach((input) => input.addEventListener('change', saveSettings)); renderValues();
}
