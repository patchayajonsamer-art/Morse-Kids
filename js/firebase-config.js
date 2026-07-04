const REQUIRED_KEYS = ['apiKey', 'authDomain', 'projectId', 'appId'];
let firebaseClient;
function getConfig() { return window.MORSE_KIDS_FIREBASE_CONFIG || null; }
function hasConfig() { const config = getConfig(); return Boolean(config && REQUIRED_KEYS.every((key) => config[key])); }
async function loadFirebaseClient() {
  if (!hasConfig()) return null;
  if (firebaseClient) return firebaseClient;
  const [{ initializeApp }, { getFirestore, doc, getDoc, setDoc }] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
  ]);
  const app = initializeApp(getConfig());
  firebaseClient = { db: getFirestore(app), doc, getDoc, setDoc };
  return firebaseClient;
}
export async function loadRemoteProfile(profileId) { const client = await loadFirebaseClient(); if (!client) return null; const snapshot = await client.getDoc(client.doc(client.db, 'profiles', profileId)); return snapshot.exists() ? snapshot.data() : null; }
export async function saveRemoteProfile(profileId, profile) { const client = await loadFirebaseClient(); if (!client) return false; await client.setDoc(client.doc(client.db, 'profiles', profileId), { ...profile, lastSyncAt: new Date().toISOString() }, { merge: true }); return true; }
export function isFirebaseReady() { return hasConfig(); }
