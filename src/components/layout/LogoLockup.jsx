import { Logo, LogoType } from "../../../assets";


export function LogoLockup({ className = "" }) {
  return (
    <span className={`inline-flex items-baseline gap-2 ${className}`}>
      <img className="w-[100px]" src={LogoType} />
    </span>
  );
}
