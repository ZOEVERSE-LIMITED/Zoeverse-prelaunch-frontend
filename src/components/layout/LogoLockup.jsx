import logo from "@/assets/zoeverse-logo.svg?inline";
export function LogoLockup({ className = "" }) {
  return <span className={`review-logo ${className}`}><img src={logo} alt="" /><span>Zoeverse</span></span>;
}
