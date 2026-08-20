import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getReviewForm, saveReviewSession } from "@/api";
import { clearDraft, describeAge, loadDraft, saveDraft } from "@/lib/review/draft";
import { isPinnedVersion, useFormVersion } from "@/lib/review/formVersion";
import { pruneAnswers, resolveScreen, screenErrors, visibleScreens } from "@/lib/review/rules";
import { clearSession, loadSession } from "@/lib/review/session";
import { Button } from "@/components/ui/Button";
import { QuestionField } from "./QuestionField";

/**
 * Where the facility came from, seeded as an answer so the CONFIG can branch on
 * it rather than a component.
 *
 * A facility somebody typed in themselves cannot be confirmed by them, so the
 * config drops that question with an ordinary `showWhen`. Expressing it as a
 * seeded answer keeps the rule declarative and keeps this file free of "if
 * pending, skip the confirmation".
 *
 * IT IS ALSO SENT WITH THE SUBMISSION. Without it the server cannot tell a
 * legitimately skipped confirmation from a client that bypassed a required
 * question.
 */
function seedSource(facility) {
  return { facilitySource: facility.pending ? "unlisted" : "listed" };
}

export function ReviewFlow({ facility }) {
  const navigate = useNavigate();
  const pinnedVersion = useFormVersion();

  const [config, setConfig] = useState(null);
  const [failed, setFailed] = useState(false);
  const [answers, setAnswers] = useState(() => seedSource(facility));
  const [screenIndex, setScreenIndex] = useState(0);
  const [errors, setErrors] = useState({});
  const [offeredDraft, setOfferedDraft] = useState(null);
  const [session, setSession] = useState(null);

  const headingRef = useRef(null);
  const restored = useRef(false);

  const startHref = `/review/${encodeURIComponent(facility.id)}/start`;

  /*
    VERIFICATION IS THE GATE, and it is checked before anything is loaded.
    Screen 0 is the phone number, so arriving here without a verified session
    means somebody deep-linked past it — send them to the front rather than
    letting them answer five screens they cannot submit.
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

        // A draft is OFFERED, never silently restored. Somebody returning to a
        // shared phone should be told what is about to reappear on screen before
        // it does — and given a way to say no.
        const draft = loadDraft(facility.id, result.version);
        if (draft) setOfferedDraft(draft);
      })
      .catch(() => {
        if (live) setFailed(true);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [facility.id, pinnedVersion, session]);

  /** Move focus to the new screen's heading so a screen reader follows along. */
  useEffect(() => {
    if (config && !offeredDraft) headingRef.current?.focus();
  }, [screenIndex, config, offeredDraft]);

  const persist = useCallback(
    (nextAnswers, nextScreenId) => {
      if (!config || !session) return;

      /*
        LOCAL FIRST, SERVER SECOND, AND THE SERVER CALL IS FIRE-AND-FORGET. The
        local copy is the one somebody actually resumes from, so it must not wait
        on a network round trip — and a failed save must never interrupt a review
        in progress with a message nobody asked for and nobody can act on. Saving
        is the optional part; the review is not.
      */
      saveDraft({
        facilityId: facility.id,
        formVersion: config.version,
        draftId: session.draftId,
        answers: nextAnswers,
        screenId: nextScreenId,
      });

      void saveReviewSession({
        draftId: session.draftId,
        answers: nextAnswers,
        screenId: nextScreenId,
      }).catch(() => {
        /* Deliberately silent — see above. */
      });
    },
    [config, facility.id, session],
  );

  if (failed) {
    return (
      <div>
        <h1 className="text-title">We could not load the questions</h1>
        <p className="mt-3 text-body text-ink-muted">
          Check your connection and reload the page.
        </p>
      </div>
    );
  }

  if (!config || !session) {
    return (
      <div>
        <h1 className="text-title">{facility.name}</h1>
        <p className="mt-3 text-body text-ink-soft">Loading the questions…</p>
      </div>
    );
  }

  if (offeredDraft && !restored.current) {
    return (
      <ResumePrompt
        draft={offeredDraft}
        facilityName={facility.name}
        onResume={() => {
          restored.current = true;
          // Re-seed rather than trust the draft: where the facility came from is
          // a fact about THIS visit, not something to restore from storage.
          const restoredAnswers = { ...offeredDraft.answers, ...seedSource(facility) };
          setAnswers(restoredAnswers);

          // Resume by screen ID. If that screen no longer applies — because an
          // answer changed what is asked — fall back to the start rather than
          // dropping somebody onto an arbitrary position.
          const screens = visibleScreens(config, restoredAnswers).filter((s) => !s.ownRoute);
          const at = screens.findIndex((s) => s.id === offeredDraft.screenId);
          setScreenIndex(at >= 0 ? at : 0);
          setOfferedDraft(null);
        }}
        onDiscard={() => {
          restored.current = true;
          clearDraft(facility.id);
          setOfferedDraft(null);
        }}
      />
    );
  }

  /*
    EVERYTHING COUNTS VISIBLE SCREENS, NEVER THE TOTAL DEFINED. A screen dropped
    by an earlier answer must not appear in the denominator, or the indicator
    promises a step that never arrives — "Step 2 of 6" followed by a jump
    straight to 3.
  */
  const shown = visibleScreens(config, answers);
  const answerScreensList = shown.filter((entry) => !entry.ownRoute);
  const answerScreens = answerScreensList.length;
  const total = shown.length;

  const current = answerScreensList[Math.min(screenIndex, answerScreens - 1)];

  /*
    The step NUMBER is the current screen's position among the screens THIS
    PERSON sees, own-route screens included. Identity was screen 0 and they have
    already done it, so the first question screen is step 2 — numbering from the
    question screens alone would show "Step 1 of 6" to somebody who has already
    completed one.
  */
  const stepNumber = shown.indexOf(current) + 1;
  const screen = resolveScreen(current, config, answers);

  function setAnswer(id, value) {
    setAnswers((prev) => {
      // Prune here, not at submit. Switching payer away from HMO must drop the
      // HMO answer immediately, or a later screen can still read it and route on
      // a fact the person has already retracted.
      return pruneAnswers(config, { ...prev, [id]: value });
    });
    // Clear this question's error the moment it is answered, rather than leaving
    // it red until the next Continue.
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const rest = { ...prev };
      delete rest[id];
      return rest;
    });
  }

  function goNext() {
    const found = screenErrors(current, config, answers);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const first = document.getElementById(`${Object.keys(found)[0]}-error`);
      first?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    const next = screenIndex + 1;
    setErrors({});

    if (next >= answerScreens) {
      // Save against the screen they finished on, so a resume after abandoning at
      // consent returns them to the last thing they answered rather than to a
      // screen that does not exist yet.
      persist(answers, current.id);
      navigate(`/review/${encodeURIComponent(facility.id)}/verify`);
      return;
    }

    persist(answers, answerScreensList[next].id);
    setScreenIndex(next);
  }

  function goBack() {
    const previous = Math.max(0, screenIndex - 1);
    setErrors({});
    persist(answers, answerScreensList[previous].id);
    setScreenIndex(previous);
  }

  return (
    <div>
      {/*
        A pinned version is a preview, and it says so.

        IT ALSO SAYS WHAT THE PREVIEW DOES NOT COVER. The screens are laid out by
        the CURRENT routing whichever question set is loaded — verification
        first, consent last — because that routing lives in these components, not
        in the config. So pinning an older version shows its wording and its
        options inside today's screen order, which is genuinely useful for
        comparing questions and actively misleading if read as "this is what the
        old flow looked like". Saying so is the difference between the two.
      */}
      {isPinnedVersion(pinnedVersion) ? (
        <p className="mb-4 rounded border border-line bg-surface px-3 py-2 text-caption text-ink-muted">
          Previewing the questions from <span className="num">{config.version}</span>. The
          screen order is always the current one, so this shows the old wording,
          not the old flow. Reopen without <span className="num">?form=</span> for
          the live version.
        </p>
      ) : null}

      <div className="flex items-baseline justify-between gap-4">
        <p className="num text-caption uppercase tracking-wide text-ink-soft">
          Step {stepNumber} of {total}
        </p>
        <button
          type="button"
          onClick={() => {
            clearDraft(facility.id);
            clearSession(facility.id);
            navigate("/");
          }}
          className="min-h-tap rounded px-2 text-caption text-ink-soft underline underline-offset-4"
        >
          Discard and start again
        </button>
      </div>

      {/* A plain bar, not an animated one. It is information, not decoration, and
          it costs nothing on a slow device. */}
      <div
        className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-line"
        role="progressbar"
        aria-valuenow={stepNumber}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label="Progress through the review"
      >
        <div className="h-full bg-teal" style={{ width: `${(stepNumber / total) * 100}%` }} />
      </div>

      <h1 ref={headingRef} tabIndex={-1} className="mt-6 text-title">
        {screen.title}
      </h1>
      {screen.subtitle ? (
        <p className="mt-2 text-body text-ink-muted">{screen.subtitle}</p>
      ) : null}

      <div className="mt-8 space-y-10">
        {screen.questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            value={answers[question.id] ?? null}
            onChange={(value) => setAnswer(question.id, value)}
            facility={facility}
            error={errors[question.id]}
            // "Skip ahead" is Continue. One code path, so a screen cannot be left
            // two different ways with two different sets of checks.
            onSkip={goNext}
          />
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-3">
        <Button type="button" onClick={goNext} className="w-full">
          {screenIndex + 1 >= answerScreens ? "Continue to the last step" : "Continue"}
        </Button>
        {screenIndex > 0 ? (
          <Button type="button" variant="secondary" onClick={goBack} className="w-full">
            Back
          </Button>
        ) : null}
      </div>

      <p className="mt-6 text-caption text-ink-soft">
        Your answers are saved as you go, so you can come back to them.
      </p>
    </div>
  );
}

function ResumePrompt({ draft, facilityName, onResume, onDiscard }) {
  // `facilitySource` is seeded, not answered, so it must not be counted as one.
  const answered = Object.keys(draft.answers).filter((id) => id !== "facilitySource").length;

  return (
    <div>
      <h1 className="text-title">Pick up where you left off?</h1>
      <p className="mt-3 text-body text-ink-muted">
        You started a review of{" "}
        <span className="font-medium text-ink">{facilityName}</span>{" "}
        {describeAge(draft.savedAt)} and answered <span className="num">{answered}</span>{" "}
        {answered === 1 ? "question" : "questions"}.
      </p>

      {/*
        No answers are shown here, only the count. Somebody else may be holding
        this phone, and the content of a half-finished health review is not
        something to put on screen before its author has said it is them.
      */}
      <div className="mt-8 flex flex-col gap-3">
        <Button type="button" onClick={onResume} className="w-full">
          Carry on
        </Button>
        <Button type="button" variant="secondary" onClick={onDiscard} className="w-full">
          Start again
        </Button>
      </div>
    </div>
  );
}
