import { ReactNode } from "react";

export default function Callout({
  variant,
  label,
  children,
}: {
  variant: "amber" | "green" | "neutral";
  label?: string;
  children: ReactNode;
}) {
  return (
    <div className={`callout callout-${variant}`}>
      {label && <span className="label">{label}</span>}
      {children}
    </div>
  );
}
