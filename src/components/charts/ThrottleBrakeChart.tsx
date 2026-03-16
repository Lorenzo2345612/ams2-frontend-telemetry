import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart } from './TelemetryChart';
import { buildDistanceXAxis, TELEMETRY_COLORS } from '@/lib/echarts-setup';
import type { TelemetryTimeSeries, Corner } from '@/lib/api';

interface ThrottleBrakeChartProps {
  throttle: TelemetryTimeSeries;
  brake: TelemetryTimeSeries;
  lap1Name: string;
  lap2Name: string;
  corners?: Corner[];
  showDataZoom?: boolean;
  showCornerBands?: boolean;
  height?: number;
}

export function ThrottleBrakeChart({
  throttle,
  brake,
  lap1Name,
  lap2Name,
  corners = [],
  showDataZoom = false,
  showCornerBands = false,
  height = 300,
}: ThrottleBrakeChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const maxDistance = Math.max(...throttle.distance);

    // Convert 0-1 values to 0-100% for display
    const throttleLap1Data = throttle.distance.map((d, i) => [d, throttle.lap_1[i] * 100]);
    const throttleLap2Data = throttle.distance.map((d, i) => [d, throttle.lap_2[i] * 100]);
    const brakeLap1Data = brake.distance.map((d, i) => [d, brake.lap_1[i] * 100]);
    const brakeLap2Data = brake.distance.map((d, i) => [d, brake.lap_2[i] * 100]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Input (%)',
        nameTextStyle: {
          color: '#e5e7eb',
          fontSize: 12,
        },
        min: 0,
        max: 100,
        axisLabel: {
          color: '#e5e7eb',
          formatter: (value: number) => `${Math.round(value)}%`,
        },
        axisLine: {
          lineStyle: { color: '#4b5563' },
        },
        splitLine: {
          lineStyle: { color: '#374151' },
        },
      },
      legend: {
        data: [
          `Throttle ${lap1Name}`,
          `Throttle ${lap2Name}`,
          `Brake ${lap1Name}`,
          `Brake ${lap2Name}`,
        ],
        textStyle: { color: '#e5e7eb', fontSize: 11 },
        top: 0,
        right: 10,
        itemWidth: 16,
        itemHeight: 10,
      },
      series: [
        {
          name: `Throttle ${lap1Name}`,
          type: 'line',
          data: throttleLap1Data,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            color: TELEMETRY_COLORS.throttle,
            width: 1.5,
            type: 'solid',
          },
          itemStyle: {
            color: TELEMETRY_COLORS.throttle,
          },
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.4)',
          },
          z: 2,
        },
        {
          name: `Throttle ${lap2Name}`,
          type: 'line',
          data: throttleLap2Data,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            color: TELEMETRY_COLORS.throttle,
            width: 1.5,
            type: 'dashed',
          },
          itemStyle: {
            color: TELEMETRY_COLORS.throttle,
          },
          areaStyle: {
            color: 'rgba(16, 185, 129, 0.15)',
          },
          z: 1,
        },
        {
          name: `Brake ${lap1Name}`,
          type: 'line',
          data: brakeLap1Data,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            color: TELEMETRY_COLORS.brake,
            width: 1.5,
            type: 'solid',
          },
          itemStyle: {
            color: TELEMETRY_COLORS.brake,
          },
          areaStyle: {
            color: 'rgba(239, 68, 68, 0.4)',
          },
          z: 2,
        },
        {
          name: `Brake ${lap2Name}`,
          type: 'line',
          data: brakeLap2Data,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            color: TELEMETRY_COLORS.brake,
            width: 1.5,
            type: 'dashed',
          },
          itemStyle: {
            color: TELEMETRY_COLORS.brake,
          },
          areaStyle: {
            color: 'rgba(239, 68, 68, 0.15)',
          },
          z: 1,
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
            const dotColor = item.seriesName.startsWith('Throttle')
              ? TELEMETRY_COLORS.throttle
              : TELEMETRY_COLORS.brake;
            html += `<div>
              <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${dotColor};margin-right:6px"></span>
              ${item.seriesName}: <strong>${item.data[1].toFixed(1)}%</strong>
            </div>`;
          }
          html += '</div>';
          return html;
        },
      },
    };
  }, [throttle, brake, lap1Name, lap2Name]);

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
