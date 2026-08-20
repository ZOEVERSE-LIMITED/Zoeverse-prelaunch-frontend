import { Link } from "react-router-dom";
import { ShareWithFriends } from "@/components/thankyou/ShareWithFriends";
import { useTitle } from "@/lib/useTitle";

/**
 * WHAT THIS PAGE DOES NOT DO. It shows no score, no rating, no average, and
 * nobody else's review — the same rule as every other screen. It also does not
 * show the review back: the person wrote it, and the only thing they need now is
 * confirmation it arrived.
 */
export default function ThankYouPage() {
  useTitle("Thank you");

  return (
    <div className="zoe-container py-12">
      <h1 className="text-display">Thank you</h1>

      <p className="mt-4 text-body text-ink-muted">
        Your experience has been sent. Somebody at ZOEVERSE checks every review
        before it goes on the site, so it will not appear straight away.
      </p>

      <p className="mt-3 text-body text-ink-muted">
        Your name and your number stay private. Neither is ever shown on the site,
        and neither is given to the facility.
      </p>

      <ShareWithFriends />

      <div className="mt-6 rounded border border-line bg-surface px-4 py-5">
        <h2 className="font-display text-heading font-bold text-ink">
          Been somewhere else?
        </h2>
        <p className="mt-1 text-small text-ink-muted">
          You can review a different facility now.
        </p>
        <Link
          to="/"
          className="mt-4 inline-flex min-h-tap w-full items-center justify-center rounded border border-line bg-surface px-5 py-3 text-body font-medium text-teal-ink sm:w-auto"
        >
          Review another facility
        </Link>
      </div>
    </div>
  );
}
