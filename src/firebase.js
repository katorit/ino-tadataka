import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, addDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCJPqPSyht8Hb8iZPyiJ-7CXt1_WgxPyAA",
  authDomain: "ino-monument-map.firebaseapp.com",
  projectId: "ino-monument-map",
  storageBucket: "ino-monument-map.firebasestorage.app",
  messagingSenderId: "167166674267",
  appId: "1:167166674267:web:d9a05b60f191ebf8e9467e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-northeast1');

const provider = new GoogleAuthProvider();
export const loginWithGoogle = () => signInWithPopup(auth, provider);
export const logoutUser = () => signOut(auth);
export { onAuthStateChanged, getIdTokenResult };

function normalizeHandle(raw) {
  return String(raw || '').trim().toLowerCase();
}

// 訪問記録（ユーザーごと）
export async function getVisits(uid) {
  const d = await getDoc(doc(db, 'visits', uid));
  return d.exists() ? d.data() : {};
}
export async function saveVisits(uid, data) {
  await setDoc(doc(db, 'visits', uid), data);
}

// 写真（全ユーザー共有）
export function subscribePhotos(callback) {
  const q = query(collection(db, 'photos'), orderBy('date', 'desc'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(d => ({ docId: d.id, ...d.data() })));
  });
}

export async function uploadPhoto(uid, monumentId, base64data, cmt, dist, displayName, shotDate) {
  const path = `photos/${uid}/${Date.now()}.jpg`;
  const storageRef = ref(storage, path);
  await uploadString(storageRef, base64data, 'data_url');
  const url = await getDownloadURL(storageRef);
  const data = {
    monumentId, userId: uid, displayName,
    url, storagePath: path, cmt,
    date: new Date().toISOString().split('T')[0],
    dist,
  };
  if (shotDate) data.shotDate = shotDate;
  await addDoc(collection(db, 'photos'), data);
}

export function subscribeUserProfiles(callback) {
  return onSnapshot(collection(db, 'userProfiles'), function (snap) {
    callback(snap.docs.map(function (d) { return { uid: d.id, ...d.data() }; }));
  });
}

export async function getOrCreateUserProfile(uid, fallbackName) {
  var refDoc = doc(db, 'userProfiles', uid);
  var snap = await getDoc(refDoc);
  if (snap.exists()) return { uid: uid, ...snap.data() };

  var base = String(fallbackName || 'ゲスト').trim() || 'ゲスト';
  var candidate = base;
  for (var i = 0; i < 8; i++) {
    try {
      await updateHandle(candidate);
      var created = await getDoc(refDoc);
      if (created.exists()) return { uid: uid, ...created.data() };
      break;
    } catch (e) {
      var code = e && e.code ? String(e.code) : '';
      if (code.indexOf('already-exists') >= 0) {
        candidate = base + String(i + 2);
        continue;
      }
      throw e;
    }
  }

  // Fallback with timestamp suffix when repeated collisions happen.
  await updateHandle(base + '-' + String(Date.now()).slice(-4));
  var finalSnap = await getDoc(refDoc);
  return finalSnap.exists() ? { uid: uid, ...finalSnap.data() } : null;
}

export async function updateHandle(handle) {
  var trimmed = String(handle || '').trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    var err = new Error('ハンドル名は2〜20文字で入力してください');
    err.code = 'invalid-argument';
    throw err;
  }
  var callable = httpsCallable(functions, 'updateHandle');
  await callable({ handle: trimmed, normalizedHandle: normalizeHandle(trimmed) });
}

// カスタム記念碑（管理者追加・全ユーザー共有）
export function subscribeCustomMonuments(callback) {
  return onSnapshot(collection(db, 'customMonuments'), (snap) => {
    callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
  });
}

export async function addCustomMonument(data) {
  await addDoc(collection(db, 'customMonuments'), data);
}

export async function updateCustomMonument(id, data) {
  await setDoc(doc(db, 'customMonuments', id), data);
}

export async function deleteCustomMonument(id) {
  await deleteDoc(doc(db, 'customMonuments', id));
}

export async function deletePhoto(docId, storagePath) {
  await deleteDoc(doc(db, 'photos', docId));
  try { await deleteObject(ref(storage, storagePath)); } catch {
    // The Firestore record is already gone; ignore missing storage objects.
  }
}
