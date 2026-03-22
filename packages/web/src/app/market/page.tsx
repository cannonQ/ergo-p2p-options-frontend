"use client";

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Market Overview</h1>
        <p className="text-[#94a3b8]">All active options across all assets</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select className="bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0]">
          <option>All Assets</option>
          <option>ETH</option>
          <option>BTC</option>
          <option>ADA</option>
          <option>ERG</option>
          <option>Gold</option>
        </select>
        <select className="bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0]">
          <option>All Types</option>
          <option>Calls</option>
          <option>Puts</option>
        </select>
        <select className="bg-[#131a2a] border border-[#1e293b] rounded-lg px-3 py-1.5 text-sm text-[#e2e8f0]">
          <option>All Expiries</option>
        </select>
      </div>

      {/* Market Table */}
      <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1e293b]">
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Asset</th>
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
              <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Strike</th>
              <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Expiry</th>
              <th className="text-right py-3 px-4 text-[#eab308] font-medium">Premium</th>
              <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Avail</th>
              <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Settlement</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={7} className="text-center py-12 text-[#94a3b8]">
                No options currently listed. Be the first to write one.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
