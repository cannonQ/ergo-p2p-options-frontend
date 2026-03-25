"use client";

import { useState, ReactNode } from "react";

export default function Graphic({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div
        className="graphic graphic-clickable"
        onClick={() => setExpanded(true)}
        title="Click to enlarge"
      >
        {children}
      </div>

      {expanded && (
        <div className="graphic-overlay" onClick={() => setExpanded(false)}>
          <div
            className="graphic-overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="graphic-close"
              onClick={() => setExpanded(false)}
              aria-label="Close"
            >
              &times;
            </button>
            {children}
          </div>
        </div>
      )}
    </>
  );
}
