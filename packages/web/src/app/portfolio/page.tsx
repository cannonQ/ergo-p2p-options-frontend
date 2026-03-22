"use client";

export default function PortfolioPage() {
  // In production, this reads from wallet UTXOs + on-chain reserve data
  const connected = false; // Will come from wallet store

  if (!connected) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold mb-2">Portfolio</h1>
        <p className="text-[#94a3b8]">Connect your wallet to view positions</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Portfolio</h1>

      {/* Active Options (Holding) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Active Options (Holding)</h2>
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Asset</th>
                <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Strike</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Expiry</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Qty</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-8 text-[#94a3b8]">
                  No active positions
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Written Options (Issuer) */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Written Options (Issuer)</h2>
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1e293b]">
                <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Asset</th>
                <th className="text-left py-3 px-4 text-[#94a3b8] font-medium">Type</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Strike</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Expiry</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Minted</th>
                <th className="text-right py-3 px-4 text-[#94a3b8] font-medium">Sold</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-8 text-[#94a3b8]">
                  No written options
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Open Orders */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Open Orders</h2>
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-8 text-center text-[#94a3b8]">
          No open orders
        </div>
      </section>

      {/* Stuck / Reclaimable */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Stuck / Reclaimable</h2>
        <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-8 text-center text-[#94a3b8]">
          No stuck boxes
        </div>
      </section>
    </div>
  );
}
