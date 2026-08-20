import { useSearchParams } from "react-router-dom";

/* =========================================================================
   WHICH QUESTION SET TO SERVE
   =========================================================================
   Normally: whatever the server considers current. Nothing is pinned, nothing
   is cached, and a question set published this morning is the one somebody
   answers this afternoon.

   `?form=<version>` PINS A SPECIFIC ONE, so an older set can be compared against
   the live one without a deploy. It is a review tool, not a feature — hence the
   banner (see ReviewFlow) whenever it is in use.

   IT IS DELIBERATELY NOT STICKY. The previous build remembered the pinned
   version in storage, which meant somebody who once opened a comparison link
   kept answering the old question set on every later visit without any way to
   tell. The parameter lives in the URL, travels with the link, and disappears
   the moment it is not in the address bar.
   ========================================================================= */

/** The `?form=` value, or null for whatever the server serves as current. */
export function useFormVersion() {
  const [params] = useSearchParams();
  const pinned = params.get("form");
  return pinned && pinned.trim() !== "" ? pinned.trim() : null;
}

/**
 * True when a version was pinned, rather than left to the server.
 *
 * DELIBERATELY NOT "is this older than current". The client cannot know which
 * version is current without asking for it separately, and a check that has to
 * guess would either miss a real preview or warn on the live flow. Pinning at
 * all is the thing worth saying, and it is a fact the client actually holds.
 */
export function isPinnedVersion(pinned) {
  return !!pinned;
}
