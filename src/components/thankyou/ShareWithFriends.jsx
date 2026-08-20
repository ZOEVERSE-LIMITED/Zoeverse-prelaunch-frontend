import { useEffect, useState } from "react";

/* =========================================================================
   ASK ONE PERSON TO BRING ANOTHER
   =========================================================================
   Before launch, the only thing that matters is how many verified experiences
   exist. The moment somebody has just finished writing one is the moment they
   are most willing to ask a friend, so this sits on the thank-you page and
   nowhere else.

   ---------------------------------------------------------------------------
   THE SHARED MESSAGE NAMES NO FACILITY, AND CARRIES NOTHING THEY WROTE.
   ---------------------------------------------------------------------------
   "I just reviewed the Federal Neuro-Psychiatric Hospital" forwarded to a group
   chat tells everybody in it something about the sender's health. The message is
   about ZOEVERSE and links to the homepage — never to their review, never to the
   facility, never with a rating. There is nothing here to leak, by construction
   rather than by being careful.
   ========================================================================= */

/**
 * DRAFT COPY — worth the founder's eye before launch.
 * Says what the recipient is being asked to do, and why it is worth doing.
 */
const MESSAGE =
  "I just shared what a Lagos hospital was really like, on ZOEVERSE. " +
  "They're collecting real patient experiences before they launch, so people " +
  "can check a hospital before they need one. Takes a few minutes — add yours:";

export function ShareWithFriends() {
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [note, setNote] = useState(null);

  // Read on the client only. Hardcoding a production URL would send local
  // testers to the wrong place.
  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const shareText = `${MESSAGE} ${origin}`;

  async function nativeShare() {
    try {
      await navigator.share({ title: "ZOEVERSE", text: MESSAGE, url: origin });
    } catch {
      // Dismissing the sheet rejects, and that is not an error worth reporting.
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareText);
      setNote("Copied. Paste it anywhere.");
    } catch {
      // Clipboard access is blocked in some in-app browsers, which are exactly
      // where people open links from WhatsApp. Say so rather than doing nothing.
      setNote("Could not copy. Select the link above and copy it by hand.");
    }
  }

  return (
    <section className="mt-10 rounded border border-line bg-surface px-4 py-5">
      <h2 className="font-display text-heading font-bold text-ink">
        Know someone with a hospital story?
      </h2>
      <p className="mt-1 text-small text-ink-muted">
        Every experience makes the next person&apos;s decision easier. Nothing you
        wrote is shared — just the link.
      </p>

      <div className="mt-4 flex flex-col gap-3">
        {canShare ? (
          <button
            type="button"
            onClick={nativeShare}
            className="inline-flex min-h-tap items-center justify-center rounded bg-teal px-5 py-3 text-body font-medium text-surface"
          >
            Share
          </button>
        ) : null}

        {/*
          A plain link, not a button with a click handler. `wa.me` has to be a
          real navigation for the app to open on Android, and an anchor also
          survives a long-press, a middle click, and JavaScript failing to load.
        */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-tap items-center justify-center gap-2 rounded bg-whatsapp px-5 py-3 text-body font-medium text-ink"
        >
          {/* Label is Navy on WhatsApp green: 8.77:1. White would be 1.98:1. */}
          Share on WhatsApp
        </a>

        <button
          type="button"
          onClick={copyLink}
          className="inline-flex min-h-tap items-center justify-center rounded border border-line bg-surface px-5 py-3 text-body font-medium text-teal-ink"
        >
          Copy the link
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-[1.25rem] text-small text-ink-muted">
        {note ?? ""}
      </p>
    </section>
  );
}
