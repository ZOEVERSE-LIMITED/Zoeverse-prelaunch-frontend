import { Link, useParams } from "react-router-dom";
import { IdentityFlow } from "@/components/verify/IdentityFlow";
import { ReviewFlow } from "@/components/review/ReviewFlow";
import { ConsentFlow } from "@/components/verify/ConsentFlow";
import { useReviewTarget } from "@/components/review/useReviewTarget";
import { useTitle } from "@/lib/useTitle";

function TargetMissing() {
  return (
    <div>
      <h1 className="text-title">We could not find that facility</h1>
      <p className="mt-3 text-body text-ink-muted">
        The link may be old, or the facility may have been added on a different
        phone. Search for it again and your review can carry on.
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-tap w-full items-center justify-center rounded bg-teal px-5 py-3 text-body font-medium text-surface sm:w-auto"
      >
        Back to search
      </Link>
    </div>
  );
}

/** Resolve the facility, then render whatever stage was asked for. */
function Stage({ render }) {
  const { facilityId } = useParams();
  const target = useReviewTarget(decodeURIComponent(facilityId ?? ""));

  if (target.status === "loading") {
    return <p className="text-body text-ink-soft">Loading…</p>;
  }
  if (target.status === "missing") return <TargetMissing />;
  return render(target.facility);
}

export function IdentityPage() {
  // NEVER the facility name — see useTitle.
  useTitle("Confirm it is you");
  return (
    <div className="zoe-container py-10">
      <Link
        to="/"
        className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
      >
        &larr; Pick a different facility
      </Link>
      <div className="mt-2">
        <Stage render={(facility) => <IdentityFlow facility={facility} />} />
      </div>
    </div>
  );
}

export function ReviewPage() {
  useTitle("Your experience");
  return (
    <div className="zoe-container py-10">
      <Link
        to="/"
        className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
      >
        &larr; Pick a different facility
      </Link>
      <div className="mt-2">
        <Stage render={(facility) => <ReviewFlow facility={facility} />} />
      </div>
    </div>
  );
}

export function ConsentPage() {
  useTitle("Before you send");
  const { facilityId } = useParams();

  return (
    <div className="zoe-container py-10">
      <Link
        to={`/review/${encodeURIComponent(facilityId ?? "")}`}
        className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
      >
        &larr; Back to your review
      </Link>
      <div className="mt-2">
        <Stage render={(facility) => <ConsentFlow facility={facility} />} />
      </div>
    </div>
  );
}
