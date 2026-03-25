import { ReactNode } from "react";

export default function Takeaway({ children }: { children: ReactNode }) {
  return (
    <div className="takeaway">
      <div className="tk-label">Key Takeaway</div>
      {children}
    </div>
  );
}
