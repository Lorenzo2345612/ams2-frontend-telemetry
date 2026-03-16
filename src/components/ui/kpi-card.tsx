import { useRef, useEffect, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { echarts } from '@/lib/echarts-setup';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  colorClass?: string;
  sparklineData?: number[];
}

/**
 * Trend arrow indicator component.
 */
function TrendIndicator({ trend, trendValue }: { trend: 'up' | 'down' | 'neutral'; trendValue?: string }) {
  const config = {
    up: {
      arrow: '\u25B2',
      colorClass: 'text-green-400',
    },
    down: {
      arrow: '\u25BC',
      colorClass: 'text-red-400',
    },
    neutral: {
      arrow: '\u25C6',
      colorClass: 'text-muted-foreground',
    },
  }[trend];

  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', config.colorClass)}>
      <span className="text-[10px]">{config.arrow}</span>
      {trendValue && <span>{trendValue}</span>}
    </span>
  );
}

/**
 * Tiny inline sparkline rendered with ECharts (approximately 60x24px).
 * No axes, no grid, no labels -- just the line.
 */
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartRef = useRef<ReactEChartsCore>(null);

  const option = useMemo(() => {
    return {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
      xAxis: {
        type: 'category',
        show: false,
        data: data.map((_, i) => i),
      },
      yAxis: {
        type: 'value',
        show: false,
        min: Math.min(...data),
        max: Math.max(...data),
      },
      series: [
        {
          type: 'line',
          data,
          showSymbol: false,
          lineStyle: {
            color,
            width: 1.5,
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: color.replace(')', ', 0.3)').replace('rgb(', 'rgba(').replace('#', '') || `${color}4D` },
                { offset: 1, color: 'transparent' },
              ],
            },
          },
          silent: true,
        },
      ],
      tooltip: { show: false },
    };
  }, [data, color]);

  // Prevent the sparkline from joining the telemetry connect group
  useEffect(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (instance) {
      instance.group = '';
    }
  }, []);

  return (
    <ReactEChartsCore
      ref={chartRef}
      echarts={echarts}
      option={option}
      theme="telemetry-dark"
      style={{ width: '60px', height: '24px' }}
      opts={{ renderer: 'canvas', devicePixelRatio: window.devicePixelRatio }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
}

/**
 * KPI Card component for displaying key performance indicators.
 * Supports large value display, trend indicators, and optional sparklines.
 */
export function KpiCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  colorClass,
  sparklineData,
}: KpiCardProps) {
  // Determine sparkline color from colorClass or default
  const sparklineColor = useMemo(() => {
    if (colorClass?.includes('orange')) return '#f97316';
    if (colorClass?.includes('green')) return '#22c55e';
    if (colorClass?.includes('red')) return '#ef4444';
    if (colorClass?.includes('blue')) return '#3b82f6';
    if (colorClass?.includes('violet')) return '#8b5cf6';
    if (colorClass?.includes('amber')) return '#f59e0b';
    return '#8b5cf6';
  }, [colorClass]);

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={cn('text-2xl font-bold tabular-nums', colorClass || 'text-foreground')}>
              {value}
            </span>
            {unit && (
              <span className="text-sm text-muted-foreground font-medium">{unit}</span>
            )}
          </div>
          {trend && (
            <div className="mt-1">
              <TrendIndicator trend={trend} trendValue={trendValue} />
            </div>
          )}
        </div>
        {sparklineData && sparklineData.length > 1 && (
          <div className="flex-shrink-0 ml-2 mt-1">
            <Sparkline data={sparklineData} color={sparklineColor} />
          </div>
        )}
      </div>
    </div>
  );
}
