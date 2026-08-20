import { useEffect, useId, useRef, useState } from "react";
import { isApiError, requestOtp, verifyOtp } from "@/api";
import { Button } from "@/components/ui/Button";

/**
 * STEP 2 — the six-digit code.
 *
 * SIX BOXES, ONE VALUE. The boxes are a presentation of a single six-character
 * string held in one piece of state. Every interaction — typing, pasting,
 * backspacing, autofill — edits that string and the boxes re-render from it. Six
 * independent states would mean six ways for them to disagree.
 */
export function OtpStep({ challenge, e164, onVerified, onChangeNumber }) {
  const groupId = useId();
  const length = challenge.codeLength;

  const [code, setCode] = useState("");
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);
  const [expired, setExpired] = useState(false);
  const [current, setCurrent] = useState(challenge);
  const [resending, setResending] = useState(false);
  const [resentNote, setResentNote] = useState(null);

  const boxes = useRef([]);
  const secondsLeft = useCountdown(current.resendAvailableAt);
  const canResend = secondsLeft === 0 && !resending;

  function focusBox(index) {
    boxes.current[Math.max(0, Math.min(length - 1, index))]?.focus();
  }

  /** Every edit funnels through here, so the rules live in exactly one place. */
  function write(next, caret) {
    const digits = next.replace(/\D/g, "").slice(0, length);
    setCode(digits);
    // Clear the error the moment they change anything. Leaving "that code is not
    // right" on screen while somebody retypes reads as though the new attempt
    // has already failed too.
    if (error) setError(null);
    focusBox(caret);
    if (digits.length === length) void submit(digits);
  }

  function onBoxChange(index, raw) {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") return;

    // More than one digit in a single box means autofill or a paste that did not
    // fire a paste event. Spread it from this position instead of taking the
    // first character and dropping the rest.
    if (digits.length > 1) {
      const spread = (code.slice(0, index) + digits).slice(0, length);
      write(spread, spread.length);
      return;
    }

    // Replace this position. Slicing rather than index-assigning means a code
    // shorter than the focused box cannot end up with a hole in the middle.
    const next = (code.slice(0, index) + digits + code.slice(index + 1)).slice(0, length);
    write(next, index + 1);
  }

  /**
   * Put the caret back on the first box after a failed attempt.
   *
   * This has to be an effect, not a call inside the catch block. The boxes sit
   * in a `<fieldset disabled={checking}>`, and calling `.focus()` on a disabled
   * input does nothing at all — silently. By the time this runs, React has
   * re-rendered with `checking` false and the boxes accept focus again.
   */
  useEffect(() => {
    if (error && !checking) focusBox(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error, checking]);

  function onKeyDown(index, event) {
    if (event.key === "Backspace") {
      event.preventDefault();
      if (code[index]) {
        // Delete this box's digit and stay put.
        write(code.slice(0, index) + code.slice(index + 1), index);
      } else {
        // Empty box: step back and delete that one. This is what people expect
        // when they are correcting a mistyped code without looking.
        write(code.slice(0, Math.max(0, index - 1)) + code.slice(index), index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(index + 1);
    }
  }

  function onPaste(event) {
    // People copy the whole SMS, not just the digits. Strip everything else.
    const digits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (digits === "") return;
    event.preventDefault();
    write(digits, digits.length);
  }

  async function submit(value) {
    if (checking) return;
    setChecking(true);
    setResentNote(null);

    try {
      const result = await verifyOtp(current.challengeId, value);
      onVerified(result);
    } catch (err) {
      // The three OTP failures mean genuinely different things and each needs a
      // different next move. Collapsing them into "invalid code" strands
      // somebody who did nothing wrong.
      if (isApiError(err)) {
        if (err.code === "otp_expired") {
          setExpired(true);
          setError("That code has expired. Ask for a new one.");
        } else if (err.code === "otp_too_many_attempts") {
          setExpired(true);
          setError("Too many tries on this code. Ask for a new one.");
        } else if (err.code === "otp_invalid") {
          setError("That code is not right. Check the text and try again.");
        } else if (err.code === "not_found") {
          setExpired(true);
          setError("That code is no longer valid. Ask for a new one.");
        } else {
          setError("We could not check the code. Check your connection and try again.");
        }
      } else {
        setError("We could not check the code. Try again in a moment.");
      }

      setCode("");
      setChecking(false);
      // Focus is restored by the effect above, once the fieldset is live again.
    }
  }

  async function resend() {
    setResending(true);
    setError(null);
    setResentNote(null);
    try {
      const fresh = await requestOtp(e164);
      setCurrent(fresh);
      setExpired(false);
      setCode("");
      setResentNote("New code sent.");
      focusBox(0);
    } catch (err) {
      if (isApiError(err) && err.code === "rate_limited") {
        const wait = err.retryAfterSeconds;
        setError(
          wait
            ? `Too many requests. Try again in ${wait} seconds.`
            : "Too many requests. Try again shortly.",
        );
      } else {
        setError("We could not send a new code. Check your connection.");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <h1 className="text-title">Enter the code</h1>

      <p className="mt-3 text-body text-ink-muted">
        We sent <span className="num">{length}</span> digits to{" "}
        <span className="num text-ink">{current.phoneMasked}</span>.
      </p>

      <form
        className="mt-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.length === length) void submit(code);
        }}
      >
        <fieldset disabled={checking}>
          <legend id={groupId} className="text-body font-medium text-ink">
            Your {length}-digit code
          </legend>

          <div
            className="mt-3 flex gap-2"
            role="group"
            aria-labelledby={groupId}
            aria-describedby={error ? `${groupId}-error` : undefined}
          >
            {Array.from({ length }, (_, index) => (
              <input
                key={index}
                ref={(el) => {
                  boxes.current[index] = el;
                }}
                value={code[index] ?? ""}
                onChange={(e) => onBoxChange(index, e.target.value)}
                onKeyDown={(e) => onKeyDown(index, e)}
                onPaste={onPaste}
                onFocus={(e) => e.target.select()}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                // On the first box only: iOS reads the code out of the SMS and
                // fills it, and it distributes across the rest from there.
                autoComplete={index === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${index + 1} of ${length}`}
                aria-invalid={!!error || undefined}
                className={`num min-h-tap w-full min-w-0 rounded border bg-surface py-3 text-center text-title text-ink ${
                  error ? "border-danger" : "border-line"
                } focus:border-teal-ink`}
              />
            ))}
          </div>
        </fieldset>

        {/* Announced as well as shown — an error only conveyed by a red border
            does not exist for somebody using a screen reader. */}
        <p
          id={`${groupId}-error`}
          role="alert"
          className={`mt-3 text-small ${error ? "text-danger" : "sr-only"}`}
        >
          {error ?? ""}
        </p>

        {resentNote ? (
          <p aria-live="polite" className="mt-3 text-small text-success">
            {resentNote}
          </p>
        ) : null}

        {checking ? (
          <p aria-live="polite" className="mt-3 text-small text-ink-soft">
            Checking…
          </p>
        ) : null}

        {/* The code submits itself once the last digit lands, so this button is a
            fallback for autofill that does not fire an input event, and for
            anybody who prefers to press it. It is never the only way through. */}
        <Button type="submit" disabled={code.length !== length || checking} className="mt-6 w-full">
          {checking ? "Checking…" : "Confirm"}
        </Button>
      </form>

      <div className="mt-8 border-t border-line pt-6">
        <p className="text-small text-ink-muted">
          {expired ? "Ask for a new code to carry on." : "Texts can take a minute to arrive."}
        </p>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={resend}
            disabled={!canResend}
            className="inline-flex min-h-tap items-center justify-center rounded border border-line bg-surface px-5 py-3 text-body font-medium text-teal-ink disabled:border-line disabled:text-ink-soft"
          >
            {resending
              ? "Sending…"
              : canResend
                ? "Send a new code"
                : // A disabled button with no reason on it looks broken. The
                  // countdown is the reason.
                  `Send again in ${secondsLeft}s`}
          </button>

          <button
            type="button"
            onClick={onChangeNumber}
            className="inline-flex min-h-tap items-center justify-center rounded px-2 text-body text-teal-ink underline underline-offset-4"
          >
            Use a different number
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Seconds until `iso`, ticking down to 0.
 *
 * Driven off an absolute timestamp from the server rather than a counter, so
 * backgrounding the browser — which every phone does the moment somebody
 * switches to their SMS app — cannot leave the timer stuck at whatever second it
 * was on when the tab lost focus.
 */
function useCountdown(iso) {
  const remaining = () => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 1000));
  const [seconds, setSeconds] = useState(remaining);

  useEffect(() => {
    setSeconds(remaining());
    const timer = setInterval(() => {
      const next = remaining();
      setSeconds(next);
      if (next === 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [iso]);

  return seconds;
}
