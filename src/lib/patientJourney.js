const KEY = 'zoeverse.patient-return.v1';
const TTL = 2 * 60 * 60 * 1000;
function browserStorage() { try { return window.sessionStorage; } catch { return null; } }
const normalise = value => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
export function safeReturnPath(value) {
  return typeof value === 'string' && /^\/facility\/[1-9]\d*$/.test(value) ? value : null;
}
export function capturePatientJourney(search, storage = browserStorage(), now = Date.now()) {
  if (!storage) return;
  const params = new URLSearchParams(search);
  const path = safeReturnPath(params.get('returnTo'));
  const sourceName = (params.get('q') || '').trim().slice(0, 200);
  const sourceLga = (params.get('returnArea') || '').trim().slice(0, 100);
  try {
    storage.removeItem(KEY);
    if (path && sourceName) storage.setItem(KEY, JSON.stringify({ path, sourceName, sourceLga, createdAt: now }));
  } catch { /* Reviewing remains available without browser storage. */ }
}
function read(storage, now) {
  try {
    const context = JSON.parse(storage?.getItem(KEY) || 'null');
    if (!context || !safeReturnPath(context.path) || typeof context.sourceName !== 'string' || !Number.isFinite(context.createdAt) || context.createdAt > now || now - context.createdAt > TTL) return null;
    return context;
  } catch { return null; }
}
export function bindPatientJourney(facility, storage = browserStorage(), now = Date.now()) {
  const context = read(storage, now);
  if (!context) return;
  try {
    // A different selected facility must not inherit another hospital's return link.
    if (normalise(facility.name) !== normalise(context.sourceName) || (context.sourceLga && normalise(facility.lga) !== normalise(context.sourceLga))) storage.removeItem(KEY);
    else storage.setItem(KEY, JSON.stringify({ ...context, reviewFacilityId: String(facility.id) }));
  } catch { /* Optional navigation context only. */ }
}
export function patientReturnUrl(storage = browserStorage(), now = Date.now(), origin = import.meta.env?.VITE_PATIENT_PORTAL_URL || 'https://zoeverse.ng') {
  const context = read(storage, now);
  const path = context?.reviewFacilityId ? context.path : '/search';
  return new URL(path, origin).href;
}
