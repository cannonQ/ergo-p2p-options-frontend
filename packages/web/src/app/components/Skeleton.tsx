/** Animated skeleton placeholder for loading states */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-etcha-border rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/** Skeleton row for table loading states */
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#1e2330]/50">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-20" />
        </td>
      ))}
    </tr>
  );
}
