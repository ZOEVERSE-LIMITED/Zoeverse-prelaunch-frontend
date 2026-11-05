import logo from "@/assets/brand-mark.png";
import wordmark from "@/assets/typography.png";

export function LogoLockup({ className = "" }) {
  return <span className={`review-logo ${className}`}>
    <img src={logo} alt="" className="review-brand-mark" />
    <img src={wordmark} alt="Zoeverse" style={{ filter: "brightness(0) invert(1)" }} className="review-brand-name" />
  </span>;
}
