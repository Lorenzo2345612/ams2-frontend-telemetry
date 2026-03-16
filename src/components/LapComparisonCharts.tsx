import { useCallback, useMemo } from 'react';
import { LapComparisonResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { KpiCard } from './ui/kpi-card';
import { TelemetryCursorProvider, useTelemetryCursor } from '@/hooks/useTelemetryCursor';
import { TrackMap } from './charts/TrackMap';
import { MiniTrackMap } from './charts/MiniTrackMap';
import { DeltaTimeChart } from './charts/DeltaTimeChart';
import { SpeedComparisonChart } from './charts/SpeedComparisonChart';
import { ThrottleBrakeChart } from './charts/ThrottleBrakeChart';
import { SteeringChart } from './charts/SteeringChart';
import { CornerAnalysisTable } from './charts/CornerAnalysisTable';
import { formatDelta, formatTime } from '@/lib/utils';
import type { Corner } from '@/lib/api';

interface Props {
  data: LapComparisonResponse;
  lap1Number: number;
  lap2Number: number;
}

/**
 * Inner component that has access to TelemetryCursorContext.
 * Must be rendered inside TelemetryCursorProvider.
 */
function LapComparisonChartsInner({ data, lap1Number, lap2Number }: Props) {
  const { setZoomRange } = useTelemetryCursor();

  const lap1Name = `Lap ${lap1Number}`;
  const lap2Name = `Lap ${lap2Number}`;
  const corners = data.delta_track_map.corners;

  // Max distance for computing zoom percentages
  const maxDistance = useMemo(
    () => Math.max(...data.delta_time.distance),
    [data.delta_time.distance],
  );

  // Handler for corner clicks: zoom all charts to the corner's distance range
  const handleCornerZoom = useCallback(
    (startDistance: number, endDistance: number) => {
      if (maxDistance <= 0) return;
      const margin = (endDistance - startDistance) * 0.3;
      const startPct = Math.max(0, ((startDistance - margin) / maxDistance) * 100);
      const endPct = Math.min(100, ((endDistance + margin) / maxDistance) * 100);
      setZoomRange({ start: startPct, end: endPct });
    },
    [maxDistance, setZoomRange],
  );

  // Handler for TrackMap corner click
  const handleTrackMapCornerClick = useCallback(
    (corner: Corner) => {
      handleCornerZoom(corner.start_distance, corner.end_distance);
    },
    [handleCornerZoom],
  );

  // Sparkline data: downsample delta curve for the KPI card
  const deltaSparkline = useMemo(() => {
    const delta = data.delta_time.delta;
    if (delta.length <= 30) return delta;
    const step = Math.floor(delta.length / 30);
    const result: number[] = [];
    for (let i = 0; i < delta.length; i += step) {
      result.push(delta[i]);
    }
    return result;
  }, [data.delta_time.delta]);

  // Max speed delta computation
  const maxSpeedDelta = useMemo(() => {
    return data.summary.max_speed_lap_1 - data.summary.max_speed_lap_2;
  }, [data.summary.max_speed_lap_1, data.summary.max_speed_lap_2]);

  // Track map data with speed overlay
  const trackMapData = useMemo(() => {
    return {
      pos_x: data.delta_track_map.pos_x,
      pos_z: data.delta_track_map.pos_z,
      color_value: data.delta_track_map.color_value,
      corners: data.delta_track_map.corners,
    };
  }, [data.delta_track_map]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Summary Section */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard
          label={`Lap ${lap1Number} Time`}
          value={formatTime(data.summary.lap_1_time)}
          colorClass="text-violet-400"
        />
        <KpiCard
          label={`Lap ${lap2Number} Time`}
          value={formatTime(data.summary.lap_2_time)}
          colorClass="text-amber-400"
        />
        <KpiCard
          label="Final Delta"
          value={formatDelta(data.summary.delta_final)}
          colorClass={data.summary.delta_final < 0 ? 'text-green-400' : 'text-red-400'}
          sparklineData={deltaSparkline}
        />
        <KpiCard
          label="Best Gain"
          value={formatDelta(data.summary.delta_min)}
          colorClass="text-green-400"
          trend="down"
          trendValue={`at ${Math.round(data.summary.delta_min_position)}m`}
        />
        <KpiCard
          label="Worst Loss"
          value={formatDelta(data.summary.delta_max)}
          colorClass="text-red-400"
          trend="up"
          trendValue={`at ${Math.round(data.summary.delta_max_position)}m`}
        />
        <KpiCard
          label="Max Speed Delta"
          value={`${Math.abs(maxSpeedDelta).toFixed(1)}`}
          unit="km/h"
          trend={maxSpeedDelta > 0.1 ? 'up' : maxSpeedDelta < -0.1 ? 'down' : 'neutral'}
          trendValue={
            maxSpeedDelta > 0.1
              ? `L${lap1Number} faster`
              : maxSpeedDelta < -0.1
                ? `L${lap2Number} faster`
                : 'Equal'
          }
        />
      </div>

      {/* Segment Analysis Cards */}
      <Card>
        <CardHeader>
          <CardTitle>Top Time Gain/Loss Segments</CardTitle>
          <CardDescription>
            Non-overlapping segments where Lap {lap2Number} gains or loses the most time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Loss Segments */}
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-3">Time Lost</h3>
              <div className="space-y-2">
                {data.segment_analysis.time_loss_segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20 cursor-pointer hover:bg-red-500/15 transition-colors"
                    onClick={() => handleCornerZoom(segment.start_distance, segment.end_distance)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {(segment.start_distance / 1000).toFixed(2)}km - {(segment.end_distance / 1000).toFixed(2)}km
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {segment.start_distance.toFixed(0)}m - {segment.end_distance.toFixed(0)}m ({(segment.end_distance - segment.start_distance).toFixed(0)}m)
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-red-400">
                      {formatDelta(segment.time_delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Gain Segments */}
            <div>
              <h3 className="text-lg font-semibold text-green-400 mb-3">Time Gained</h3>
              <div className="space-y-2">
                {data.segment_analysis.time_gain_segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20 cursor-pointer hover:bg-green-500/15 transition-colors"
                    onClick={() => handleCornerZoom(segment.start_distance, segment.end_distance)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {(segment.start_distance / 1000).toFixed(2)}km - {(segment.end_distance / 1000).toFixed(2)}km
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {segment.start_distance.toFixed(0)}m - {segment.end_distance.toFixed(0)}m ({(segment.end_distance - segment.start_distance).toFixed(0)}m)
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-400">
                      {formatDelta(segment.time_delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Two-column layout: Charts (left 70%) + Track Maps (right 30%) */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Right side: Track Maps - shown first on mobile */}
        <div className="w-full lg:w-[30%] order-first lg:order-last">
          <div className="lg:sticky lg:top-4 space-y-4">
            {/* Track Map */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Track Map</CardTitle>
                <CardDescription>
                  Click corner labels to zoom charts
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <TrackMap
                  data={trackMapData}
                  height={400}
                  initialMode="delta"
                  onCornerClick={handleTrackMapCornerClick}
                />
              </CardContent>
            </Card>

            {/* Mini Track Map */}
            <div className="hidden lg:flex justify-center">
              <div className="rounded-lg border bg-card shadow-sm p-3">
                <p className="text-xs text-muted-foreground mb-2 text-center">Position</p>
                <MiniTrackMap
                  pos_x={data.delta_track_map.pos_x}
                  pos_z={data.delta_track_map.pos_z}
                  size={150}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Left side: Linked chart stack */}
        <div className="w-full lg:w-[70%] space-y-4">
          {/* Delta Time Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Delta Time</CardTitle>
              <CardDescription>
                Positive = Lap {lap2Number} slower | Negative = Lap {lap2Number} faster
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <DeltaTimeChart
                deltaTime={data.delta_time}
                corners={corners}
                showDataZoom={true}
                showCornerBands={true}
                height={280}
              />
            </CardContent>
          </Card>

          {/* Speed Comparison Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Speed Comparison</CardTitle>
              <CardDescription>Speed (km/h) over distance</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <SpeedComparisonChart
                speed={data.speed}
                lap1Name={lap1Name}
                lap2Name={lap2Name}
                corners={corners}
                showCornerBands={true}
                height={280}
              />
            </CardContent>
          </Card>

          {/* Combined Throttle/Brake Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Throttle & Brake</CardTitle>
              <CardDescription>
                Pedal inputs comparison (solid = Lap {lap1Number}, dashed = Lap {lap2Number})
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <ThrottleBrakeChart
                throttle={data.throttle}
                brake={data.brake}
                lap1Name={lap1Name}
                lap2Name={lap2Name}
                corners={corners}
                showCornerBands={true}
                height={280}
              />
            </CardContent>
          </Card>

          {/* Steering Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Steering Input</CardTitle>
              <CardDescription>Steering angle comparison</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <SteeringChart
                steering={data.steering}
                lap1Name={lap1Name}
                lap2Name={lap2Name}
                corners={corners}
                showCornerBands={true}
                showDataZoom={true}
                height={250}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Corner Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Corner Analysis</CardTitle>
          <CardDescription>
            Corner-by-corner breakdown. Click a row to zoom all charts to that corner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CornerAnalysisTable
            corners={corners}
            speed={data.speed}
            deltaTime={data.delta_time}
            lap1Name={lap1Name}
            lap2Name={lap2Name}
            onCornerClick={handleCornerZoom}
          />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * LapComparisonCharts orchestrator.
 * Wraps all telemetry visualizations in a TelemetryCursorProvider
 * so that all charts share linked crosshairs and zoom state.
 */
export function LapComparisonCharts({ data, lap1Number, lap2Number }: Props) {
  return (
    <TelemetryCursorProvider>
      <LapComparisonChartsInner
        data={data}
        lap1Number={lap1Number}
        lap2Number={lap2Number}
      />
    </TelemetryCursorProvider>
  );
}
