import { useState, useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart, buildDistanceXAxis } from './TelemetryChart';
import { TELEMETRY_COLORS, buildDataZoom } from '@/lib/echarts-setup';

interface FuelRemainingChartProps {
  distance: number[];
  fuelLiters: number[];
  fuelPercentage: number[];
  height?: number;
  showDataZoom?: boolean;
}

/**
 * Fuel remaining area chart with orange gradient fill.
 * Replaces both the old fuel liters and fuel percentage charts
 * with a single chart and a liters/percentage toggle.
 */
export function FuelRemainingChart({
  distance,
  fuelLiters,
  fuelPercentage,
  height = 300,
  showDataZoom = true,
}: FuelRemainingChartProps) {
  const [viewMode, setViewMode] = useState<'liters' | 'percentage'>('liters');

  const maxDistance = useMemo(() => {
    if (distance.length === 0) return 1000;
    return Math.max(...distance);
  }, [distance]);

  const option = useMemo<EChartsOption>(() => {
    const isLiters = viewMode === 'liters';
    const values = isLiters ? fuelLiters : fuelPercentage.map((v) => v * 100);
    const seriesData = distance.map((d, i) => [d, values[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: isLiters ? 'Fuel (L)' : 'Fuel (%)',
        nameTextStyle: { color: '#e5e7eb', fontSize: 12 },
        axisLabel: {
          color: '#e5e7eb',
          formatter: isLiters ? '{value} L' : '{value}%',
        },
        axisLine: { lineStyle: { color: '#4b5563' } },
        splitLine: { lineStyle: { color: '#374151' } },
        min: isLiters ? undefined : 0,
        max: isLiters ? undefined : 100,
      },
      dataZoom: buildDataZoom(showDataZoom),
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = (params as Array<{ data: number[] }>)[0];
          if (!p) return '';
          const d = p.data[0];
          const v = p.data[1];
          const distLabel = d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
          const valLabel = isLiters ? `${v.toFixed(2)} L` : `${v.toFixed(1)}%`;
          return `<div style="font-size:12px">
            <div style="color:#9ca3af">${distLabel}</div>
            <div style="color:${TELEMETRY_COLORS.fuel};font-weight:600">${valLabel}</div>
          </div>`;
        },
      },
      series: [
        {
          type: 'line',
          data: seriesData,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            color: TELEMETRY_COLORS.fuel,
            width: 2,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(249, 115, 22, 0.5)' },
                { offset: 1, color: 'rgba(249, 115, 22, 0.05)' },
              ],
            },
          },
        },
      ],
    };
  }, [distance, fuelLiters, fuelPercentage, maxDistance, viewMode, showDataZoom]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-sm text-muted-foreground mr-1">View:</span>
        <button
          className={`px-3 py-1 text-xs rounded-md border transition-colors ${
            viewMode === 'liters'
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
              : 'bg-transparent text-muted-foreground border-border hover:bg-accent'
          }`}
          onClick={() => setViewMode('liters')}
        >
          Liters
        </button>
        <button
          className={`px-3 py-1 text-xs rounded-md border transition-colors ${
            viewMode === 'percentage'
              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
              : 'bg-transparent text-muted-foreground border-border hover:bg-accent'
          }`}
          onClick={() => setViewMode('percentage')}
        >
          Percentage
        </button>
      </div>
      <TelemetryChart option={option} height={height} showDataZoom={showDataZoom} />
    </div>
  );
}
