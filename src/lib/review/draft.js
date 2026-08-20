/* =========================================================================
   DRAFT RECOVERY
   =========================================================================
   Somebody starts a review on a bus, loses signal, closes the tab, comes back an
   hour later. Without this they start from screen 1 and most of them simply do
   not — drop-off recovery is the difference between collecting a review and
   losing it.

   ---------------------------------------------------------------------------
   WHAT IS DELIBERATELY NOT SAVED HERE
   ---------------------------------------------------------------------------
   THE PHONE NUMBER, THE OTP CHALLENGE AND THE VERIFICATION TOKEN. Those live in
   `session.js`, in sessionStorage, and die with the tab. A verification that
   survived a page close would also survive being handed to somebody else.

   The `draftId` IS stored here, because it is an opaque server-side handle and
   is useless without a verified session to go with it.

   ---------------------------------------------------------------------------
   THE RISK THE FOUNDER SHOULD KNOW ABOUT
   ---------------------------------------------------------------------------
   Phones get shared. A saved draft naming a facility and a visit type can reveal
   a medical condition to whoever picks the handset up next — "antenatal care" or
   a psychiatric hospital is not a neutral fact about somebody.

   Three things reduce that, and none of them eliminate it:
     - drafts expire after DRAFT_TTL_DAYS and are deleted on read once stale;
     - the flow always offers a visible, one-tap discard;
     - the draft is cleared the moment a review is submitted.

   If that trade stops looking right, the honest alternative is sessionStorage:
   recovery within the same tab only, which survives a reload and a lost
   connection but not closing the tab. It is a one-line change — swap `store()`.
   ========================================================================= */

/** After this, a draft is somebody else's problem rather than a helpful resume. */
export const DRAFT_TTL_DAYS = 14;

const PREFIX = "zoe.review.draft.";

/**
 * The one place storage is touched.
 *
 * Returns null rather than throwing when storage is unavailable — private
 * browsing, a full quota, or a browser with storage disabled. A review must
 * never fail to work because it could not be saved; the saving is the optional
 * part, not the review.
 */
function store() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function keyFor(facilityId) {
  return `${PREFIX}${facilityId}`;
}

export function saveDraft(draft) {
  const storage = store();
  if (!storage) return;

  try {
    storage.setItem(
      keyFor(draft.facilityId),
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
  } catch {
    // Quota exceeded, or storage disabled mid-session. Losing the draft is bad;
    // losing the review in progress because saving it threw would be worse.
  }
}

/**
 * Load a draft, or null.
 *
 * Returns null — and DELETES the stored draft — when it is stale or was written
 * against a different question set. Restoring answers into questions that have
 * since been reworded would attach somebody's answer to a question they were
 * never asked, and there is no safe way to migrate that.
 */
export function loadDraft(facilityId, formVersion) {
  const storage = store();
  if (!storage) return null;

  let raw;
  try {
    raw = storage.getItem(keyFor(facilityId));
  } catch {
    return null;
  }
  if (!raw) return null;

  let draft;
  try {
    draft = JSON.parse(raw);
  } catch {
    // Corrupt or written by an older shape. Not recoverable, so clear it.
    clearDraft(facilityId);
    return null;
  }

  if (!draft || typeof draft !== "object" || typeof draft.answers !== "object" || draft.answers === null) {
    clearDraft(facilityId);
    return null;
  }

  if (draft.formVersion !== formVersion) {
    clearDraft(facilityId);
    return null;
  }

  const age = Date.now() - Date.parse(draft.savedAt);
  if (!Number.isFinite(age) || age > DRAFT_TTL_DAYS * 24 * 60 * 60 * 1000) {
    clearDraft(facilityId);
    return null;
  }

  return draft;
}

export function clearDraft(facilityId) {
  const storage = store();
  if (!storage) return;
  try {
    storage.removeItem(keyFor(facilityId));
  } catch {
    /* nothing useful to do */
  }
}

/** How long ago a draft was saved, in plain words. */
export function describeAge(savedAt) {
  const minutes = Math.floor((Date.now() - Date.parse(savedAt)) / 60000);
  if (!Number.isFinite(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
