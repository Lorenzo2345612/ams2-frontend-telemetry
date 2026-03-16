import {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { useTelemetryCursor } from '@/hooks/useTelemetryCursor';
import { TELEMETRY_COLORS } from '@/lib/echarts-setup';
import type { Corner } from '@/lib/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ColorMode = 'delta' | 'speed' | 'fuel';

export interface TrackMapData {
  pos_x: number[];
  pos_z: number[];
  /** Delta color_value: -1 (green/gain) .. 0 (neutral) .. +1 (red/loss) */
  color_value?: number[];
  /** Speed at each track point (km/h). Must be same length as pos_x. */
  speed?: number[];
  /** Normalized fuel consumed 0..1. Must be same length as pos_x. */
  fuel_normalized?: number[];
  corners: Corner[];
}

export interface TrackMapProps {
  data: TrackMapData;
  /** Pixel width of the container; canvas will fill it. Default 600. */
  width?: number;
  /** Pixel height of the container. Default 500. */
  height?: number;
  /** Which color modes are available. Defaults to all that have data. */
  availableModes?: ColorMode[];
  /** Initial color mode. Default 'delta'. */
  initialMode?: ColorMode;
  /** Called when user clicks a corner label. Receives the Corner. */
  onCornerClick?: (corner: Corner) => void;
  /** Flip the Z axis (game coords vs screen coords). Default false. */
  flipZ?: boolean;
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

/** Interpolate between two [r,g,b] triples at t in [0,1]. */
function lerpRgb(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

function rgbString(c: [number, number, number]): string {
  return `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;
}

const GREEN: [number, number, number] = [34, 197, 94];
const NEUTRAL: [number, number, number] = [156, 163, 175];
const RED: [number, number, number] = [239, 68, 68];
const BLUE_LOW: [number, number, number] = [59, 130, 246];
const RED_HIGH: [number, number, number] = [239, 68, 68];
const GREEN_FUEL: [number, number, number] = [34, 197, 94];
const RED_FUEL: [number, number, number] = [239, 68, 68];

/**
 * Map a delta color_value in [-1,1] to an RGB color.
 * -1 = green, 0 = neutral gray, +1 = red.
 */
function deltaColor(v: number): [number, number, number] {
  const clamped = Math.max(-1, Math.min(1, v));
  if (clamped < 0) return lerpRgb(GREEN, NEUTRAL, clamped + 1);
  return lerpRgb(NEUTRAL, RED, clamped);
}

/** Map speed fraction 0..1 to blue..red gradient. */
function speedColor(fraction: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, fraction));
  return lerpRgb(BLUE_LOW, RED_HIGH, t);
}

/** Map fuel_normalized 0..1 to green..red gradient. */
function fuelColor(fraction: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, fraction));
  return lerpRgb(GREEN_FUEL, RED_FUEL, t);
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

interface Transform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

function computeTransform(
  posX: number[],
  posZ: number[],
  canvasW: number,
  canvasH: number,
  padding: number,
  flipZ: boolean,
): Transform {
  let minX = Infinity, maxX = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;
  for (let i = 0; i < posX.length; i++) {
    if (posX[i] < minX) minX = posX[i];
    if (posX[i] > maxX) maxX = posX[i];
    if (posZ[i] < minZ) minZ = posZ[i];
    if (posZ[i] > maxZ) maxZ = posZ[i];
  }
  const rangeX = maxX - minX || 1;
  const rangeZ = maxZ - minZ || 1;
  const drawW = canvasW - padding * 2;
  const drawH = canvasH - padding * 2;
  const scale = Math.min(drawW / rangeX, drawH / rangeZ);

  const centeredOffsetX = (drawW - rangeX * scale) / 2;
  const centeredOffsetZ = (drawH - rangeZ * scale) / 2;

  return {
    scaleX: scale,
    scaleY: flipZ ? scale : -scale,
    offsetX: padding + centeredOffsetX - minX * scale,
    offsetY: flipZ
      ? padding + centeredOffsetZ - minZ * scale
      : canvasH - padding - centeredOffsetZ + minZ * scale,
  };
}

function toScreen(x: number, z: number, t: Transform): [number, number] {
  return [x * t.scaleX + t.offsetX, z * t.scaleY + t.offsetY];
}

/** Compute cumulative distance array from positions. */
function cumulativeDistances(posX: number[], posZ: number[]): number[] {
  const n = posX.length;
  const d = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const dx = posX[i] - posX[i - 1];
    const dz = posZ[i] - posZ[i - 1];
    d[i] = d[i - 1] + Math.sqrt(dx * dx + dz * dz);
  }
  return Array.from(d);
}

/** Binary search for nearest index by distance. */
function nearestIndexByDistance(distances: number[], target: number): number {
  let lo = 0;
  let hi = distances.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (distances[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  if (lo > 0 && Math.abs(distances[lo - 1] - target) < Math.abs(distances[lo] - target)) {
    return lo - 1;
  }
  return lo;
}

/** Find nearest track point index to a screen coordinate. */
function nearestPointIndex(
  sx: number,
  sy: number,
  posX: number[],
  posZ: number[],
  transform: Transform,
): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < posX.length; i++) {
    const [px, py] = toScreen(posX[i], posZ[i], transform);
    const d = (px - sx) * (px - sx) + (py - sy) * (py - sy);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

function drawTrack(
  ctx: CanvasRenderingContext2D,
  posX: number[],
  posZ: number[],
  colorValues: number[],
  transform: Transform,
  colorFn: (value: number) => [number, number, number],
  lineWidth: number,
) {
  const n = posX.length;
  if (n < 2) return;

  // Draw per-segment with smooth gradient between colors.
  // For each segment we create a short linear gradient from point i to i+1.
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = toScreen(posX[i], posZ[i], transform);
    const [x1, y1] = toScreen(posX[i + 1], posZ[i + 1], transform);

    // Skip degenerate segments
    const dx = x1 - x0;
    const dy = y1 - y0;
    if (dx * dx + dy * dy < 0.01) continue;

    const c0 = colorFn(colorValues[i]);
    const c1 = colorFn(colorValues[i + 1]);

    const grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, rgbString(c0));
    grad.addColorStop(1, rgbString(c1));

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = grad;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
}

function drawCornerLabels(
  ctx: CanvasRenderingContext2D,
  corners: Corner[],
  transform: Transform,
  dpr: number,
) {
  const radius = 12 * dpr;
  const fontSize = 10 * dpr;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const c of corners) {
    const [cx, cy] = toScreen(c.pos_x, c.pos_z, transform);

    // Filled blue circle
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#1e40af';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2 * dpr;
    ctx.stroke();

    // White number
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(c.corner_number), cx, cy);
  }
}

function drawApexMarkers(
  ctx: CanvasRenderingContext2D,
  corners: Corner[],
  posX: number[],
  posZ: number[],
  distances: number[],
  transform: Transform,
  dpr: number,
) {
  const size = 5 * dpr;
  ctx.fillStyle = '#f59e0b';

  for (const c of corners) {
    // Find nearest track point to apex_distance
    const idx = nearestIndexByDistance(distances, c.apex_distance);
    const [ax, ay] = toScreen(posX[idx], posZ[idx], transform);

    // Diamond shape
    ctx.beginPath();
    ctx.moveTo(ax, ay - size);
    ctx.lineTo(ax + size, ay);
    ctx.lineTo(ax, ay + size);
    ctx.lineTo(ax - size, ay);
    ctx.closePath();
    ctx.fill();
  }
}

function drawHighlightDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dpr: number,
) {
  const outerR = 8 * dpr;
  const innerR = 4 * dpr;

  // Glow
  ctx.beginPath();
  ctx.arc(x, y, outerR, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // Solid dot
  ctx.beginPath();
  ctx.arc(x, y, innerR, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1 * dpr;
  ctx.stroke();
}

function drawColorScaleLegend(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  mode: ColorMode,
  dpr: number,
  speedMin?: number,
  speedMax?: number,
) {
  const barWidth = 200 * dpr;
  const barHeight = 12 * dpr;
  const barX = (canvasW - barWidth) / 2;
  const barY = canvasH - 30 * dpr;

  // Gradient bar
  const grad = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
  if (mode === 'delta') {
    grad.addColorStop(0, rgbString(GREEN));
    grad.addColorStop(0.5, rgbString(NEUTRAL));
    grad.addColorStop(1, rgbString(RED));
  } else if (mode === 'speed') {
    grad.addColorStop(0, rgbString(BLUE_LOW));
    grad.addColorStop(1, rgbString(RED_HIGH));
  } else {
    grad.addColorStop(0, rgbString(GREEN_FUEL));
    grad.addColorStop(1, rgbString(RED_FUEL));
  }

  ctx.fillStyle = grad;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  ctx.strokeStyle = '#4b5563';
  ctx.lineWidth = 1 * dpr;
  ctx.strokeRect(barX, barY, barWidth, barHeight);

  // Labels
  const fontSize = 11 * dpr;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.fillStyle = '#e5e7eb';
  ctx.textBaseline = 'middle';

  let leftLabel: string;
  let rightLabel: string;

  if (mode === 'delta') {
    leftLabel = 'Gaining';
    rightLabel = 'Losing';
  } else if (mode === 'speed') {
    leftLabel = speedMin !== undefined ? `${Math.round(speedMin)} km/h` : 'Slow';
    rightLabel = speedMax !== undefined ? `${Math.round(speedMax)} km/h` : 'Fast';
  } else {
    leftLabel = 'Low';
    rightLabel = 'High';
  }

  ctx.textAlign = 'right';
  ctx.fillText(leftLabel, barX - 6 * dpr, barY + barHeight / 2);
  ctx.textAlign = 'left';
  ctx.fillText(rightLabel, barX + barWidth + 6 * dpr, barY + barHeight / 2);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TrackMap({
  data,
  width = 600,
  height = 500,
  availableModes,
  initialMode = 'delta',
  onCornerClick,
  flipZ = false,
}: TrackMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [colorMode, setColorMode] = useState<ColorMode>(initialMode);
  const [containerWidth, setContainerWidth] = useState(width);

  const { hoveredDistance, setHoveredDistance, setZoomRange } = useTelemetryCursor();

  // Responsive: observe container width
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const effectiveWidth = containerWidth;
  const effectiveHeight = height;

  // Determine which modes have data
  const modes = useMemo<ColorMode[]>(() => {
    if (availableModes) return availableModes;
    const m: ColorMode[] = [];
    if (data.color_value && data.color_value.length > 0) m.push('delta');
    if (data.speed && data.speed.length > 0) m.push('speed');
    if (data.fuel_normalized && data.fuel_normalized.length > 0) m.push('fuel');
    if (m.length === 0) m.push('delta'); // fallback
    return m;
  }, [data.color_value, data.speed, data.fuel_normalized, availableModes]);

  // Ensure current mode is valid
  useEffect(() => {
    if (!modes.includes(colorMode)) {
      setColorMode(modes[0]);
    }
  }, [modes, colorMode]);

  // Precompute cumulative distances from track points
  const distances = useMemo(
    () => cumulativeDistances(data.pos_x, data.pos_z),
    [data.pos_x, data.pos_z],
  );

  // Speed min/max for legend
  const speedRange = useMemo(() => {
    if (!data.speed || data.speed.length === 0) return { min: 0, max: 300 };
    let mn = Infinity, mx = -Infinity;
    for (const v of data.speed) {
      if (v < mn) mn = v;
      if (v > mx) mx = v;
    }
    return { min: mn, max: mx };
  }, [data.speed]);

  // Color value arrays normalized for each mode
  const colorValues = useMemo(() => {
    const n = data.pos_x.length;
    const result: Record<ColorMode, number[]> = {
      delta: data.color_value || new Array(n).fill(0),
      speed: [],
      fuel: data.fuel_normalized || new Array(n).fill(0),
    };
    // Normalize speed to 0..1
    if (data.speed && data.speed.length === n) {
      const { min: sMin, max: sMax } = speedRange;
      const range = sMax - sMin || 1;
      result.speed = data.speed.map((v) => (v - sMin) / range);
    } else {
      result.speed = new Array(n).fill(0.5);
    }
    return result;
  }, [data.color_value, data.speed, data.fuel_normalized, data.pos_x.length, speedRange]);

  // Color function for current mode
  const getColorForMode = useCallback(
    (mode: ColorMode) => {
      switch (mode) {
        case 'delta':
          return deltaColor;
        case 'speed':
          return speedColor;
        case 'fuel':
          return fuelColor;
      }
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = effectiveWidth;
    const ch = effectiveHeight;

    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, cw, ch);

    if (data.pos_x.length < 2) return;

    const padding = 50;
    const transform = computeTransform(data.pos_x, data.pos_z, cw, ch - 40, padding, flipZ);

    // Draw track outline (thin dark line behind colored track for definition)
    ctx.beginPath();
    const [startX, startY] = toScreen(data.pos_x[0], data.pos_z[0], transform);
    ctx.moveTo(startX, startY);
    for (let i = 1; i < data.pos_x.length; i++) {
      const [px, py] = toScreen(data.pos_x[i], data.pos_z[i], transform);
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(75,85,99,0.5)';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw colored track
    const vals = colorValues[colorMode];
    const colorFn = getColorForMode(colorMode);
    drawTrack(ctx, data.pos_x, data.pos_z, vals, transform, colorFn, 3.5);

    // Draw apex markers (before corner labels so labels overlay them)
    drawApexMarkers(ctx, data.corners, data.pos_x, data.pos_z, distances, transform, 1);

    // Draw corner labels
    drawCornerLabels(ctx, data.corners, transform, 1);

    // Draw highlight dot for hovered distance
    if (hoveredDistance !== null) {
      const idx = nearestIndexByDistance(distances, hoveredDistance);
      const [hx, hy] = toScreen(data.pos_x[idx], data.pos_z[idx], transform);
      drawHighlightDot(ctx, hx, hy, 1);
    }

    // Draw color scale legend
    drawColorScaleLegend(
      ctx, cw, ch, colorMode, 1,
      speedRange.min, speedRange.max,
    );
  }, [
    data, effectiveWidth, effectiveHeight, colorMode, flipZ,
    hoveredDistance, distances, colorValues, getColorForMode, speedRange,
  ]);

  // ---------------------------------------------------------------------------
  // Mouse interaction
  // ---------------------------------------------------------------------------
  const handleMouseMove = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || data.pos_x.length < 2) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const padding = 50;
      const transform = computeTransform(
        data.pos_x, data.pos_z,
        effectiveWidth, effectiveHeight - 40, padding, flipZ,
      );

      const idx = nearestPointIndex(mx, my, data.pos_x, data.pos_z, transform);

      // Check if close enough (within 30px)
      const [px, py] = toScreen(data.pos_x[idx], data.pos_z[idx], transform);
      const dist = Math.sqrt((px - mx) ** 2 + (py - my) ** 2);
      if (dist < 30) {
        setHoveredDistance(distances[idx]);
      } else {
        setHoveredDistance(null);
      }
    },
    [data.pos_x, data.pos_z, effectiveWidth, effectiveHeight, flipZ, distances, setHoveredDistance],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredDistance(null);
  }, [setHoveredDistance]);

  const handleClick = useCallback(
    (e: ReactMouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !onCornerClick) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const padding = 50;
      const transform = computeTransform(
        data.pos_x, data.pos_z,
        effectiveWidth, effectiveHeight - 40, padding, flipZ,
      );

      // Check if click is on a corner label
      for (const corner of data.corners) {
        const [cx, cy] = toScreen(corner.pos_x, corner.pos_z, transform);
        const dist = Math.sqrt((cx - mx) ** 2 + (cy - my) ** 2);
        if (dist <= 14) {
          onCornerClick(corner);
          // Also zoom all charts to this corner
          const maxDist = distances[distances.length - 1] || 1;
          const startPct = (corner.start_distance / maxDist) * 100;
          const endPct = (corner.end_distance / maxDist) * 100;
          setZoomRange({ start: Math.max(0, startPct - 2), end: Math.min(100, endPct + 2) });
          return;
        }
      }
    },
    [data.corners, data.pos_x, data.pos_z, effectiveWidth, effectiveHeight, flipZ, onCornerClick, distances, setZoomRange],
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  const modeLabels: Record<ColorMode, string> = {
    delta: 'Delta',
    speed: 'Speed',
    fuel: 'Fuel',
  };

  const modeColors: Record<ColorMode, string> = {
    delta: TELEMETRY_COLORS.deltaNegative,
    speed: '#3b82f6',
    fuel: TELEMETRY_COLORS.fuel,
  };

  return (
    <div ref={containerRef} className="w-full">
      {/* Mode toggle buttons */}
      {modes.length > 1 && (
        <div className="flex gap-2 mb-3">
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => setColorMode(mode)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors border ${
                colorMode === mode
                  ? 'text-white border-transparent'
                  : 'text-gray-400 border-gray-600 hover:border-gray-500 hover:text-gray-300 bg-transparent'
              }`}
              style={
                colorMode === mode
                  ? { backgroundColor: modeColors[mode] }
                  : undefined
              }
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>
      )}

      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className="cursor-crosshair rounded-lg"
        style={{
          width: effectiveWidth,
          height: effectiveHeight,
          background: '#111827',
        }}
      />
    </div>
  );
}

export default TrackMap;
