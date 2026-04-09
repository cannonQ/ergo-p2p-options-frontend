"use client";

interface ModeSelectorProps {
  onSelect: (mode: "buy" | "write") => void;
}

function Tag({ children, color = "#c87941" }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="rounded px-2 py-0.5 text-[11px] font-mono font-semibold"
      style={{
        background: color + "22",
        color,
        border: `1px solid ${color}44`,
      }}
    >
      {children}
    </span>
  );
}

export function ModeSelector({ onSelect }: ModeSelectorProps) {
  return (
    <div>
      <div className="text-center pt-6 mb-8">
        <div className="text-[38px] font-extrabold leading-tight tracking-tight mb-3">
          What do you<br />
          <span className="text-etcha-copper">want to do?</span>
        </div>
        <p className="text-etcha-text-dim text-[15px] leading-relaxed">
          Options let you either take a bet on price direction<br />
          or earn yield by writing contracts for others.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {/* Buy */}
        <button
          onClick={() => onSelect("buy")}
          className="w-full text-left rounded-xl bg-etcha-surface border border-[#6366f133] p-5 hover:border-etcha-copper transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <span className="text-[32px] leading-none mt-0.5">&#x1F3AF;</span>
            <div>
              <div className="font-bold text-[17px] mb-1">Buy an option</div>
              <div className="text-[13px] text-etcha-text-dim leading-relaxed mb-2.5">
                You have a view — ADA is going up, BTC is going down. Buy a call
                or put and profit if you&apos;re right. Your max loss is the premium
                you pay. Nothing more.
              </div>
              <div className="flex gap-2 flex-wrap">
                <Tag color="#34d399">bullish call</Tag>
                <Tag color="#f87171">bearish put</Tag>
                <Tag color="#8891a5">limited risk</Tag>
              </div>
            </div>
          </div>
        </button>

        {/* Write */}
        <button
          onClick={() => onSelect("write")}
          className="w-full text-left rounded-xl bg-etcha-surface border border-[#c8794133] p-5 hover:border-etcha-copper transition-colors cursor-pointer"
        >
          <div className="flex items-start gap-3.5">
            <span className="text-[32px] leading-none mt-0.5">&#x1F4B0;</span>
            <div>
              <div className="font-bold text-[17px] mb-1">Write &amp; collect premium</div>
              <div className="text-[13px] text-etcha-text-dim leading-relaxed mb-2.5">
                Think the market is going sideways or moving slowly? Lock
                collateral, mint the contract, and collect premium upfront.
                You&apos;re the house — someone pays you to take the other side.
              </div>
              <div className="flex gap-2 flex-wrap">
                <Tag color="#c87941">earn premium</Tag>
                <Tag color="#c87941">write calls</Tag>
                <Tag color="#c87941">write puts</Tag>
              </div>
            </div>
          </div>
        </button>
      </div>

      <p className="text-etcha-border text-xs text-center mt-5 font-mono">
        no wallet needed to explore
      </p>
    </div>
  );
}
