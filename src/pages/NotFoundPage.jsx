import { Link } from "react-router-dom";
import { useTitle } from "@/lib/useTitle";

export default function NotFoundPage() {
  useTitle("Page not found");

  return (
    <div className="zoe-container py-12">
      <h1 className="text-display">We could not find that page</h1>
      <p className="mt-3 text-body text-ink-muted">
        The link may be old or mistyped. Search for your hospital and carry on
        from there.
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
