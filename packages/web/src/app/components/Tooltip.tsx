"use client";

import { useState } from "react";

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center justify-center ml-1 min-w-[44px] min-h-[44px]">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1e2330] text-[#9da5b8] text-[10px] font-bold hover:bg-[#334155] hover:text-[#e8eaf0] transition-colors cursor-help p-2"
        aria-label="More information"
        aria-expanded={show}
      >
        i
      </button>
      {show && (
        <div role="tooltip" className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-[#1e2330] border border-[#334155] rounded-lg text-xs text-[#e8eaf0] shadow-xl leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e2330] border-r border-b border-[#334155] rotate-45 -mt-1" />
        </div>
      )}
    </span>
  );
}
