import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviewForm, isApiError, startReviewSession } from "@/api";
import { loadDraft } from "@/lib/review/draft";
import { useFormVersion } from "@/lib/review/formVersion";
import { visibleScreens } from "@/lib/review/rules";
import { loadSession, saveSession } from "@/lib/review/session";
import { Button } from "@/components/ui/Button";
import { describedBy, Field, TextInput } from "@/components/ui/Field";
import { recordJourney } from '@/lib/review/journey';

export function IdentityFlow({ facility }) {
  const navigate = useNavigate();
  const pinnedVersion = useFormVersion();
  const [config, setConfig] = useState(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newsletterSubscribe, setNewsletterSubscribe] = useState(false);
  const [emailError, setEmailError] = useState(null);
  const [stage, setStage] = useState("name");
  const [error, setError] = useState(null);
  const [totalScreens, setTotalScreens] = useState(null);
  const reviewHref = `/review/${encodeURIComponent(facility.id)}`;

  useEffect(() => {
    if (loadSession(facility.id)) navigate(reviewHref, { replace: true });
  }, [facility.id, reviewHref, navigate]);

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    getReviewForm(facility.id, pinnedVersion, controller.signal)
      .then((result) => {
        if (!live) return;
        setConfig(result);
        setTotalScreens(visibleScreens(result, {
          facilitySource: facility.pending ? "unlisted" : "listed",
        }).length);
      })
      .catch(() => {
        if (live) setError("We could not load the review form. Check your connection and try again.");
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [facility.id, facility.pending, pinnedVersion]);

  const nameField = config?.identity?.nameField;

  async function begin(event) {
    event.preventDefault();
    const reviewerName = name.trim();
    const reviewerEmail = email.trim();
    if (reviewerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewerEmail)) {
      setEmailError("Enter a valid email address, or leave this blank.");
      return;
    }
    const minLength = nameField?.minLength ?? 2;
    const maxLength = nameField?.maxLength ?? 120;

    if (reviewerName.length < minLength) {
      setError("Enter your name to continue.");
      return;
    }
    if (reviewerName.length > maxLength) {
      setError(`Your name must be ${maxLength} characters or fewer.`);
      return;
    }

    setStage("opening");
    setError(null);
    try {
      const existing = loadDraft(facility.id, pinnedVersion ?? "")?.draftId;
      const session = await startReviewSession({ facilityId: facility.id, reviewerName, draftId: existing, ...(reviewerEmail ? { email: reviewerEmail, newsletterSubscribe } : {}) });

      if (session.alreadyReviewed) {
        setStage("already");
        return;
      }

      recordJourney(session.draftId, 'identity', 'view');
      recordJourney(session.draftId, 'identity', 'continue');
      saveSession(facility.id, {
        draftId: session.draftId,
        reviewerName: session.reviewerName,
        formVersion: session.formVersion,
        expiresAt: session.expiresAt,
      });
      navigate(reviewHref);
    } catch (caught) {
      setStage("name");
      setError(
        caught?.fieldErrors?.reviewerName ??
          (isApiError(caught) && caught.isRetryable
            ? "We could not start your review. Check your connection and try again."
            : "We could not start your review. Try again in a moment."),
      );
    }
  }

  if (stage === "already") {
    return (
      <div>
        <h1 className="text-title">You have already reviewed this facility</h1>
        <p className="mt-3 text-body text-ink-muted">
          A review with this name has already been submitted for {facility.name}.
        </p>
        <Button type="button" onClick={() => navigate("/")} className="mt-8 w-full">
          Review a different facility
        </Button>
      </div>
    );
  }

  return (
    <div>
      {totalScreens ? (
        <>
          <p className="num text-caption uppercase tracking-wide text-ink-soft">Step 1 of {totalScreens}</p>
          <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-line" role="progressbar" aria-valuenow={1} aria-valuemin={1} aria-valuemax={totalScreens} aria-label="Progress through the review">
            <div className="h-full bg-teal" style={{ width: `${100 / totalScreens}%` }} />
          </div>
        </>
      ) : null}

      <p className="mt-3 text-small text-ink-muted">
        Your review of <span className="font-medium text-ink">{facility.name}</span>
      </p>

      {stage === "opening" ? (
        <div className="mt-6" role="status">
          <h1 className="text-title">Setting up your review…</h1>
          <p className="mt-3 text-body text-ink-muted">One moment.</p>
        </div>
      ) : (
        <form className="mt-6" onSubmit={begin} noValidate>
          <h1 className="text-title">{config?.identity?.title ?? "Your name"}</h1>
          <p className="mt-3 text-body text-ink-muted">
            {config?.identity?.subtitle ?? "You can choose how your name appears publicly before submitting."}
          </p>
          <div className="mt-6">
            <Field htmlFor="reviewer-name" label={nameField?.label ?? "Your name"} error={error}>
              <TextInput
                id="reviewer-name"
                value={name}
                onChange={(event) => { setName(event.target.value); setError(null); }}
                placeholder={nameField?.placeholder ?? "Enter your name"}
                autoComplete="name"
                maxLength={nameField?.maxLength ?? 120}
                required
                invalid={!!error}
                aria-describedby={describedBy("reviewer-name", false, !!error)}
              />
            </Field>
          </div>
          <div className="mt-6">
            <Field htmlFor="reviewer-email" label="Your email" optional error={emailError}
              hint="We’ll send a thank-you after submission and reminders every 10 hours if your review is unfinished. Your address stays private.">
              <TextInput id="reviewer-email" type="email" autoComplete="email" inputMode="email"
                value={email} maxLength={254} placeholder="you@example.com"
                onChange={(event) => { setEmail(event.target.value); setEmailError(null); }}
                invalid={!!emailError} aria-describedby={describedBy("reviewer-email", true, !!emailError)} />
            </Field>
            {email.trim() && <label className="mt-4 flex min-h-tap items-start gap-3 text-small text-ink-muted">
              <input type="checkbox" checked={newsletterSubscribe} onChange={(event) => setNewsletterSubscribe(event.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-teal-ink" />
              <span>Subscribe me to the Zoeverse newsletter.</span>
            </label>}
          </div>
          <Button type="submit" className="mt-6 w-full">Start my review</Button>
        </form>
      )}
    </div>
  );
}
