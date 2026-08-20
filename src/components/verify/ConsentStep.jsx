import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getConsentNotice } from "@/api";
import { buildConsentRecord, visibleConsentItems } from "@/lib/review/rules";
import { Button } from "@/components/ui/Button";

/* =========================================================================
   THE LAST SCREEN — PERMISSIONS, THEN SEND
   =========================================================================
   WHAT THIS SCREEN PRODUCES IS A CONSENT RECORD, NOT A BOOLEAN. Which items,
   against which notice version, at what moment, with the full wording each
   decision was made against copied verbatim. `agreed: true` is not evidence — it
   does not say what was agreed to, and the copy may have changed since.

   ---------------------------------------------------------------------------
   DESIGNED TO TAKE THE PRESSURE OFF, WITHOUT WEAKENING THE CONSENT
   ---------------------------------------------------------------------------
   By the time somebody reaches this screen they have answered five screens of
   questions and the review is written. From their side this last screen is pure
   overhead — so every ounce of friction here is friction on work already done,
   and it is the single most expensive place in the flow to lose somebody.

   THE REQUIRED STATEMENTS SHARE ONE TICK. Every one of them is mandatory — you
   cannot submit a review without all of them — so separate checkboxes offered no
   actual choice. There was no combination available other than all-or-nothing,
   which made the extra taps friction on a decision that was already binary.

   THAT IS NOT THE BUNDLING THE LAW PROHIBITS, and the distinction is worth
   holding onto because it is easy to get backwards. The rule exists to stop
   somebody being made to accept an OPTIONAL purpose in order to get a necessary
   one. What is merged here is a warranty ("this is my own experience"), contract
   acceptance ("I agree to the terms") and the processing without which there is
   no service at all. What stays separate is everything a person can refuse and
   still get their review published. Merge one of THOSE into this tick and it
   becomes exactly the pattern the rule is about.

   THREE CONDITIONS THIS RELIES ON. None may be quietly dropped:

     1. EVERY STATEMENT IS VISIBLE ABOVE THE TICK, not behind a link. Bundling
        the ACTION is fine; hiding the SUBSTANCE is not. "Informed" and
        "specific" are separate requirements and only the second is being merged.
     2. NOTHING STARTS TICKED, so it is still one deliberate affirmative act.
     3. THE RECORD DOES NOT COLLAPSE. `buildConsentRecord` still writes one grant
        per statement with its own full wording verbatim. How many taps it took is
        a fact about the screen; what was agreed to is a fact about the person,
        and that has to stay answerable statement by statement, years later.

   The rest of the pressure comes off elsewhere:

     - IT OPENS WITH REASSURANCE, NOT PAPERWORK. The three things people are
       actually anxious about — is my name on this, does the hospital see my
       number, can I undo it — are answered before a single checkbox appears.
     - ONE DISCLOSURE, NOT ONE PER ROW. The same information, in a form somebody
       might actually open.
     - MISSING THE BOX IS NOT AN ERROR. It is not red and it does not say
       something went wrong, because nothing did: they have not finished yet.
     - THE OPTIONAL ITEMS ARE ON SCREEN, not behind a disclosure, but styled
       quieter than the block above so they read as an offer rather than more
       paperwork. Collapsed they were effectively never asked, and one of them is
       the only way somebody hears that ZOEVERSE has launched. Each keeps its own
       tick: somebody can send having declined every one, and nothing on screen
       treats that as a mistake.

   THE LINE THIS MUST NOT CROSS: the visible one-liner has to be a faithful
   compression of the recorded wording. Hiding the verbosity is the point; hiding
   the substance would make this layout a dark pattern.
   ========================================================================= */

export function ConsentStep({ formVersion, config, answers, onConfirmed }) {
  const [notice, setNotice] = useState(null);
  const [failed, setFailed] = useState(false);
  /** The single tick covering every required statement. Starts false. */
  const [acceptedAll, setAcceptedAll] = useState(false);
  /** Per-item, for the optional ones only. */
  const [optionalTicked, setOptionalTicked] = useState({});
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    let live = true;
    const controller = new AbortController();

    getConsentNotice(formVersion, controller.signal)
      .then((result) => {
        if (!live) return;
        setNotice(result);
        // Everything starts unticked, the required bundle included. A pre-ticked
        // box is not consent, and there is no exception for the ones we need.
        setAcceptedAll(false);
        setOptionalTicked(
          Object.fromEntries(
            (result.items ?? []).filter((i) => !i.required).map((item) => [item.id, false]),
          ),
        );
      })
      .catch(() => {
        if (live) setFailed(true);
      });

    return () => {
      live = false;
      controller.abort();
    };
  }, [formVersion]);

  if (failed) {
    return (
      <div>
        <h1 className="text-title">Almost done</h1>
        {/*
          NO BUILT-IN FALLBACK COPY. There is no safe default consent wording:
          showing text we invented locally would record somebody agreeing to
          something legal never wrote. Failing loudly is the correct behaviour.
        */}
        <p className="mt-4 text-body text-ink">We could not load the permissions.</p>
        <p className="mt-1 text-small text-ink-muted">
          We cannot take your review without showing you these first. Check your
          connection and reload the page — your answers are saved.
        </p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div>
        <h1 className="text-title">Almost done</h1>
        <p className="mt-4 text-body text-ink-soft">One moment…</p>
      </div>
    );
  }

  // Only the items that apply to THIS review. Everything below — what is
  // rendered, what blocks the button, and what ends up in the record — reads from
  // this one list, so the three can never disagree.
  const items = visibleConsentItems(notice.items ?? [], answers, config);
  const required = items.filter((item) => item.required);
  const optional = items.filter((item) => !item.required);
  const ready = acceptedAll;
  const optionalChosen = optional.filter((item) => optionalTicked[item.id]).length;

  function confirm() {
    setAttempted(true);

    if (!ready) {
      const box = document.getElementById("consent-accept-all");
      box?.focus();
      box?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    /*
      ONE TICK IN, ONE GRANT PER STATEMENT OUT. The VISIBLE items only — an item
      that did not apply was never asked, and recording it as refused would
      misstate what was put in front of them.
    */
    onConfirmed(
      buildConsentRecord(
        items,
        { requiredAccepted: acceptedAll, optional: optionalTicked },
        notice.version,
        new Date().toISOString(),
      ),
    );
  }

  return (
    <div>
      <h1 className="text-title">Almost done</h1>
      <p className="mt-3 text-body text-ink-muted">
        Your review is written. This last part is just permissions — about ten
        seconds.
      </p>

      {/* ---------------------------------------------------- reassurance
          The three things people are actually anxious about, answered before a
          single checkbox appears. `notice.intro` says the same in a sentence;
          this is the scannable form of it, because nobody reads a paragraph
          while deciding whether to trust you. */}
      <ul className="mt-6 space-y-2 rounded bg-teal-wash px-4 py-4">
        {[
          "Your name is never shown on the site.",
          "Your number is never given to the facility.",
          "You can have it taken down whenever you like.",
        ].map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-small text-ink">
            <span aria-hidden className="mt-px shrink-0 text-teal-ink">
              ✓
            </span>
            {line}
          </li>
        ))}
      </ul>

      {/* -------------------------------------------------------- required */}
      <div className="mt-8">
        <h2 className="text-heading">A few things to confirm</h2>

        <div
          className={`mt-3 rounded border bg-surface ${
            acceptedAll || attempted ? "border-teal-ink" : "border-line"
          }`}
        >
          {/*
            EVERY STATEMENT IS ON SCREEN, above the tick and never behind a link.
            The tick merges the ACTION; it must not merge the reading. Agreeing to
            a list you cannot see is not informed consent however few taps it
            takes.
          */}
          <ul className="space-y-2.5 px-4 pt-4">
            {required.map((item) => (
              <li key={item.id} className="text-body text-ink">
                <span aria-hidden className="mr-2 text-teal-ink">
                  •
                </span>
                {item.label}
                {/* Its own line with a real tap target. Inline it measured 18px
                    tall — and this is the one link somebody genuinely needs to
                    reach BEFORE agreeing, so it cannot be the hardest thing on
                    the screen to hit. */}
                {item.link ? (
                  <Link
                    to={item.link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
                  >
                    {item.link.label} ↗
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>

          {/* ONE disclosure for all of them. A separate "full wording" toggle per
              statement is a wall; this is the same text in a form somebody might
              actually open. */}
          <details className="px-4">
            <summary className="inline-flex min-h-tap cursor-pointer items-center text-caption text-teal-ink underline underline-offset-4">
              Read the exact wording
            </summary>
            <div className="mb-2 mt-1 space-y-3 border-l-2 border-line pl-4">
              {items.map((item) => (
                <div key={item.id}>
                  <p className="text-caption font-medium text-ink">{item.label}</p>
                  <p className="mt-0.5 text-small text-ink-muted">{item.text}</p>
                </div>
              ))}
            </div>
          </details>

          {/*
            The one affirmative act. Starts unticked, always — a pre-ticked box is
            not consent, and neither is a box somebody never had to touch.
          */}
          <div
            className={`zoe-focus-row border-t px-4 ${
              acceptedAll ? "border-teal-ink bg-teal-wash" : "border-line"
            }`}
          >
            <label
              htmlFor="consent-accept-all"
              className="flex min-h-tap cursor-pointer items-center gap-3 py-3"
            >
              <input
                id="consent-accept-all"
                type="checkbox"
                checked={acceptedAll}
                onChange={(e) => setAcceptedAll(e.target.checked)}
                aria-invalid={(attempted && !acceptedAll) || undefined}
                className="h-6 w-6 shrink-0 accent-teal-ink"
              />
              <span className="text-body font-medium text-ink">
                Yes — I agree to all of these.
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------- optional */}
      {optional.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-heading">Want a text from us?</h2>
          <p className="mt-1 text-small text-ink-soft">
            {optionalChosen > 0
              ? "Thank you — you can untick either one."
              : "Both optional. Skip one, or both — your review sends either way."}
          </p>

          <div className="mt-3 space-y-2">
            {optional.map((item) => (
              <ConsentRow
                key={item.id}
                item={item}
                checked={!!optionalTicked[item.id]}
                onChange={(next) =>
                  setOptionalTicked((prev) => ({ ...prev, [item.id]: next }))
                }
              />
            ))}
          </div>
        </div>
      ) : null}

      {/*
        NOT AN ERROR, AND IT DOES NOT LOOK LIKE ONE. Nothing has gone wrong — they
        have not finished yet. Red here punishes somebody for the state the screen
        was in when it loaded. It still announces to a screen reader, and the
        input still carries aria-invalid; only the alarm is gone.
      */}
      {attempted && !ready ? (
        <p
          role="alert"
          className="mt-6 rounded border border-teal-ink bg-teal-wash px-4 py-3 text-small text-ink"
        >
          Tick the box above to send your review.
        </p>
      ) : null}

      {/*
        THE WAY OUT, ON SCREEN, NOT BEHIND A LINK. The moment somebody is deciding
        whether to agree is the moment the way to change their mind has to be
        legible — putting it one tap away makes agreeing the only visible option,
        which is the shape of a dark pattern even when the intent is innocent.
      */}
      {notice.withdrawal ? (
        <p className="mt-6 text-small text-ink-muted">{notice.withdrawal}</p>
      ) : null}

      <Button
        type="button"
        onClick={confirm}
        // NOT `disabled`. A disabled button gives no feedback when tapped, so
        // somebody who has missed the box gets silence and no idea why. This one
        // is pressable, says what is left, and moves focus there.
        aria-disabled={!ready}
        className={`mt-6 w-full ${ready ? "" : "opacity-60"}`}
      >
        Agree and send my review
      </Button>

      <details className="mt-6">
        <summary className="min-h-tap cursor-pointer text-small text-teal-ink underline underline-offset-4">
          Your rights, and changing your mind
        </summary>
        <p className="mt-2 text-small text-ink-muted">{notice.rights}</p>
        <Link
          to="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
        >
          Read the privacy notice ↗
        </Link>
        <p className="mt-2 text-caption text-ink-soft">
          Consent version <span className="num">{notice.version}</span>
        </p>
      </details>
    </div>
  );
}

/**
 * One OPTIONAL permission: a checkbox and a readable one-liner.
 *
 * Only the optional items render this way. The required ones share a single
 * tick, because every one of them is mandatory and separate boxes offered no
 * choice — see the header. These are the ones a person can genuinely refuse, so
 * each keeps its own control.
 *
 * THE LINK SITS OUTSIDE THE `<label>`. Tapping anywhere in a label toggles its
 * checkbox, so anything interactive nested inside would either navigate AND tick
 * the box or swallow the tap.
 */
function ConsentRow({ item, checked, onChange }) {
  return (
    <div
      className={`zoe-focus-row rounded border px-4 py-1 ${
        checked ? "border-teal-ink bg-teal-wash" : "border-line bg-surface"
      }`}
    >
      {/* min-h-tap on the LABEL, not the checkbox. The box itself is 24px and
          always will be; the label is what a thumb actually lands on, and a
          one-line consent would otherwise be a 26px target. */}
      <label
        htmlFor={`consent-${item.id}`}
        className="flex min-h-tap cursor-pointer items-center gap-3 py-2"
      >
        <input
          id={`consent-${item.id}`}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-6 w-6 shrink-0 accent-teal-ink"
        />
        <span className="text-body text-ink">{item.label}</span>
      </label>

      {item.link ? (
        <Link
          to={item.link.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-1 ml-9 inline-flex min-h-tap items-center text-caption text-teal-ink underline underline-offset-4"
        >
          {item.link.label} ↗
        </Link>
      ) : null}
    </div>
  );
}
