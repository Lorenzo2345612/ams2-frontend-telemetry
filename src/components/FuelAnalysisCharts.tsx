import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { SingleLapFuelResponse, FuelComparisonResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { KpiCard } from './ui/kpi-card';
import { FuelRemainingChart } from './charts/FuelRemainingChart';
import { FuelScatterChart } from './charts/FuelScatterChart';
import { TelemetryChart, buildDistanceXAxis } from './charts/TelemetryChart';
import { TELEMETRY_COLORS, buildDataZoom } from '@/lib/echarts-setup';
import { TelemetryCursorProvider } from '@/hooks/useTelemetryCursor';
import { formatTime } from '@/lib/utils';

interface SingleLapProps {
  data: SingleLapFuelResponse;
  lapNumber: number;
}

export function SingleLapFuelCharts({ data, lapNumber }: SingleLapProps) {
  return (
    <TelemetryCursorProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KpiCard
            label="Lap Time"
            value={formatTime(data.summary.lap_time)}
          />
          <KpiCard
            label="Fuel Used"
            value={data.summary.fuel_used.toFixed(2)}
            unit="L"
            colorClass="text-orange-400"
          />
          <KpiCard
            label="Consumption Rate"
            value={data.summary.consumption_rate_per_km.toFixed(3)}
            unit="L/km"
          />
          <KpiCard
            label="Est. Laps Remaining"
            value={data.summary.estimated_laps_remaining.toFixed(1)}
            colorClass="text-blue-400"
          />
          <KpiCard
            label="Fuel Start"
            value={data.summary.fuel_start.toFixed(2)}
            unit="L"
          />
          <KpiCard
            label="Fuel End"
            value={data.summary.fuel_end.toFixed(2)}
            unit="L"
          />
          <KpiCard
            label="Tank Capacity"
            value={data.summary.fuel_capacity.toFixed(0)}
            unit="L"
          />
          <KpiCard
            label="Lap Distance"
            value={data.summary.lap_distance_km.toFixed(2)}
            unit="km"
          />
        </div>

        {/* Fuel Remaining Chart (liters/percentage toggle) */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Remaining</CardTitle>
            <CardDescription>
              Fuel level over lap distance - Lap {lapNumber}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelRemainingChart
              distance={data.fuel_curve.distance}
              fuelLiters={data.fuel_curve.fuel_liters}
              fuelPercentage={data.fuel_curve.fuel_percentage}
              height={300}
              showDataZoom={true}
            />
          </CardContent>
        </Card>

        {/* Fuel Scatter Chart (replaces both speed-scatter and throttle-scatter) */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption Analysis</CardTitle>
            <CardDescription>
              Speed vs fuel consumed - point color shows gear, point size shows throttle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelScatterChart
              speed={data.fuel_speed_scatter.speed}
              fuelConsumed={data.fuel_speed_scatter.fuel_consumed}
              throttle={data.fuel_speed_scatter.throttle}
              gear={data.fuel_speed_scatter.gear}
              height={400}
            />
          </CardContent>
        </Card>

        {/* Fuel Track Map (ECharts custom series for now, reuse when Canvas TrackMap is built) */}
        <Card>
          <CardHeader>
            <CardTitle>Track Map - Fuel Consumption</CardTitle>
            <CardDescription>
              Circuit visualization with fuel consumption (Green = Low, Red = High)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelTrackMapChart
              posX={data.fuel_track_map.pos_x}
              posZ={data.fuel_track_map.pos_z}
              fuelNormalized={data.fuel_track_map.fuel_normalized}
              height={500}
            />
            {/* Color scale legend */}
            <div className="flex justify-center mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Low</span>
                <div
                  className="w-48 h-4 rounded"
                  style={{
                    background: 'linear-gradient(to right, rgb(0, 200, 0), rgb(200, 200, 0), rgb(200, 0, 0))'
                  }}
                />
                <span className="text-sm text-muted-foreground">High</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TelemetryCursorProvider>
  );
}

// ------ Fuel Track Map (ECharts scatter-based) ------

interface FuelTrackMapChartProps {
  posX: number[];
  posZ: number[];
  fuelNormalized: number[];
  height?: number;
}

function FuelTrackMapChart({ posX, posZ, fuelNormalized, height = 500 }: FuelTrackMapChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // Build data: [pos_x, -pos_z (flip Z), fuel_normalized]
    const data = posX.map((x, i) => [x, -posZ[i], fuelNormalized[i]]);

    // Compute bounds for aspect-ratio-preserving view
    const xValues = posX;
    const zValues = posZ.map((z) => -z);
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const zMin = Math.min(...zValues);
    const zMax = Math.max(...zValues);
    const xPad = (xMax - xMin) * 0.05;
    const zPad = (zMax - zMin) * 0.05;

    return {
      grid: {
        left: 20,
        right: 20,
        top: 20,
        bottom: 20,
      },
      xAxis: {
        type: 'value',
        show: false,
        min: xMin - xPad,
        max: xMax + xPad,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: zMin - zPad,
        max: zMax + zPad,
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { data: number[] };
          const fuel = p.data[2];
          return `<div style="font-size:12px">
            <span style="color:#9ca3af">Fuel consumption:</span> ${(fuel * 100).toFixed(1)}%
          </div>`;
        },
      },
      visualMap: [
        {
          type: 'continuous',
          dimension: 2,
          min: 0,
          max: 1,
          inRange: {
            color: ['#22c55e', '#eab308', '#ef4444'],
          },
          show: false,
        },
      ],
      series: [
        {
          type: 'scatter',
          data,
          symbolSize: 3,
          silent: false,
        },
      ],
    };
  }, [posX, posZ, fuelNormalized]);

  return <TelemetryChart option={option} height={height} showDataZoom={false} />;
}

// ------ Fuel Comparison Charts ------

interface ComparisonProps {
  data: FuelComparisonResponse;
  lap1Number: number;
  lap2Number: number;
}

export function FuelComparisonCharts({ data, lap1Number, lap2Number }: ComparisonProps) {
  const moreEfficient = data.summary.more_efficient_lap;
  const efficiencyDiff = Math.abs(data.summary.fuel_delta);

  // Determine trend for fuel usage
  const lap1MoreEfficient = moreEfficient === lap1Number;

  return (
    <TelemetryCursorProvider>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* KPI Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
            label="More Efficient"
            value={`Lap ${moreEfficient}`}
            colorClass="text-green-400"
          />
          <KpiCard
            label="Fuel Saved"
            value={efficiencyDiff.toFixed(3)}
            unit="L"
            colorClass="text-green-400"
          />
          <KpiCard
            label={`Lap ${lap1Number} Fuel Used`}
            value={data.summary.lap_1_fuel_used.toFixed(2)}
            unit="L"
            colorClass="text-orange-400"
            trend={lap1MoreEfficient ? 'up' : 'down'}
            trendValue={lap1MoreEfficient ? 'more efficient' : 'less efficient'}
          />
          <KpiCard
            label={`Lap ${lap2Number} Fuel Used`}
            value={data.summary.lap_2_fuel_used.toFixed(2)}
            unit="L"
            colorClass="text-orange-400"
            trend={!lap1MoreEfficient ? 'up' : 'down'}
            trendValue={!lap1MoreEfficient ? 'more efficient' : 'less efficient'}
          />
          <KpiCard
            label={`L${lap1Number} Rate`}
            value={data.summary.lap_1_consumption_rate.toFixed(3)}
            unit="L/km"
          />
          <KpiCard
            label={`L${lap2Number} Rate`}
            value={data.summary.lap_2_consumption_rate.toFixed(3)}
            unit="L/km"
          />
        </div>

        {/* Fuel Delta Chart (green/red area fill) */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Consumption Delta</CardTitle>
            <CardDescription>
              Positive = Lap {lap2Number} used more fuel | Negative = Lap {lap2Number} more efficient
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelDeltaChart
              distance={data.fuel_delta.distance}
              delta={data.fuel_delta.delta}
              height={300}
            />
          </CardContent>
        </Card>

        {/* Fuel Curves Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Fuel Remaining Comparison</CardTitle>
            <CardDescription>
              Fuel level comparison over lap distance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FuelCurvesComparisonChart
              distance={data.fuel_curves.distance}
              lap1Fuel={data.fuel_curves.lap_1_fuel}
              lap2Fuel={data.fuel_curves.lap_2_fuel}
              lap1Label={`Lap ${lap1Number}`}
              lap2Label={`Lap ${lap2Number}`}
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </TelemetryCursorProvider>
  );
}

// ------ Fuel Delta Chart (green/red area fill like DeltaTimeChart) ------

interface FuelDeltaChartProps {
  distance: number[];
  delta: number[];
  height?: number;
}

function FuelDeltaChart({ distance, delta, height = 300 }: FuelDeltaChartProps) {
  const maxDistance = useMemo(() => {
    if (distance.length === 0) return 1000;
    return Math.max(...distance);
  }, [distance]);

  const option = useMemo<EChartsOption>(() => {
    const seriesData = distance.map((d, i) => [d, delta[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Delta (L)',
        nameTextStyle: { color: '#e5e7eb', fontSize: 12 },
        axisLabel: {
          color: '#e5e7eb',
          formatter: (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(3)}`,
        },
        axisLine: { lineStyle: { color: '#4b5563' } },
        splitLine: { lineStyle: { color: '#374151' } },
      },
      dataZoom: buildDataZoom(true),
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ data: number[] }>)[0];
          if (!p) return '';
          const d = p.data[0];
          const v = p.data[1];
          const distLabel = d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
          const sign = v > 0 ? '+' : '';
          return `<div style="font-size:12px">
            <div style="color:#9ca3af">${distLabel}</div>
            <div style="color:${v >= 0 ? TELEMETRY_COLORS.deltaPositive : TELEMETRY_COLORS.deltaNegative};font-weight:600">${sign}${v.toFixed(4)} L</div>
          </div>`;
        },
      },
      visualMap: [
        {
          type: 'piecewise',
          show: false,
          dimension: 1,
          pieces: [
            { min: 0, color: 'rgba(239, 68, 68, 0.4)' },   // red above zero
            { max: 0, color: 'rgba(34, 197, 94, 0.4)' },    // green below zero
          ],
          seriesIndex: 0,
        },
      ],
      series: [
        {
          type: 'line',
          data: seriesData,
          showSymbol: false,
          lineStyle: {
            color: TELEMETRY_COLORS.fuel,
            width: 2,
          },
          areaStyle: {},
          markLine: {
            silent: true,
            symbol: 'none',
            data: [
              {
                yAxis: 0,
                lineStyle: {
                  color: '#6b7280',
                  type: 'dashed' as const,
                  width: 1,
                },
                label: { show: false },
              },
            ],
          },
        },
      ],
    };
  }, [distance, delta, maxDistance]);

  return <TelemetryChart option={option} height={height} showDataZoom={true} />;
}

// ------ Fuel Curves Comparison Chart ------

interface FuelCurvesComparisonChartProps {
  distance: number[];
  lap1Fuel: number[];
  lap2Fuel: number[];
  lap1Label: string;
  lap2Label: string;
  height?: number;
}

function FuelCurvesComparisonChart({
  distance,
  lap1Fuel,
  lap2Fuel,
  lap1Label,
  lap2Label,
  height = 300,
}: FuelCurvesComparisonChartProps) {
  const maxDistance = useMemo(() => {
    if (distance.length === 0) return 1000;
    return Math.max(...distance);
  }, [distance]);

  const option = useMemo<EChartsOption>(() => {
    const lap1Data = distance.map((d, i) => [d, lap1Fuel[i]]);
    const lap2Data = distance.map((d, i) => [d, lap2Fuel[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Fuel (L)',
        nameTextStyle: { color: '#e5e7eb', fontSize: 12 },
        axisLabel: {
          color: '#e5e7eb',
          formatter: (v: number) => `${v.toFixed(1)}`,
        },
        axisLine: { lineStyle: { color: '#4b5563' } },
        splitLine: { lineStyle: { color: '#374151' } },
      },
      dataZoom: buildDataZoom(true),
      legend: {
        data: [lap1Label, lap2Label],
        textStyle: { color: '#e5e7eb' },
        top: 0,
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const arr = params as Array<{ data: number[]; seriesName: string; color: string }>;
          if (!arr || arr.length === 0) return '';
          const d = arr[0].data[0];
          const distLabel = d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
          let html = `<div style="font-size:12px"><div style="color:#9ca3af;margin-bottom:4px">${distLabel}</div>`;
          for (const p of arr) {
            html += `<div><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.data[1].toFixed(2)} L</b></div>`;
          }
          html += '</div>';
          return html;
        },
      },
      series: [
        {
          name: lap1Label,
          type: 'line',
          data: lap1Data,
          showSymbol: false,
          lineStyle: {
            color: TELEMETRY_COLORS.lap1,
            width: 2,
          },
          itemStyle: { color: TELEMETRY_COLORS.lap1 },
        },
        {
          name: lap2Label,
          type: 'line',
          data: lap2Data,
          showSymbol: false,
          lineStyle: {
            color: TELEMETRY_COLORS.lap2,
            width: 2,
          },
          itemStyle: { color: TELEMETRY_COLORS.lap2 },
        },
      ],
    };
  }, [distance, lap1Fuel, lap2Fuel, lap1Label, lap2Label, maxDistance]);

  return <TelemetryChart option={option} height={height} showDataZoom={true} />;
}
