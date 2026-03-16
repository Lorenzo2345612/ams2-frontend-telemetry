import { Skeleton } from './skeleton';

interface ChartSkeletonProps {
  height?: number;
}

/**
 * Skeleton for chart cards: a card wrapper with a pulsing gray rectangle
 * at the specified chart height.
 */
export function ChartSkeleton({ height = 300 }: ChartSkeletonProps) {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
      {/* Title line */}
      <Skeleton className="h-5 w-48" />
      {/* Subtitle line */}
      <Skeleton className="h-3 w-72" />
      {/* Chart area */}
      <Skeleton className="w-full rounded-md" style={{ height: `${height}px` }} />
    </div>
  );
}

/**
 * Skeleton for KPI cards: pulsing lines for label + value.
 */
export function KpiSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-4 space-y-2">
      {/* Label */}
      <Skeleton className="h-3 w-20" />
      {/* Value */}
      <Skeleton className="h-7 w-28" />
      {/* Trend / subtitle */}
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

/**
 * Skeleton for track map: a card with a pulsing oval shape.
 */
export function TrackMapSkeleton() {
  return (
    <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
      {/* Title line */}
      <Skeleton className="h-5 w-40" />
      {/* Oval track shape */}
      <div className="flex items-center justify-center" style={{ height: '400px' }}>
        <Skeleton
          className="rounded-full"
          style={{
            width: '280px',
            height: '200px',
            borderRadius: '50%',
          }}
        />
      </div>
    </div>
  );
}

/**
 * Full page skeleton matching the fuel analysis layout.
 * Shows KPI grid + chart skeletons for a realistic loading state.
 */
export function FuelAnalysisSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI summary row */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      </div>
      {/* Chart skeletons */}
      <ChartSkeleton height={300} />
      <ChartSkeleton height={400} />
    </div>
  );
}

/**
 * Full page skeleton matching the fuel comparison layout.
 */
export function FuelComparisonSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI summary row */}
      <div className="rounded-lg border bg-card shadow-sm p-6 space-y-4">
        <Skeleton className="h-5 w-52" />
        <Skeleton className="h-3 w-40" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <KpiSkeleton key={i} />
          ))}
        </div>
      </div>
      {/* Charts */}
      <ChartSkeleton height={300} />
      <ChartSkeleton height={300} />
    </div>
  );
}
