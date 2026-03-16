import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart } from './TelemetryChart';
import { buildDistanceXAxis, TELEMETRY_COLORS } from '@/lib/echarts-setup';
import type { Corner } from '@/lib/api';

interface GearChartProps {
  /** Distance array shared by both laps */
  distance?: number[];
  /** Gear values for lap 1 (integer 1-7) */
  gearLap1?: number[];
  /** Gear values for lap 2 (integer 1-7) */
  gearLap2?: number[];
  lap1Name: string;
  lap2Name: string;
  corners?: Corner[];
  showDataZoom?: boolean;
  showCornerBands?: boolean;
  height?: number;
}

export function GearChart({
  distance,
  gearLap1,
  gearLap2,
  lap1Name,
  lap2Name,
  corners = [],
  showDataZoom = false,
  showCornerBands = true,
  height = 250,
}: GearChartProps) {
  // If gear data is not available, show a message
  if (!distance || !gearLap1 || !gearLap2 || distance.length === 0) {
    return (
      <div
        style={{ height: `${height}px` }}
        className="flex items-center justify-center rounded-lg border border-border bg-card"
      >
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            Gear data not available
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Gear telemetry is not included in the current comparison response
          </p>
        </div>
      </div>
    );
  }

  const option = useMemo<EChartsOption>(() => {
    const maxDistance = Math.max(...distance);

    const lap1Data = distance.map((d, i) => [d, gearLap1[i]]);
    const lap2Data = distance.map((d, i) => [d, gearLap2[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Gear',
        nameTextStyle: {
          color: '#e5e7eb',
          fontSize: 12,
        },
        min: 0,
        max: 8,
        interval: 1,
        axisLabel: {
          color: '#e5e7eb',
          formatter: (value: number) => {
            if (value === 0) return 'N';
            if (value >= 1 && value <= 7) return `${value}`;
            return '';
          },
        },
        axisLine: {
          lineStyle: { color: '#4b5563' },
        },
        splitLine: {
          lineStyle: { color: '#374151' },
        },
      },
      legend: {
        data: [lap1Name, lap2Name],
        textStyle: { color: '#e5e7eb' },
        top: 0,
        right: 10,
      },
      series: [
        {
          name: lap1Name,
          type: 'line',
          step: 'middle',
          data: lap1Data,
          showSymbol: false,
          lineStyle: {
            color: TELEMETRY_COLORS.lap1,
            width: 2,
          },
          itemStyle: {
            color: TELEMETRY_COLORS.lap1,
          },
        },
        {
          name: lap2Name,
          type: 'line',
          step: 'middle',
          data: lap2Data,
          showSymbol: false,
          lineStyle: {
            color: TELEMETRY_COLORS.lap2,
            width: 2,
          },
          itemStyle: {
            color: TELEMETRY_COLORS.lap2,
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const items = params as Array<{
            seriesName: string;
            data: number[];
            color: string;
          }>;
          if (!Array.isArray(items) || items.length === 0) return '';
          const dist = items[0].data[0];
          const distLabel =
            dist >= 1000
              ? `${(dist / 1000).toFixed(2)}km`
              : `${Math.round(dist)}m`;
          let html = `<div style="font-size:12px"><div style="margin-bottom:4px">${distLabel}</div>`;
          for (const item of items) {
            const gear = Math.round(item.data[1]);
            const gearLabel = gear === 0 ? 'N' : `${gear}`;
            html += `<div>
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px"></span>
              ${item.seriesName}: <strong>Gear ${gearLabel}</strong>
            </div>`;
          }
          html += '</div>';
          return html;
        },
      },
    };
  }, [distance, gearLap1, gearLap2, lap1Name, lap2Name]);

  return (
    <TelemetryChart
      option={option}
      height={height}
      showDataZoom={showDataZoom}
      showCornerBands={showCornerBands}
      corners={corners}
    />
  );
}
