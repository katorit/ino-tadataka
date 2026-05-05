const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");

admin.initializeApp();
setGlobalOptions({ region: "asia-northeast1" });

function normalizeHandle(raw) {
  return String(raw || "").trim().toLowerCase();
}

exports.updateHandle = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "ログインが必要です");
  }

  const rawHandle = String((request.data && request.data.handle) || "").trim();
  const normalizedHandle = normalizeHandle(rawHandle);

  if (!rawHandle || rawHandle.length < 2 || rawHandle.length > 20) {
    throw new HttpsError("invalid-argument", "ハンドル名は2〜20文字で入力してください");
  }

  const db = admin.firestore();
  const uid = request.auth.uid;
  const profileRef = db.collection("userProfiles").doc(uid);
  const nextHandleRef = db.collection("handles").doc(normalizedHandle);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await db.runTransaction(async (tx) => {
    const profileSnap = await tx.get(profileRef);
    const currentProfile = profileSnap.exists ? profileSnap.data() : null;
    const currentHandle = currentProfile && currentProfile.handle ? String(currentProfile.handle).trim() : "";
    const currentNormalized = normalizeHandle(currentHandle);
    let prevHandleRef = null;
    let prevSnap = null;

    const targetSnap = await tx.get(nextHandleRef);
    if (targetSnap.exists) {
      const ownerUid = targetSnap.data() && targetSnap.data().uid;
      if (ownerUid && ownerUid !== uid) {
        throw new HttpsError("already-exists", "そのハンドル名は既に使われています");
      }
    }

    if (currentNormalized && currentNormalized !== normalizedHandle) {
      prevHandleRef = db.collection("handles").doc(currentNormalized);
      prevSnap = await tx.get(prevHandleRef);
    }

    tx.set(profileRef, { handle: rawHandle, updatedAt: now }, { merge: true });
    tx.set(nextHandleRef, { uid: uid, updatedAt: now }, { merge: true });

    if (prevHandleRef && prevSnap && prevSnap.exists && prevSnap.data() && prevSnap.data().uid === uid) {
      tx.delete(prevHandleRef);
    }
  });

  return { ok: true, handle: rawHandle };
});
