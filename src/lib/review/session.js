const KEY = "zoe.review.session.";

function store() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveSession(facilityId, session) {
  const storage = store();
  if (!storage) return;
  try {
    storage.setItem(KEY + facilityId, JSON.stringify(session));
  } catch {
    // The user can re-enter their name if browser storage is unavailable.
  }
}

export function loadSession(facilityId) {
  const storage = store();
  if (!storage) return null;

  let session;
  try {
    const raw = storage.getItem(KEY + facilityId);
    if (!raw) return null;
    session = JSON.parse(raw);
  } catch {
    clearSession(facilityId);
    return null;
  }

  if (!session || typeof session !== "object" || typeof session.draftId !== "string" || typeof session.reviewerName !== "string") {
    clearSession(facilityId);
    return null;
  }

  const expiry = Date.parse(session.expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) {
    clearSession(facilityId);
    return null;
  }

  return session;
}

export function clearSession(facilityId) {
  const storage = store();
  if (!storage) return;
  try {
    storage.removeItem(KEY + facilityId);
  } catch {
    // Nothing useful to do.
  }
}
