import { useRef, useEffect, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import type { EChartsOption } from 'echarts';
import {
  echarts,
  TELEMETRY_CONNECT_GROUP,
  STANDARD_GRID,
  STANDARD_GRID_WITH_ZOOM,
  buildDataZoom,
  buildDistanceXAxis,
} from '@/lib/echarts-setup';
import { useTelemetryCursor } from '@/hooks/useTelemetryCursor';
import type { Corner } from '@/lib/api';

interface TelemetryChartProps {
  option: EChartsOption;
  height?: number;
  showDataZoom?: boolean;
  showCornerBands?: boolean;
  corners?: Corner[];
  group?: string;
}

/**
 * Build markArea data for corner zone vertical bands.
 * Each corner gets a semi-transparent gray band from start_distance to end_distance.
 */
function buildCornerMarkArea(corners: Corner[]): Record<string, unknown> {
  const data = corners.map((corner) => [
    {
      name: `T${corner.corner_number}`,
      xAxis: corner.start_distance,
      itemStyle: {
        color: 'rgba(75, 85, 99, 0.15)',
      },
      label: {
        show: true,
        position: 'insideTop',
        formatter: `T${corner.corner_number}`,
        color: '#6b7280',
        fontSize: 10,
        fontWeight: 'bold' as const,
      },
    },
    {
      xAxis: corner.end_distance,
    },
  ]);

  return {
    silent: true,
    data,
  };
}

export function TelemetryChart({
  option,
  height = 300,
  showDataZoom = false,
  showCornerBands = false,
  corners = [],
  group = TELEMETRY_CONNECT_GROUP,
}: TelemetryChartProps) {
  const chartRef = useRef<ReactEChartsCore>(null);
  const { setHoveredDistance, setZoomRange } = useTelemetryCursor();

  // Join the connect group on mount so crosshairs sync across all charts
  useEffect(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (instance) {
      instance.group = group;
      echarts.connect(group);
    }
  }, [group]);

  // Handle axis pointer (hover) events to broadcast hovered distance
  const onEvents = useCallback(() => {
    return {
      updateAxisPointer: (params: Record<string, unknown>) => {
        const axesInfo = params.axesInfo as Array<{
          axisDim: string;
          value: number;
        }> | undefined;
        if (axesInfo && axesInfo.length > 0) {
          const xAxisInfo = axesInfo.find((a) => a.axisDim === 'x');
          if (xAxisInfo) {
            setHoveredDistance(xAxisInfo.value);
          }
        }
      },
      dataZoom: (params: Record<string, unknown>) => {
        const batch = params.batch as Array<{
          start: number;
          end: number;
        }> | undefined;
        if (batch && batch.length > 0) {
          setZoomRange({ start: batch[0].start, end: batch[0].end });
        }
      },
      globalout: () => {
        setHoveredDistance(null);
      },
    };
  }, [setHoveredDistance, setZoomRange]);

  // Merge user option with standard infrastructure
  const mergedOption: EChartsOption = {
    ...option,
    grid: option.grid || (showDataZoom ? STANDARD_GRID_WITH_ZOOM : STANDARD_GRID),
    dataZoom: option.dataZoom || buildDataZoom(showDataZoom),
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        lineStyle: {
          color: '#6b7280',
          width: 1,
          type: 'dashed',
        },
        crossStyle: {
          color: '#6b7280',
          width: 1,
          type: 'dashed',
        },
        label: {
          backgroundColor: '#1f2937',
          color: '#e5e7eb',
          borderColor: '#374151',
        },
      },
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#e5e7eb',
      },
      ...(typeof option.tooltip === 'object' && option.tooltip !== null
        ? option.tooltip
        : {}),
    },
  };

  // Inject corner markArea bands into the first series if requested
  if (showCornerBands && corners.length > 0 && Array.isArray(mergedOption.series)) {
    const series = mergedOption.series as Array<Record<string, unknown>>;
    if (series.length > 0) {
      series[0] = {
        ...series[0],
        markArea: buildCornerMarkArea(corners),
      };
    }
  }

  return (
    <ReactEChartsCore
      ref={chartRef}
      echarts={echarts}
      option={mergedOption}
      theme="telemetry-dark"
      style={{ height: `${height}px`, width: '100%' }}
      opts={{ renderer: 'canvas', devicePixelRatio: window.devicePixelRatio }}
      onEvents={onEvents()}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

export { buildCornerMarkArea, buildDistanceXAxis };
