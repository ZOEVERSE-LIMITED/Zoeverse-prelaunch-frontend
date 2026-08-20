import { Link } from "react-router-dom";


export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-cream">
      <div className="zoe-container py-8">
       
        <p className="max-w-measure text-small text-ink-muted">
          ZOEVERSE opens later this year. We&apos;re collecting experiences now so
          it launches with real ones — not an empty page.
        </p>

        <nav className="mt-4 flex flex-wrap items-center gap-x-6" aria-label="Legal">
          <Link
            to="/privacy"
            className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
          >
            Privacy
          </Link>
          <Link
            to="/terms"
            className="inline-flex min-h-tap items-center text-small text-teal-ink underline underline-offset-4"
          >
            Terms
          </Link>
        </nav>

        <p className="mt-2 text-caption text-ink-soft">
          <span className="num">&copy; 2026</span> ZOEVERSE Limited
        </p>
      </div>
    </footer>
  );
}
