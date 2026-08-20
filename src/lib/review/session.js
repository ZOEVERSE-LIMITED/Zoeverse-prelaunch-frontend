/* =========================================================================
   THE VERIFIED SESSION
   =========================================================================
   Verification happens FIRST, so its result has to survive the walk from screen
   0 to the last screen.

   ---------------------------------------------------------------------------
   sessionStorage, DELIBERATELY — AND THE TRADE IT MAKES
   ---------------------------------------------------------------------------
   The verification token lives in sessionStorage, which means:

     RELOAD THE PAGE          → still verified, carry on.
     LOSE SIGNAL AND RETURN   → still verified, carry on.
     CLOSE THE TAB            → verification gone. The ANSWERS survive (those are
                                in localStorage, see draft.js), so nothing
                                anybody typed is lost — but they confirm their
                                number again before sending.

   The alternative is localStorage, where the token would outlive the tab and
   somebody could finish and submit a review as whoever last used that handset.
   Phones get shared. A verified identity that survives being handed to somebody
   else is not a verified identity, and this whole platform is worth exactly what
   that guarantee is worth.

   FOUNDER DECISION, ONE LINE TO CHANGE: swap `sessionStorage` for
   `localStorage` in `store()` and the token survives a tab close, at the cost
   above. Nothing else in the flow needs to know.

   THE PHONE NUMBER ITSELF IS NEVER STORED, under either choice — not here, not
   in the draft, not in a URL. Only the opaque token and the mask the server
   returned for display.
   ========================================================================= */

const KEY = "zoe.review.session.";

function store() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    // Private browsing, disabled storage, full quota. Returning null means the
    // flow runs unverified-per-reload rather than throwing at somebody.
    return null;
  }
}

/**
 * @param {string} facilityId
 * @param {{ verificationToken: string, expiresAt: string, phoneMasked: string, draftId: string }} session
 */
export function saveSession(facilityId, session) {
  const storage = store();
  if (!storage) return;
  try {
    storage.setItem(KEY + facilityId, JSON.stringify(session));
  } catch {
    /* Losing the session costs one re-verify. Throwing costs the review. */
  }
}

/**
 * The session for this facility, or null.
 *
 * AN EXPIRED TOKEN RETURNS NULL AND IS DELETED. Keeping it would send somebody
 * through five screens and fail at submit with "that took too long", which is
 * the worst possible moment to find out. Checked against the SERVER'S OWN
 * `expiresAt` rather than a local age, so a wrong device clock shortens the
 * session rather than silently extending it.
 */
export function loadSession(facilityId) {
  const storage = store();
  if (!storage) return null;

  let raw;
  try {
    raw = storage.getItem(KEY + facilityId);
  } catch {
    return null;
  }
  if (!raw) return null;

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    clearSession(facilityId);
    return null;
  }

  if (
    !session ||
    typeof session !== "object" ||
    typeof session.verificationToken !== "string" ||
    typeof session.draftId !== "string"
  ) {
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
    /* nothing useful to do */
  }
}
