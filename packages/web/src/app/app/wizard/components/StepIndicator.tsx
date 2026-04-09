"use client";

interface StepIndicatorProps {
  current: number;
  total?: number;
}

export function StepIndicator({ current, total = 4 }: StepIndicatorProps) {
  return (
    <div className="flex gap-1.5 items-center mb-6">
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const active = current === n;
        const done = current > n;
        return (
          <div
            key={n}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all duration-300 border-2 ${
              done || active
                ? "bg-etcha-copper border-etcha-copper text-[#0a0c10]"
                : "bg-transparent border-etcha-border text-etcha-text-dim"
            }`}
          >
            {done ? "\u2713" : n}
          </div>
        );
      })}
      <div className="flex-1 h-px bg-etcha-border" />
      <span className="text-[11px] text-etcha-text-dim font-mono">
        step {Math.min(current, total)}/{total}
      </span>
    </div>
  );
}
