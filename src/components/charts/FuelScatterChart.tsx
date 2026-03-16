import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart } from './TelemetryChart';

/**
 * Gear-specific color palette for discrete visualMap.
 * 7 gears + neutral/reverse, each with a distinct hue.
 */
const GEAR_COLORS: Record<number, string> = {
  0: '#6b7280',   // Neutral - gray
  1: '#ef4444',   // 1st - red
  2: '#f97316',   // 2nd - orange
  3: '#eab308',   // 3rd - yellow
  4: '#22c55e',   // 4th - green
  5: '#06b6d4',   // 5th - cyan
  6: '#3b82f6',   // 6th - blue
  7: '#8b5cf6',   // 7th - violet
};

interface FuelScatterChartProps {
  speed: number[];
  fuelConsumed: number[];
  throttle: number[];
  gear: number[];
  height?: number;
}

/**
 * Multi-dimensional scatter chart replacing two separate scatter plots.
 * X = speed, Y = fuel consumed, color = gear, size = throttle.
 */
export function FuelScatterChart({
  speed,
  fuelConsumed,
  throttle,
  gear,
  height = 400,
}: FuelScatterChartProps) {
  const option = useMemo<EChartsOption>(() => {
    // Build dataset: [speed, fuelConsumed, throttle, gear]
    const data = speed.map((s, i) => [
      s,
      fuelConsumed[i],
      throttle[i],
      gear[i],
    ]);

    // Find unique gears present in data, sorted
    const uniqueGears = [...new Set(gear)].sort((a, b) => a - b);

    // Build discrete visualMap pieces for gear coloring
    const pieces = uniqueGears.map((g) => ({
      value: g,
      label: g === 0 ? 'N' : `Gear ${g}`,
      color: GEAR_COLORS[g] || '#9ca3af',
    }));

    // Compute throttle range for size mapping
    const minThrottle = Math.min(...throttle);
    const maxThrottle = Math.max(...throttle);

    return {
      grid: {
        left: 70,
        right: 30,
        top: 30,
        bottom: 70,
      },
      xAxis: {
        type: 'value',
        name: 'Speed (km/h)',
        nameLocation: 'middle',
        nameGap: 30,
        nameTextStyle: { color: '#e5e7eb', fontSize: 12 },
        axisLabel: { color: '#e5e7eb' },
        axisLine: { lineStyle: { color: '#4b5563' } },
        splitLine: { lineStyle: { color: '#374151' } },
      },
      yAxis: {
        type: 'value',
        name: 'Fuel Consumed (L)',
        nameTextStyle: { color: '#e5e7eb', fontSize: 12 },
        axisLabel: {
          color: '#e5e7eb',
          formatter: (v: number) => v.toFixed(3),
        },
        axisLine: { lineStyle: { color: '#4b5563' } },
        splitLine: { lineStyle: { color: '#374151' } },
      },
      tooltip: {
        trigger: 'item',
        formatter: (params: unknown) => {
          const p = params as { data: number[] };
          const [spd, fuel, thr, gr] = p.data;
          const gearLabel = gr === 0 ? 'N' : `${gr}`;
          return `<div style="font-size:12px">
            <div><span style="color:#9ca3af">Speed:</span> ${spd.toFixed(1)} km/h</div>
            <div><span style="color:#9ca3af">Fuel:</span> ${fuel.toFixed(4)} L</div>
            <div><span style="color:#9ca3af">Throttle:</span> ${(thr * 100).toFixed(0)}%</div>
            <div><span style="color:#9ca3af">Gear:</span> ${gearLabel}</div>
          </div>`;
        },
      },
      visualMap: [
        {
          type: 'piecewise',
          dimension: 3, // gear index in data array
          pieces,
          orient: 'horizontal',
          left: 'center',
          bottom: 5,
          textStyle: { color: '#e5e7eb', fontSize: 11 },
          itemWidth: 14,
          itemHeight: 14,
          itemGap: 8,
        },
      ],
      series: [
        {
          type: 'scatter',
          data,
          symbolSize: (val: number[]) => {
            // Map throttle (0-1) to point size (4-20px)
            const t = val[2];
            const range = maxThrottle - minThrottle || 1;
            const normalized = (t - minThrottle) / range;
            return 4 + normalized * 16;
          },
          itemStyle: {
            opacity: 0.7,
          },
          emphasis: {
            itemStyle: {
              opacity: 1,
              borderColor: '#fff',
              borderWidth: 1,
            },
          },
        },
      ],
    };
  }, [speed, fuelConsumed, throttle, gear]);

  return <TelemetryChart option={option} height={height} showDataZoom={false} />;
}
