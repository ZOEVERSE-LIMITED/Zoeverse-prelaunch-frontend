import { Link } from "react-router-dom";
import { SuggestFacilityForm } from "@/components/search/SuggestFacilityForm";
import { useTitle } from "@/lib/useTitle";

export default function SuggestFacilityPage() {
  useTitle("Add a facility");

  return (
    <div className="zoe-container py-10">
      <Link
        to="/"
        className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
      >
        &larr; Back to search
      </Link>

      <h1 className="mt-2 text-display">Add a facility</h1>
      <p className="mt-3 text-body text-ink-muted">
        Our list comes from the health registry and it is missing places. Tell us
        where you were treated and you can review it straight away.
      </p>

      <div className="mt-8">
        <SuggestFacilityForm />
      </div>
    </div>
  );
}
