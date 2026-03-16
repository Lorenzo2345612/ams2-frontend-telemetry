import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { TelemetryChart } from './TelemetryChart';
import { buildDistanceXAxis } from '@/lib/echarts-setup';
import type { DeltaTimeSeries, Corner } from '@/lib/api';

interface DeltaTimeChartProps {
  deltaTime: DeltaTimeSeries;
  corners?: Corner[];
  showDataZoom?: boolean;
  showCornerBands?: boolean;
  height?: number;
}

export function DeltaTimeChart({
  deltaTime,
  corners = [],
  showDataZoom = false,
  showCornerBands = false,
  height = 300,
}: DeltaTimeChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const maxDistance = Math.max(...deltaTime.distance);

    // Build [distance, delta] pairs for the series
    const seriesData = deltaTime.distance.map((d, i) => [d, deltaTime.delta[i]]);

    return {
      xAxis: buildDistanceXAxis(maxDistance),
      yAxis: {
        type: 'value',
        name: 'Delta (s)',
        nameTextStyle: {
          color: '#e5e7eb',
          fontSize: 12,
        },
        axisLabel: {
          color: '#e5e7eb',
          formatter: (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}`,
        },
        axisLine: {
          lineStyle: { color: '#4b5563' },
        },
        splitLine: {
          lineStyle: { color: '#374151' },
        },
      },
      visualMap: {
        show: false,
        pieces: [
          {
            gt: 0,
            color: 'rgba(239, 68, 68, 0.6)',
          },
          {
            lte: 0,
            color: 'rgba(34, 197, 94, 0.6)',
          },
        ],
        seriesIndex: 0,
      },
      series: [
        {
          type: 'line',
          data: seriesData,
          showSymbol: false,
          smooth: false,
          lineStyle: {
            width: 1.5,
          },
          areaStyle: {
            opacity: 0.4,
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
                  show: true,
                  formatter: '0.00s',
                  color: '#9ca3af',
                  fontSize: 10,
                  position: 'insideEndTop',
                },
              },
            ],
          },
        },
      ],
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const p = Array.isArray(params) ? params[0] : params;
          const data = (p as { data: number[] }).data;
          const distance = data[0];
          const delta = data[1];
          const sign = delta >= 0 ? '+' : '';
          const distLabel =
            distance >= 1000
              ? `${(distance / 1000).toFixed(2)}km`
              : `${Math.round(distance)}m`;
          return `<div style="font-size:12px">
            <div style="margin-bottom:4px">${distLabel}</div>
            <div style="color:${delta >= 0 ? '#ef4444' : '#22c55e'};font-weight:bold">
              ${sign}${delta.toFixed(3)}s
            </div>
          </div>`;
        },
      },
    };
  }, [deltaTime]);

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
