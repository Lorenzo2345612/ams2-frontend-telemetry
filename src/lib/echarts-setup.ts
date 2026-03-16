import * as echarts from 'echarts/core';
import { LineChart, ScatterChart, CustomChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  VisualMapComponent,
  MarkAreaComponent,
  MarkLineComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register tree-shaken modules
echarts.use([
  LineChart,
  ScatterChart,
  CustomChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  VisualMapComponent,
  MarkAreaComponent,
  MarkLineComponent,
  LegendComponent,
  CanvasRenderer,
]);

// Custom dark telemetry theme
const telemetryDarkTheme: Record<string, unknown> = {
  backgroundColor: 'transparent',
  textStyle: {
    color: '#e5e7eb',
  },
  title: {
    textStyle: {
      color: '#e5e7eb',
    },
    subtextStyle: {
      color: '#9ca3af',
    },
  },
  line: {
    itemStyle: {
      borderWidth: 1,
    },
    lineStyle: {
      width: 2,
    },
    symbolSize: 0,
    symbol: 'none',
    smooth: false,
  },
  categoryAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#4b5563',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#4b5563',
      },
    },
    axisLabel: {
      show: true,
      color: '#e5e7eb',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151'],
      },
    },
    splitArea: {
      show: false,
    },
  },
  valueAxis: {
    axisLine: {
      show: true,
      lineStyle: {
        color: '#4b5563',
      },
    },
    axisTick: {
      show: true,
      lineStyle: {
        color: '#4b5563',
      },
    },
    axisLabel: {
      show: true,
      color: '#e5e7eb',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: ['#374151'],
      },
    },
    splitArea: {
      show: false,
    },
  },
  legend: {
    textStyle: {
      color: '#e5e7eb',
    },
  },
  tooltip: {
    backgroundColor: '#1f2937',
    borderColor: '#374151',
    borderWidth: 1,
    textStyle: {
      color: '#e5e7eb',
    },
    axisPointer: {
      lineStyle: {
        color: '#6b7280',
        width: 1,
      },
      crossStyle: {
        color: '#6b7280',
        width: 1,
      },
    },
  },
  dataZoom: {
    backgroundColor: 'transparent',
    dataBackgroundColor: 'rgba(75,85,99,0.3)',
    fillerColor: 'rgba(139,92,246,0.15)',
    handleColor: '#8b5cf6',
    handleSize: '80%',
    textStyle: {
      color: '#e5e7eb',
    },
    borderColor: '#374151',
  },
};

echarts.registerTheme('telemetry-dark', telemetryDarkTheme);

// Standard color palette for telemetry channels
export const TELEMETRY_COLORS = {
  lap1: '#8b5cf6',       // violet
  lap2: '#f59e0b',       // amber
  deltaPositive: '#ef4444', // red (slower)
  deltaNegative: '#22c55e', // green (faster)
  throttle: '#10b981',   // emerald
  brake: '#ef4444',      // red
  fuel: '#f97316',       // orange
  neutral: '#9ca3af',    // gray
} as const;

// Connect group name for linked crosshairs across all charts
export const TELEMETRY_CONNECT_GROUP = 'telemetry-group';

// Standard grid margins for consistent chart alignment
export const STANDARD_GRID = {
  left: 60,
  right: 20,
  top: 30,
  bottom: 60,
} as const;

// Standard grid margins when dataZoom slider is shown
export const STANDARD_GRID_WITH_ZOOM = {
  left: 60,
  right: 20,
  top: 30,
  bottom: 100,
} as const;

/**
 * Format distance values for axis labels.
 * Values >= 1000m are shown as km (e.g., "1.0km"), smaller values as meters.
 */
export function formatDistance(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}km`;
  }
  return `${Math.round(value)}m`;
}

/**
 * Compute smart tick spacing based on track length.
 * Returns 200m intervals for tracks under 3km, 500m for longer tracks.
 */
export function computeDistanceTicks(maxDistance: number): number[] {
  const interval = maxDistance > 3000 ? 500 : 200;
  const ticks: number[] = [];
  for (let i = 0; i <= maxDistance; i += interval) {
    ticks.push(i);
  }
  return ticks;
}

/**
 * Build a standard distance x-axis configuration.
 */
export function buildDistanceXAxis(maxDistance: number): Record<string, unknown> {
  return {
    type: 'value',
    name: 'Distance',
    nameLocation: 'center',
    nameGap: 30,
    nameTextStyle: {
      color: '#e5e7eb',
      fontSize: 12,
    },
    axisLabel: {
      formatter: formatDistance,
      color: '#e5e7eb',
    },
    axisLine: {
      lineStyle: { color: '#4b5563' },
    },
    axisTick: {
      lineStyle: { color: '#4b5563' },
    },
    splitLine: {
      lineStyle: { color: '#374151' },
    },
    min: 0,
    max: maxDistance,
  };
}

/**
 * Build standard dataZoom configuration (slider + inside scroll).
 */
export function buildDataZoom(show: boolean): Record<string, unknown>[] {
  if (!show) {
    return [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
      },
    ];
  }

  return [
    {
      type: 'slider',
      xAxisIndex: 0,
      filterMode: 'none',
      height: 25,
      bottom: 10,
      borderColor: '#374151',
      backgroundColor: 'rgba(75,85,99,0.2)',
      fillerColor: 'rgba(139,92,246,0.15)',
      handleStyle: {
        color: '#8b5cf6',
        borderColor: '#8b5cf6',
      },
      textStyle: {
        color: '#e5e7eb',
      },
      dataBackground: {
        lineStyle: { color: '#4b5563' },
        areaStyle: { color: 'rgba(75,85,99,0.3)' },
      },
      selectedDataBackground: {
        lineStyle: { color: '#8b5cf6' },
        areaStyle: { color: 'rgba(139,92,246,0.2)' },
      },
    },
    {
      type: 'inside',
      xAxisIndex: 0,
      filterMode: 'none',
    },
  ];
}

export { echarts };
export default echarts;
