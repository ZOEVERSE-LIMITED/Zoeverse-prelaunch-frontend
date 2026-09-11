import { Link } from "react-router-dom";


export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wide-container py-8">
        <p className="footer-wordmark">zoeverse<span>Real experiences. Better choices.</span></p>
       
        <p className="max-w-measure text-small text-ink-muted">
          We’re collecting patient experiences ahead of the Zoeverse launch.
          Thank you for helping us start with voices that matter.
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
