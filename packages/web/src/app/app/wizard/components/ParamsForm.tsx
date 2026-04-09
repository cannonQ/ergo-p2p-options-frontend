"use client";

import { PayoffChart } from "./PayoffChart";

interface StrikeOption {
  id: string;
  label: string;
  multiplier: number;
  note: string;
}

const EXPIRIES = [
  { id: "1w", label: "1 Week", days: 7, note: "Fast trade" },
  { id: "2w", label: "2 Weeks", days: 14, note: "Short-term" },
  { id: "1m", label: "1 Month", days: 30, note: "Most popular" },
  { id: "3m", label: "3 Months", days: 90, note: "Longer runway" },
];

const BUY_STRIKES: Record<string, StrikeOption[]> = {
  bull: [
    { id: "atm",   label: "At current price",  multiplier: 1.0,  note: "Balanced risk/reward" },
    { id: "otm5",  label: "5% beyond current",  multiplier: 1.05, note: "Slight edge needed" },
    { id: "otm10", label: "10% beyond current", multiplier: 1.1,  note: "Cheaper, needs bigger move" },
    { id: "otm20", label: "20% beyond current", multiplier: 1.2,  note: "Long shot" },
    { id: "otm50", label: "50% beyond current", multiplier: 1.5,  note: "Degen mode" },
  ],
  bear: [
    { id: "atm",   label: "At current price",  multiplier: 1.0,  note: "Balanced risk/reward" },
    { id: "otm5",  label: "5% below current",   multiplier: 0.95, note: "Slight edge needed" },
    { id: "otm10", label: "10% below current",  multiplier: 0.9,  note: "Cheaper, needs bigger drop" },
    { id: "otm20", label: "20% below current",  multiplier: 0.8,  note: "Long shot" },
    { id: "otm50", label: "50% below current",  multiplier: 0.5,  note: "Degen mode" },
  ],
};

const WRITE_STRIKES: Record<string, StrikeOption[]> = {
  bull: [
    { id: "atm",   label: "At current price",  multiplier: 1.0,  note: "Max premium, higher risk" },
    { id: "otm5",  label: "5% above current",   multiplier: 1.05, note: "Slight buffer" },
    { id: "otm10", label: "10% above current",  multiplier: 1.1,  note: "Good balance of premium vs risk" },
    { id: "otm20", label: "20% above current",  multiplier: 1.2,  note: "Lower chance of delivery, less premium" },
  ],
  bear: [
    { id: "atm",   label: "At current price",  multiplier: 1.0,  note: "Max premium, higher risk" },
    { id: "otm5",  label: "5% below current",   multiplier: 0.95, note: "Slight buffer" },
    { id: "otm10", label: "10% below current",  multiplier: 0.9,  note: "Good balance of premium vs risk" },
    { id: "otm20", label: "20% below current",  multiplier: 0.8,  note: "Lower chance of delivery, less premium" },
  ],
};

function fmt(p: number): string {
  if (p >= 1000) return "$" + p.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (p >= 1) return "$" + p.toFixed(2);
  return "$" + p.toFixed(4);
}

interface ParamsFormProps {
  mode: "buy" | "write";
  direction: "bull" | "bear";
  assetLabel: string;
  spotPrice: number;
  premium: number | null;
  selectedExpiry: typeof EXPIRIES[number] | null;
  selectedStrike: StrikeOption | null;
  onExpirySelect: (expiry: typeof EXPIRIES[number]) => void;
  onStrikeSelect: (strike: StrikeOption) => void;
  onContinue: () => void;
}

export type { StrikeOption };
export { EXPIRIES, BUY_STRIKES, WRITE_STRIKES };

export function ParamsForm({
  mode,
  direction,
  assetLabel,
  spotPrice,
  premium,
  selectedExpiry,
  selectedStrike,
  onExpirySelect,
  onStrikeSelect,
  onContinue,
}: ParamsFormProps) {
  const isBuy = mode === "buy";
  const isBull = direction === "bull";
  const strikeOptions = isBuy ? BUY_STRIKES[direction] : WRITE_STRIKES[direction];
  const strike = selectedStrike ? spotPrice * selectedStrike.multiplier : null;

  const chartType = isBuy
    ? isBull ? "buy_call" as const : "buy_put" as const
    : isBull ? "write_call" as const : "write_put" as const;

  return (
    <div>
      <div className="text-[11px] text-etcha-copper font-mono mb-1">STEP 3 OF 4</div>
      <h2 className="text-[22px] font-extrabold mb-1">
        {isBuy ? "When and how far?" : "Pick your strike and expiry"}
      </h2>
      <p className="text-etcha-text-dim text-sm mb-5">
        {isBuy
          ? "How long until the move, and how big?"
          : "Further OTM = lower premium but safer. Closer = more premium but more delivery risk."}
      </p>

      {/* Expiry */}
      <div className="mb-5">
        <div className="text-[11px] text-etcha-text-secondary font-mono mb-2.5">EXPIRY</div>
        <div className="grid grid-cols-2 gap-2">
          {EXPIRIES.map((e) => (
            <button
              key={e.id}
              onClick={() => onExpirySelect(e)}
              className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                selectedExpiry?.id === e.id
                  ? "border-etcha-copper bg-[#1a1810]"
                  : "border-etcha-border bg-etcha-surface hover:border-etcha-copper"
              }`}
            >
              <div className="font-bold text-sm">{e.label}</div>
              <div className="text-[11px] text-etcha-text-dim font-mono mt-0.5">{e.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Strike */}
      <div className="mb-5">
        <div className="text-[11px] text-etcha-text-secondary font-mono mb-2.5">
          {isBuy ? "HOW BIG IS THE MOVE?" : "STRIKE PRICE"}
        </div>
        <div className="flex flex-col gap-2">
          {strikeOptions.map((s) => (
            <button
              key={s.id}
              onClick={() => onStrikeSelect(s)}
              className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer ${
                selectedStrike?.id === s.id
                  ? "border-etcha-copper bg-[#1a1810]"
                  : "border-etcha-border bg-etcha-surface hover:border-etcha-copper"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-[13px]">{s.label}</span>
                <span className="text-[11px] text-etcha-text-dim font-mono">
                  {fmt(spotPrice * s.multiplier)}
                </span>
              </div>
              <div className="text-[11px] text-etcha-text-dim mt-1">{s.note}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Payoff preview */}
      {selectedStrike && selectedExpiry && premium && strike && (
        <div className="mb-5">
          <div className="text-[11px] text-etcha-copper font-mono mb-2">PAYOFF PREVIEW</div>
          <PayoffChart
            type={chartType}
            spot={spotPrice}
            strike={strike}
            premium={premium}
            assetLabel={assetLabel}
          />
        </div>
      )}

      <button
        disabled={!selectedExpiry || !selectedStrike}
        onClick={onContinue}
        className="w-full rounded-lg bg-etcha-copper text-[#0a0c10] font-bold text-[15px] py-3.5 transition-all disabled:bg-etcha-border disabled:text-etcha-text-dim disabled:cursor-not-allowed hover:enabled:opacity-90 cursor-pointer"
      >
        {isBuy ? "Check the market \u2192" : "Review & write \u2192"}
      </button>
    </div>
  );
}
