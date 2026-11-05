import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isApiError, resumeReviewSession } from "@/api";
import { Button } from "@/components/ui/Button";
import { saveDraft } from "@/lib/review/draft";
import { savePendingFacility } from "@/lib/review/pendingFacility";
import { saveSession } from "@/lib/review/session";
import { useTitle } from "@/lib/useTitle";

export default function ResumeReviewPage() {
  useTitle("Continue your review");
  const navigate = useNavigate();
  const token = useRef(new URLSearchParams(window.location.hash.slice(1)).get("token") ?? "");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [retryError, setRetryError] = useState(null);

  useEffect(() => {
    // Keep the secret out of subsequent history entries and copied URLs.
    window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
  }, []);

  async function resume() {
    setBusy(true);
    setRetryError(null);
    try {
      const { session, facility } = await resumeReviewSession(token.current);
      saveSession(session.facilityId, {
        draftId: session.draftId, reviewerName: session.reviewerName,
        expiresAt: session.expiresAt, formVersion: session.formVersion,
      });
      saveDraft({
        facilityId: session.facilityId, formVersion: session.formVersion,
        draftId: session.draftId, answers: session.answers, screenId: session.screenId,
      });
      if (facility.pending) savePendingFacility(facility);
      navigate(`/review/${encodeURIComponent(session.facilityId)}`, { replace: true });
    } catch (error) {
      if (isApiError(error) && error.isRetryable) {
        setRetryError("We couldn’t open your review. Check your connection and try again.");
      } else {
        setFailed(true);
      }
      setBusy(false);
    }
  }

  return <div className="zoe-container py-12">
    <h1 className="text-title">Your story can carry on.</h1>
    <p className="mt-4 text-body text-ink-muted">Continue your saved review when you’re ready. Your answers will appear after you confirm.</p>
    {retryError && <p className="mt-4 text-small text-danger" role="alert">{retryError}</p>}
    {!failed && token.current ? <Button type="button" disabled={busy} onClick={resume} className="mt-8 w-full">
      {busy ? "Opening your review…" : "Continue my review"}
    </Button> : <div className="mt-6" role="alert">
      <p className="text-body text-ink-muted">This link may have expired or already been used. You can return to your review on the device where you started, or start a new review.</p>
      <Link to="/" className="mt-4 inline-block text-teal-ink underline">Find your facility</Link>
    </div>}
  </div>;
}
