import { useEffect, useState } from "react";
import { getFacility } from "@/api";
import { isPendingId, loadPendingFacility } from "@/lib/review/pendingFacility";

/* =========================================================================
   WHAT IS BEING REVIEWED — LISTED OR NOT
   =========================================================================
   Two sources, one shape. A listed facility comes from the API; one somebody
   typed in themselves lives on their device until an admin approves it. Every
   screen downstream takes the same object and never has to know which it got.

   @returns {{ status: "loading" } | { status: "missing" } | { status: "ready", facility: object }}
   ========================================================================= */
export function useReviewTarget(facilityId) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let live = true;
    setState({ status: "loading" });

    if (isPendingId(facilityId)) {
      // Added by this person, on this device, and never listed for anybody else.
      const pending = loadPendingFacility(facilityId);
      setState(pending ? { status: "ready", facility: pending } : { status: "missing" });
      return;
    }

    const controller = new AbortController();
    getFacility(facilityId, controller.signal)
      .then((result) => {
        // A listed facility is a review target that is not pending.
        if (live) setState({ status: "ready", facility: { ...result, pending: false } });
      })
      .catch(() => {
        if (live) setState({ status: "missing" });
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [facilityId]);

  return state;
}
