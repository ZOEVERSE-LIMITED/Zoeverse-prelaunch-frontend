import { Component, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import LandingPage from "@/pages/LandingPage";
import { ConsentPage, IdentityPage, ReviewPage } from "@/pages/FacilityRoutes";
import SuggestFacilityPage from "@/pages/SuggestFacilityPage";
import ThankYouPage from "@/pages/ThankYouPage";
import LegalPage from "@/pages/LegalPage";
import NotFoundPage from "@/pages/NotFoundPage";


class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;

    return (
      <div className="zoe-container py-12">
        <h1 className="text-display">Something went wrong on this screen</h1>
        <p className="mt-3 text-body text-ink-muted">
          Your answers are saved. Reload the page and you can carry on from where
          you were.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex min-h-tap items-center justify-center rounded bg-teal px-5 py-3 text-body font-medium text-surface"
        >
          Reload
        </button>
      </div>
    );
  }
}


function useRouteReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return pathname;
}

export default function App() {
  const pathname = useRouteReset();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-surface focus:px-4 focus:py-3 focus:text-teal-ink focus:shadow-raised"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main" className="flex-1">
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Screen 0. The search results link straight here. */}
            <Route path="/review/:facilityId/start" element={<IdentityPage />} />
            <Route path="/review/:facilityId" element={<ReviewPage />} />
            {/* Consent. The path keeps its old name so links sent mid-review
                still resolve — see FacilityRoutes. */}
            <Route path="/review/:facilityId/verify" element={<ConsentPage />} />
            {/* `/review` with no facility is somebody who trimmed the URL. */}
            <Route path="/review" element={<Navigate to="/" replace />} />

            <Route path="/facility/suggest" element={<SuggestFacilityPage />} />
            <Route path="/thank-you" element={<ThankYouPage />} />
            <Route path="/privacy" element={<LegalPage slug="privacy" />} />
            <Route path="/terms" element={<LegalPage slug="terms" />} />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ErrorBoundary>
      </main>

      <SiteFooter />
    </div>
  );
}
