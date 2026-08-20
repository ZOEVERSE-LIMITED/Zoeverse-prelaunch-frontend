import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getReviewForm, isApiError, startReviewSession } from "@/api";
import { loadDraft } from "@/lib/review/draft";
import { useFormVersion } from "@/lib/review/formVersion";
import { visibleScreens } from "@/lib/review/rules";
import { loadSession, saveSession } from "@/lib/review/session";
import { Button } from "@/components/ui/Button";
import { OtpStep } from "./OtpStep";
import { PhoneStep } from "./PhoneStep";

/* =========================================================================
   SCREEN 0 — IDENTITY.  Phone, then the code.
   =========================================================================
   THIS USED TO BE THE LAST SCREEN. Moving it to the front is the single change
   that most affects how many reviews actually arrive: under the old order, a
   mistyped code, an SMS that never came or a flat battery cost somebody the
   entire review they had just spent three minutes writing. There was nowhere to
   save it, because there was no verified identity to save it against until the
   very end.

   Verifying first costs thirty seconds up front and makes every answer after it
   recoverable.

   NOTHING IS PERSISTED FROM THIS SCREEN except the opaque token and the mask
   (see session.js). No phone number, no challenge, no code — not in storage, not
   in the URL. A verification that survived being handed to somebody else would
   not be a verification.
   ========================================================================= */

export function IdentityFlow({ facility }) {
  const navigate = useNavigate();
  const pinnedVersion = useFormVersion();

  const [stage, setStage] = useState("phone"); // phone | otp | opening | already
  const [challenge, setChallenge] = useState(null);
  const [e164, setE164] = useState("");
  const [typed, setTyped] = useState("");
  const [totalScreens, setTotalScreens] = useState(null);
  const [error, setError] = useState(null);

  const reviewHref = `/review/${encodeURIComponent(facility.id)}`;

  /*
    ALREADY VERIFIED IN THIS TAB? Go straight through. Somebody who taps Back
    from question one should not be made to request a second SMS to get forward
    again — and a second code would invalidate the first, so the "helpful"
    re-verify actively breaks the session they already had.
  */
  useEffect(() => {
    if (loadSession(facility.id)) navigate(reviewHref, { replace: true });
  }, [facility.id, reviewHref, navigate]);

  /* The denominator, counted from the config for THIS person's path. */
  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    getReviewForm(facility.id, pinnedVersion, controller.signal)
      .then((config) => {
        if (!live) return;
        setTotalScreens(
          visibleScreens(config, {
            facilitySource: facility.pending ? "unlisted" : "listed",
          }).length,
        );
      })
      .catch(() => {
        // No honest number to show, so none is shown. A guessed denominator is
        // worse than no counter.
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [facility.id, facility.pending, pinnedVersion]);

  async function open(verificationToken, expiresAt, phoneMasked) {
    setStage("opening");
    setError(null);

    try {
      /*
        The duplicate check happens HERE, not at submit. Finding out you have
        already reviewed a hospital AFTER answering twenty questions about it is
        the version of this rule that makes people feel cheated.
      */
      const existing = loadDraft(facility.id, pinnedVersion ?? "")?.draftId;
      const session = await startReviewSession({
        facilityId: facility.id,
        verificationToken,
        draftId: existing,
      });

      if (session.alreadyReviewed) {
        setStage("already");
        return;
      }

      saveSession(facility.id, {
        verificationToken,
        expiresAt,
        phoneMasked,
        draftId: session.draftId,
      });
      navigate(reviewHref);
    } catch (caught) {
      setStage("otp");
      setError(
        isApiError(caught) && caught.isRetryable
          ? "We could not start your review. Check your connection and try again."
          : "We could not start your review. Try again in a moment.",
      );
    }
  }

  /* ---------------------------------------------------------- already done */
  if (stage === "already") {
    return (
      <div>
        <h1 className="text-title">You have already reviewed this one</h1>
        {/*
          NOT AN ERROR, AND IT MUST NOT READ AS ONE. They have done nothing
          wrong — they wrote a review, which is the thing we asked for. One per
          facility per person is what keeps a Trust Score meaningful, so this
          explains the rule and offers the next useful thing.
        */}
        <p className="mt-3 text-body text-ink-muted">
          Our records show this number has already shared an experience of{" "}
          <span className="font-medium text-ink">{facility.name}</span>. We take
          one review per person per facility — it is what stops a single voice
          counting several times, and it is why these scores are worth reading.
        </p>
        <p className="mt-3 text-body text-ink-muted">
          If something has changed, or you think this is a mistake, tell us at{" "}
          <span className="num">{"{{SUPPORT_CONTACT — PENDING}}"}</span>.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Button type="button" onClick={() => navigate("/")} className="w-full">
            Review a different facility
          </Button>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------- the flow */
  return (
    <div>
      {totalScreens ? (
        <>
          <p className="num text-caption uppercase tracking-wide text-ink-soft">
            Step 1 of {totalScreens}
          </p>
          <div
            className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-line"
            role="progressbar"
            aria-valuenow={1}
            aria-valuemin={1}
            aria-valuemax={totalScreens}
            aria-label="Progress through the review"
          >
            <div className="h-full bg-teal" style={{ width: `${(1 / totalScreens) * 100}%` }} />
          </div>
        </>
      ) : null}

      <p className="mt-3 text-small text-ink-muted">
        Your review of <span className="font-medium text-ink">{facility.name}</span>
      </p>

      <div className="mt-6">
        {stage === "phone" ? (
          <PhoneStep
            initialValue={typed}
            onSent={(nextChallenge, nextE164, nextTyped) => {
              setChallenge(nextChallenge);
              setE164(nextE164);
              setTyped(nextTyped);
              setError(null);
              setStage("otp");
            }}
          />
        ) : null}

        {stage === "otp" && challenge ? (
          <>
            <OtpStep
              challenge={challenge}
              e164={e164}
              onVerified={(result) =>
                open(result.verificationToken, result.expiresAt, result.phoneMasked)
              }
              onChangeNumber={() => {
                // Drop the challenge with the number it was issued for. Keeping
                // it would let a code sent to one number verify another.
                setChallenge(null);
                setE164("");
                setError(null);
                setStage("phone");
              }}
            />
            {error ? (
              <p
                role="alert"
                className="mt-6 rounded border border-danger bg-danger-wash px-4 py-3 text-small text-danger"
              >
                {error}
              </p>
            ) : null}
          </>
        ) : null}

        {stage === "opening" ? (
          <div role="status">
            <h1 className="text-title">Setting up your review…</h1>
            <p className="mt-3 text-body text-ink-muted">One moment.</p>
          </div>
        ) : null}
      </div>

      {stage !== "opening" ? (
        <p className="mt-8 text-caption text-ink-soft">
          We confirm your number first so nothing you write can be lost.{" "}
          <Link to="/privacy" className="text-teal-ink underline underline-offset-4">
            How we handle it
          </Link>
        </p>
      ) : null}
    </div>
  );
}
