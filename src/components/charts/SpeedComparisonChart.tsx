import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart } from './TelemetryChart';
import { buildDistanceXAxis, TELEMETRY_COLORS } from '@/lib/echarts-setup';
import type { TelemetryTimeSeries, Corner } from '@/lib/api';

interface SpeedComparisonChartProps {
  speed: TelemetryTimeSeries;
  lap1Name: string;
  lap2Name: string;
  corners?: Corner[];
  showDataZoom?: boolean;
  showCornerBands?: boolean;
  height?: number;
}

export function SpeedComparisonChart({
  speed,
  lap1Name,
  lap2Name,
  corners = [],
  showDataZoom = false,
  showCornerBands = true,
  height = 300,
}: SpeedComparisonChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const maxDistance = Math.max(...speed.distance);

    const lap1Data = speed.distance.map((d, i) => [d, speed.lap_1[i]]);
    const lap2Data = speed.distance.map((d, i) => [d, speed.lap_2[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Speed (km/h)',
        nameTextStyle: {
          color: '#e5e7eb',
          fontSize: 12,
        },
        axisLabel: {
          color: '#e5e7eb',
          formatter: (value: number) => `${Math.round(value)}`,
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
          data: lap1Data,
          showSymbol: false,
          smooth: false,
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
          data: lap2Data,
          showSymbol: false,
          smooth: false,
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
          const distance = items[0].data[0];
          const distLabel =
            distance >= 1000
              ? `${(distance / 1000).toFixed(2)}km`
              : `${Math.round(distance)}m`;
          let html = `<div style="font-size:12px"><div style="margin-bottom:4px">${distLabel}</div>`;
          for (const item of items) {
            html += `<div>
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${item.color};margin-right:6px"></span>
              ${item.seriesName}: <strong>${item.data[1].toFixed(1)} km/h</strong>
            </div>`;
          }
          html += '</div>';
          return html;
        },
      },
    };
  }, [speed, lap1Name, lap2Name]);

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
