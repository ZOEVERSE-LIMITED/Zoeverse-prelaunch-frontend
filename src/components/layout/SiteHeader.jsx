import { Link } from "react-router-dom";
import { patientReturnUrl } from "@/lib/patientJourney";
import { LogoLockup } from "./LogoLockup";


export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wide-container header-inner">
        <Link
          to="/"
          className="-mx-2 inline-flex min-h-tap items-center rounded px-2"
          aria-label="ZOEVERSE — home"
        >
          <LogoLockup />
          <span className="brand-descriptor">Patient experiences</span>
        </Link>
        <nav aria-label="Main navigation"><a className="header-find" href={patientReturnUrl(null)}>Find care ↗</a><a className="header-how" href="/#how-it-works">How it works</a><a className="header-action" href="/#find-facility">Write a review <span aria-hidden="true">↗</span></a></nav>
      </div>
    </header>
  );
}
