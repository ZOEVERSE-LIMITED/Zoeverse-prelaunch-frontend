import logo from "@/assets/brand-mark.png";
import wordmark from "@/assets/brand-wordmark-light.svg";

export function LogoLockup({ className = "" }) {
  return <span className={`review-logo ${className}`}>
    <img src={logo} alt="" className="review-brand-mark" />
    <img src={wordmark} alt="Zoeverse" className="review-brand-name" />
  </span>;
}
