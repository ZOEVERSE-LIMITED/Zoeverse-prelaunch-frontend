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

      <div className="mt-6 rounded border border-teal-wash bg-teal-wash px-4 py-4">
        <p className="text-body font-medium text-ink">You control how your name appears.</p>
        <p className="mt-1 text-small text-ink-muted">
          Choose your full name, first name with last initial, or Anonymous before you submit.
        </p>
      </div>

      <div className="mt-8">
        <FacilitySearch />
      </div>
    </div>
  );
}
