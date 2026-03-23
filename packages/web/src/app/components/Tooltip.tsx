"use client";

import { useState } from "react";

interface TooltipProps {
  text: string;
}

export function Tooltip({ text }: TooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1e293b] text-[#94a3b8] text-[10px] font-bold hover:bg-[#334155] hover:text-[#e2e8f0] transition-colors cursor-help"
      >
        i
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2.5 bg-[#1e293b] border border-[#334155] rounded-lg text-xs text-[#e2e8f0] shadow-xl leading-relaxed">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1e293b] border-r border-b border-[#334155] rotate-45 -mt-1" />
        </div>
      )}
    </span>
  );
}
