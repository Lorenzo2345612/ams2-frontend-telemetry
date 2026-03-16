import { useMemo } from 'react';
import type { Corner, TelemetryTimeSeries, DeltaTimeSeries } from '@/lib/api';

interface CornerAnalysisTableProps {
  corners: Corner[];
  speed: TelemetryTimeSeries;
  deltaTime: DeltaTimeSeries;
  lap1Name: string;
  lap2Name: string;
  onCornerClick?: (startDistance: number, endDistance: number) => void;
}

interface CornerRow {
  cornerNumber: number;
  startDistance: number;
  endDistance: number;
  apexDistance: number;
  entrySpeedLap1: number;
  entrySpeedLap2: number;
  minSpeedLap1: number;
  minSpeedLap2: number;
  exitSpeedLap1: number;
  exitSpeedLap2: number;
  timeDelta: number;
}

/**
 * Binary search for the nearest index in a sorted distance array.
 */
function findNearestIndex(distances: number[], target: number): number {
  if (distances.length === 0) return -1;
  let lo = 0;
  let hi = distances.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (distances[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // Check if lo-1 is closer
  if (lo > 0 && Math.abs(distances[lo - 1] - target) < Math.abs(distances[lo] - target)) {
    return lo - 1;
  }
  return lo;
}

/**
 * Find the minimum speed within a distance range for a given speed array.
 */
function findMinSpeedInRange(
  distances: number[],
  speeds: number[],
  startDist: number,
  endDist: number
): number {
  const startIdx = findNearestIndex(distances, startDist);
  const endIdx = findNearestIndex(distances, endDist);
  if (startIdx < 0 || endIdx < 0) return 0;

  let minSpeed = Infinity;
  const lo = Math.min(startIdx, endIdx);
  const hi = Math.max(startIdx, endIdx);
  for (let i = lo; i <= hi; i++) {
    if (speeds[i] < minSpeed) {
      minSpeed = speeds[i];
    }
  }
  return minSpeed === Infinity ? 0 : minSpeed;
}

/**
 * Compute cumulative delta at a given distance by interpolating the delta curve.
 */
function getDeltaAtDistance(deltaTime: DeltaTimeSeries, distance: number): number {
  const idx = findNearestIndex(deltaTime.distance, distance);
  if (idx < 0) return 0;
  return deltaTime.delta[idx];
}

export function CornerAnalysisTable({
  corners,
  speed,
  deltaTime,
  lap1Name,
  lap2Name,
  onCornerClick,
}: CornerAnalysisTableProps) {
  const rows = useMemo<CornerRow[]>(() => {
    return corners.map((corner) => {
      const startIdx = findNearestIndex(speed.distance, corner.start_distance);
      const endIdx = findNearestIndex(speed.distance, corner.end_distance);

      const entrySpeedLap1 = startIdx >= 0 ? speed.lap_1[startIdx] : 0;
      const entrySpeedLap2 = startIdx >= 0 ? speed.lap_2[startIdx] : 0;
      const exitSpeedLap1 = endIdx >= 0 ? speed.lap_1[endIdx] : 0;
      const exitSpeedLap2 = endIdx >= 0 ? speed.lap_2[endIdx] : 0;

      const minSpeedLap1 = findMinSpeedInRange(
        speed.distance,
        speed.lap_1,
        corner.start_distance,
        corner.end_distance
      );
      const minSpeedLap2 = findMinSpeedInRange(
        speed.distance,
        speed.lap_2,
        corner.start_distance,
        corner.end_distance
      );

      // Time delta across the corner: delta at exit minus delta at entry
      const deltaAtEntry = getDeltaAtDistance(deltaTime, corner.start_distance);
      const deltaAtExit = getDeltaAtDistance(deltaTime, corner.end_distance);
      const timeDelta = deltaAtExit - deltaAtEntry;

      return {
        cornerNumber: corner.corner_number,
        startDistance: corner.start_distance,
        endDistance: corner.end_distance,
        apexDistance: corner.apex_distance,
        entrySpeedLap1,
        entrySpeedLap2,
        minSpeedLap1,
        minSpeedLap2,
        exitSpeedLap1,
        exitSpeedLap2,
        timeDelta,
      };
    });
  }, [corners, speed, deltaTime]);

  if (corners.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 rounded-lg border border-border bg-card">
        <p className="text-muted-foreground text-sm">No corner data available</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">
                Corner
              </th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground" colSpan={2}>
                Entry Speed (km/h)
              </th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground" colSpan={2}>
                Min Speed (km/h)
              </th>
              <th className="px-3 py-2.5 text-center font-medium text-muted-foreground" colSpan={2}>
                Exit Speed (km/h)
              </th>
              <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">
                Delta
              </th>
            </tr>
            <tr className="border-b border-border bg-muted/30 text-xs">
              <th className="px-3 py-1 text-left font-normal text-muted-foreground/70">#</th>
              <th className="px-3 py-1 text-center font-normal" style={{ color: '#8b5cf6' }}>
                {lap1Name}
              </th>
              <th className="px-3 py-1 text-center font-normal" style={{ color: '#f59e0b' }}>
                {lap2Name}
              </th>
              <th className="px-3 py-1 text-center font-normal" style={{ color: '#8b5cf6' }}>
                {lap1Name}
              </th>
              <th className="px-3 py-1 text-center font-normal" style={{ color: '#f59e0b' }}>
                {lap2Name}
              </th>
              <th className="px-3 py-1 text-center font-normal" style={{ color: '#8b5cf6' }}>
                {lap1Name}
              </th>
              <th className="px-3 py-1 text-center font-normal" style={{ color: '#f59e0b' }}>
                {lap2Name}
              </th>
              <th className="px-3 py-1 text-right font-normal text-muted-foreground/70">
                (s)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const deltaColor =
                row.timeDelta > 0.001
                  ? '#ef4444'
                  : row.timeDelta < -0.001
                    ? '#22c55e'
                    : '#9ca3af';
              const deltaSign = row.timeDelta >= 0 ? '+' : '';

              return (
                <tr
                  key={row.cornerNumber}
                  className="border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer"
                  onClick={() =>
                    onCornerClick?.(row.startDistance, row.endDistance)
                  }
                  title={`Click to zoom to Turn ${row.cornerNumber} (${Math.round(row.startDistance)}m - ${Math.round(row.endDistance)}m)`}
                >
                  <td className="px-3 py-2 text-left">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">
                      {row.cornerNumber}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums" style={{ color: '#8b5cf6' }}>
                    {row.entrySpeedLap1.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums" style={{ color: '#f59e0b' }}>
                    {row.entrySpeedLap2.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums" style={{ color: '#8b5cf6' }}>
                    {row.minSpeedLap1.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums" style={{ color: '#f59e0b' }}>
                    {row.minSpeedLap2.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums" style={{ color: '#8b5cf6' }}>
                    {row.exitSpeedLap1.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums" style={{ color: '#f59e0b' }}>
                    {row.exitSpeedLap2.toFixed(1)}
                  </td>
                  <td
                    className="px-3 py-2 text-right tabular-nums font-semibold"
                    style={{ color: deltaColor }}
                  >
                    {deltaSign}{row.timeDelta.toFixed(3)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          {/* Summary footer row */}
          <tfoot>
            <tr className="border-t border-border bg-muted/30">
              <td className="px-3 py-2.5 text-left font-semibold text-muted-foreground" colSpan={7}>
                Total Corner Delta
              </td>
              <td className="px-3 py-2.5 text-right tabular-nums font-bold" style={{
                color: rows.reduce((sum, r) => sum + r.timeDelta, 0) > 0.001
                  ? '#ef4444'
                  : rows.reduce((sum, r) => sum + r.timeDelta, 0) < -0.001
                    ? '#22c55e'
                    : '#9ca3af',
              }}>
                {(() => {
                  const total = rows.reduce((sum, r) => sum + r.timeDelta, 0);
                  const sign = total >= 0 ? '+' : '';
                  return `${sign}${total.toFixed(3)}`;
                })()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
