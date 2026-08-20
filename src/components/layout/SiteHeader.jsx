import { Link } from "react-router-dom";
import { LogoLockup } from "./LogoLockup";


export function SiteHeader() {
  return (
    <header className="border-b border-line bg-cream">
      <div className="zoe-container flex h-16 items-center">
        <Link
          to="/"
          className="-mx-2 inline-flex min-h-tap items-center rounded px-2"
          aria-label="ZOEVERSE — home"
        >
          <LogoLockup />
        </Link>
      </div>
    </header>
  );
}
