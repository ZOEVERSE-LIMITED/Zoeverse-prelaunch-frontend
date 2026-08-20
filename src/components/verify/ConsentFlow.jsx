import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviewForm, isApiError, submitReview } from "@/api";
import { clearDraft, loadDraft } from "@/lib/review/draft";
import { useFormVersion } from "@/lib/review/formVersion";
import { clearPendingFacility } from "@/lib/review/pendingFacility";
import { countScoredAnswered, finalizeAnswers, visibleScreens } from "@/lib/review/rules";
import { clearSession, loadSession } from "@/lib/review/session";
import { ConsentStep } from "./ConsentStep";

/* =========================================================================
   THE LAST SCREEN — CONSENT, THEN SEND
   =========================================================================
   Phone and code MOVED TO THE FRONT (see IdentityFlow) and only consent remains
   here.

   CONSENT BELONGS AT THE END and did not move with them. It is agreement to the
   publication of a specific review, and at the start of the flow that review
   does not exist yet — asking then would be asking somebody to agree to the
   publication of something they have not written.
   ========================================================================= */

export function ConsentFlow({ facility }) {
  const navigate = useNavigate();
  const pinnedVersion = useFormVersion();

  const [stage, setStage] = useState("consent"); // consent | sending
  const [session, setSession] = useState(null);
  const [config, setConfig] = useState(null);
  const [answers, setAnswers] = useState(null);
  const [totalScreens, setTotalScreens] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  const startHref = `/review/${encodeURIComponent(facility.id)}/start`;
  const facilitySource = facility.pending ? "unlisted" : "listed";

  /*
    NO VERIFIED SESSION, NO CONSENT SCREEN. Arriving here without one means
    either a deep link or a session that expired mid-review. Either way the
    submission would be rejected, so send them to confirm their number now rather
    than after they have read and ticked the consents.
  */
  useEffect(() => {
    const existing = loadSession(facility.id);
    if (!existing) {
      navigate(startHref, { replace: true });
      return;
    }
    setSession(existing);
  }, [facility.id, navigate, startHref]);

  useEffect(() => {
    if (!session) return;
    let live = true;
    const controller = new AbortController();

    getReviewForm(facility.id, pinnedVersion, controller.signal)
      .then((result) => {
        if (!live) return;
        setConfig(result);

        // Read the answers back from the draft rather than carrying them through
        // the URL or a shared store. They were saved on the previous screen; this
        // route just picks them up.
        const draftAnswers = loadDraft(facility.id, result.version)?.answers ?? {};

        /*
          `facilitySource` is DERIVED FROM THE FACILITY, never read from the
          draft. Arrive here without one — a direct link, cleared storage — and
          the flag would be absent, a conditional question would count as hidden,
          and the step counter would report the wrong total.
        */
        const withSource = { ...draftAnswers, facilitySource };
        setAnswers(withSource);
        setTotalScreens(visibleScreens(result, withSource).length);
      })
      .catch(() => {
        if (live) setAnswers({ facilitySource });
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [facility.id, facilitySource, pinnedVersion, session]);

  async function send(consent) {
    if (!session || !config || !answers) return;
    setStage("sending");
    setSubmitError(null);

    /*
      One last cascade, and the starter-stem cleanup, at the moment of sending.
      Somebody can change an answer and then navigate rather than change another
      — the pruning that ran on the last edit is not necessarily the pruning that
      applies now.
    */
    const finalAnswers = finalizeAnswers(config, answers);

    try {
      await submitReview({
        facilityId: facility.id,
        facilitySource,
        formVersion: config.version,
        draftId: session.draftId,
        scoredAnswered: countScoredAnswered(config, finalAnswers),
        answers: finalAnswers,
        consent,
        verificationToken: session.verificationToken,
        startedAt: new Date().toISOString(),
      });

      // Only after the server has it. Clearing earlier would lose somebody's
      // answers on a failed submission.
      clearDraft(facility.id);
      clearSession(facility.id);
      // A pending facility outlives nothing. Once the review is in, the local
      // copy has no further purpose and should not sit on a shared handset.
      clearPendingFacility(facility.id);
      navigate("/thank-you");
    } catch (error) {
      setStage("consent");
      if (isApiError(error) && error.code === "duplicate_review") {
        setSubmitError("You have already reviewed this facility.");
      } else if (isApiError(error) && error.code === "unverified") {
        setSubmitError("That took too long. Confirm your number again.");
      } else if (isApiError(error) && error.isRetryable) {
        setSubmitError("We could not send it. Check your connection and try again.");
      } else {
        setSubmitError("We could not send it. Try again in a moment.");
      }
    }
  }

  return (
    <div>
      {totalScreens ? (
        <>
          <p className="num text-caption uppercase tracking-wide text-ink-soft">
            Step {totalScreens} of {totalScreens}
          </p>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-line"
            role="progressbar"
            aria-valuenow={totalScreens}
            aria-valuemin={1}
            aria-valuemax={totalScreens}
            aria-label="Progress through the review"
          >
            <div className="h-full w-full bg-teal" />
          </div>
        </>
      ) : null}

      <p className="mt-3 text-small text-ink-muted">
        Your review of <span className="font-medium text-ink">{facility.name}</span>
        {session ? (
          <>
            {" · confirmed as "}
            <span className="num">{session.phoneMasked}</span>
          </>
        ) : null}
      </p>

      <div className="mt-6">
        {stage === "consent" && config && answers ? (
          <>
            <ConsentStep
              formVersion={config.version}
              config={config}
              answers={answers}
              onConfirmed={send}
            />
            {submitError ? (
              <p
                role="alert"
                className="mt-6 rounded border border-danger bg-danger-wash px-4 py-3 text-small text-danger"
              >
                {submitError}
              </p>
            ) : null}
          </>
        ) : null}

        {stage === "consent" && (!config || !answers) ? (
          <p className="text-body text-ink-soft">Loading the terms…</p>
        ) : null}

        {stage === "sending" ? (
          <div role="status">
            <h1 className="text-title">Sending your review…</h1>
            <p className="mt-3 text-body text-ink-muted">
              This can take a moment on a slow connection. Please do not close the
              page.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
