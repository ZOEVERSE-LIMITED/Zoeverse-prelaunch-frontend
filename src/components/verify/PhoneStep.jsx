import { useId, useState } from "react";
import { isApiError, requestOtp } from "@/api";
import { normalizeNigerianPhone } from "@/lib/phone";
import { Button } from "@/components/ui/Button";
import { Field, TextInput, describedBy } from "@/components/ui/Field";

/**
 * STEP 1 — the phone number.
 *
 * The number is normalised to E.164 here, before it reaches the API, so no
 * endpoint ever receives "0803 123 4567" and has to guess.
 *
 * NOTHING STORES THE RAW NUMBER. It lives in this component's state while
 * somebody is typing and is handed to `requestOtp`; after that the flow carries
 * a `challengeId`, then a `verificationToken`. It is never written to storage,
 * never put in a URL, and never logged.
 */
export function PhoneStep({ initialValue, onSent }) {
  const inputId = useId();

  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  const parsed = normalizeNigerianPhone(value);

  async function onSubmit(event) {
    event.preventDefault();
    setError(null);

    // Validate on submit, not on every keystroke. Telling somebody their number
    // is wrong while they are still halfway through typing it is just noise.
    if (!parsed.ok) {
      setError(parsed.reason);
      document.getElementById(inputId)?.focus();
      return;
    }

    setSending(true);
    try {
      const challenge = await requestOtp(parsed.e164);
      onSent(challenge, parsed.e164, value);
    } catch (err) {
      if (isApiError(err)) {
        if (err.code === "validation") {
          setError(err.fieldErrors?.phone ?? "Check the number and try again.");
        } else if (err.code === "rate_limited") {
          const wait = err.retryAfterSeconds;
          setError(
            wait
              ? `Too many attempts. Try again in ${wait} seconds.`
              : "Too many attempts. Try again shortly.",
          );
        } else {
          setError("We could not send the code. Check your connection and try again.");
        }
      } else {
        setError("We could not send the code. Try again in a moment.");
      }
      setSending(false);
    }
    // On success the parent swaps this step out, so `sending` is left true
    // deliberately — clearing it would flash the button back to its idle label
    // for one frame during the transition.
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <h1 className="text-title">Confirm it&apos;s you</h1>

      <p className="mt-3 text-body text-ink-muted">
        We text you a <span className="num">6</span>-digit code. This is how
        ZOEVERSE knows every review comes from a real person.
      </p>

      <p className="mt-3 text-small text-ink-soft">
        Your number is never shown on the site, and never given to the facility
        you are reviewing.
      </p>

      <div className="mt-8">
        <Field
          label="Your phone number"
          htmlFor={inputId}
          hint="Nigerian mobile numbers only."
          error={error ?? undefined}
        >
          <TextInput
            id={inputId}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="send"
            placeholder="0803 123 4567"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            invalid={!!error}
            aria-describedby={describedBy(inputId, true, !!error)}
          />
        </Field>

        {/*
          Echo back what we understood, once it parses. Somebody who typed +234
          or left off the zero gets to see that we read it correctly, and it
          costs nothing when the number is already in the obvious shape.
        */}
        {parsed.ok && !error ? (
          <p className="mt-2 text-small text-ink-soft">
            We will text <span className="num">{parsed.display}</span>
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={sending} className="mt-8 w-full">
        {sending ? "Sending…" : "Send me a code"}
      </Button>
    </form>
  );
}
