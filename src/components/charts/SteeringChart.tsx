import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart } from './TelemetryChart';
import { buildDistanceXAxis, TELEMETRY_COLORS } from '@/lib/echarts-setup';
import type { TelemetryTimeSeries, Corner } from '@/lib/api';

interface SteeringChartProps {
  steering: TelemetryTimeSeries;
  lap1Name: string;
  lap2Name: string;
  corners?: Corner[];
  showDataZoom?: boolean;
  showCornerBands?: boolean;
  height?: number;
}

export function SteeringChart({
  steering,
  lap1Name,
  lap2Name,
  corners = [],
  showDataZoom = false,
  showCornerBands = true,
  height = 300,
}: SteeringChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const maxDistance = Math.max(...steering.distance);

    const lap1Data = steering.distance.map((d, i) => [d, steering.lap_1[i]]);
    const lap2Data = steering.distance.map((d, i) => [d, steering.lap_2[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Steering',
        nameTextStyle: {
          color: '#e5e7eb',
          fontSize: 12,
        },
        min: -1,
        max: 1,
        axisLabel: {
          color: '#e5e7eb',
          formatter: (value: number) => value.toFixed(1),
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
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: {
              color: '#6b7280',
              type: 'dashed',
              width: 1,
            },
            data: [
              {
                yAxis: 0,
                label: {
                  show: false,
                },
              },
            ],
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
              ${item.seriesName}: <strong>${item.data[1].toFixed(3)}</strong>
            </div>`;
          }
          html += '</div>';
          return html;
        },
      },
    };
  }, [steering, lap1Name, lap2Name]);

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
