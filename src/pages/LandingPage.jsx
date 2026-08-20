import { FacilitySearch } from "@/components/search/FacilitySearch";
import { useTitle } from "@/lib/useTitle";

export default function LandingPage() {
  useTitle("Share your experience");

  return (
    <div className="zoe-container py-10 sm:py-14">
      <h1 className="text-display">How was the care, really?</h1>

      <p className="mt-3 text-body text-ink-muted">
        You&apos;ve been to a hospital in Lagos. Right now someone is choosing
        that same hospital — for their mother, their child, themselves. Tell them
        what to expect.
      </p>

      {/*
        THE ANONYMITY PROMISE, GIVEN ITS OWN BLOCK.

        It sits between the invitation and the search box because that is the
        moment the question occurs to somebody — "will my name be on this?" — and
        an answer buried in a paragraph reads as small print. A tinted panel makes
        it a statement rather than a caveat.

        The wording is a promise the rest of the build already keeps: the phone
        number is never persisted, never rendered unmasked, and never sent to a
        facility. If any of that changes, this block is the first thing to fix.
      */}
      <div className="mt-6 rounded border border-teal-wash bg-teal-wash px-4 py-4">
        <p className="text-body font-medium text-ink">Anonymous, always.</p>
        <p className="mt-1 text-small text-ink-muted">
          Your name and number are never shown — not publicly, and not to the
          hospital.
        </p>
      </div>

      <div className="mt-8">
        <FacilitySearch />
      </div>
    </div>
  );
}
