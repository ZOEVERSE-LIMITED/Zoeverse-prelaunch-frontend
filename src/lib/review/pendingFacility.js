/* =========================================================================
   FACILITIES THAT ARE NOT ON THE LIST YET
   =========================================================================
   Somebody searches for where they were treated, it is not there, they add it —
   and then they must be able to review it immediately. Sending them away to wait
   for an admin loses the review, and the review is the entire point of this site
   before launch.

   The registry export is incomplete by a wide margin, so this is not an edge
   case. It is a normal Tuesday.

   WHY LOCAL STORAGE. A suggested facility has no public record on the server
   until somebody approves it, so there is nothing for `getFacility` to return to
   anybody else. The client holds it for exactly as long as the review takes,
   next to the draft it belongs with, and it goes when the review is submitted.

   THE PENDING FACILITY IS NEVER SEARCHABLE. It exists only for the person who
   typed it, on the device they typed it on. Nobody else can reach it, and it
   does not appear in anybody's results — that is what admin approval is for.
   ========================================================================= */

/** Marks an id as belonging to a facility nobody has checked yet. */
export const PENDING_PREFIX = "pending:";

export function isPendingId(id) {
  return typeof id === "string" && id.startsWith(PENDING_PREFIX);
}

const KEY_PREFIX = "zoe.review.pending.";

function store() {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function savePendingFacility(facility) {
  const storage = store();
  if (!storage) return;
  try {
    storage.setItem(`${KEY_PREFIX}${facility.id}`, JSON.stringify(facility));
  } catch {
    /* quota or disabled storage — the caller handles a missing facility */
  }
}

export function loadPendingFacility(id) {
  const storage = store();
  if (!storage) return null;

  let raw;
  try {
    raw = storage.getItem(`${KEY_PREFIX}${id}`);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const facility = JSON.parse(raw);
    // A record without a name cannot be shown to anybody, and rendering an
    // empty heading is worse than saying it is gone.
    return facility && typeof facility.name === "string" && facility.name
      ? facility
      : null;
  } catch {
    return null;
  }
}

export function clearPendingFacility(id) {
  const storage = store();
  if (!storage) return;
  try {
    storage.removeItem(`${KEY_PREFIX}${id}`);
  } catch {
    /* nothing useful to do */
  }
}
