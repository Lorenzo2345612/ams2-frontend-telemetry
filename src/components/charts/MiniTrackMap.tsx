import { useRef, useEffect, useMemo } from 'react';
import { useTelemetryCursor } from '@/hooks/useTelemetryCursor';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MiniTrackMapProps {
  /** X positions along the track. */
  pos_x: number[];
  /** Z positions along the track. */
  pos_z: number[];
  /** CSS pixel size of the square map. Default 150. */
  size?: number;
  /** Flip Z axis. Default false. */
  flipZ?: boolean;
}

// ---------------------------------------------------------------------------
// Geometry helpers (self-contained, no shared module dependency)
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

function cumulativeDistances(posX: number[], posZ: number[]): Float64Array {
  const n = posX.length;
  const d = new Float64Array(n);
  for (let i = 1; i < n; i++) {
    const dx = posX[i] - posX[i - 1];
    const dz = posZ[i] - posZ[i - 1];
    d[i] = d[i - 1] + Math.sqrt(dx * dx + dz * dz);
  }
  return d;
}

function nearestIndexByDistance(distances: Float64Array, target: number): number {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MiniTrackMap({
  pos_x,
  pos_z,
  size = 150,
  flipZ = false,
}: MiniTrackMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { hoveredDistance } = useTelemetryCursor();

  const distances = useMemo(() => cumulativeDistances(pos_x, pos_z), [pos_x, pos_z]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear with dark background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    if (pos_x.length < 2) return;

    const padding = 12;
    const transform = computeTransform(pos_x, pos_z, size, size, padding, flipZ);

    // Draw track outline
    ctx.beginPath();
    const [sx, sy] = toScreen(pos_x[0], pos_z[0], transform);
    ctx.moveTo(sx, sy);
    for (let i = 1; i < pos_x.length; i++) {
      const [px, py] = toScreen(pos_x[i], pos_z[i], transform);
      ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(226,232,240,0.4)';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw position dot if hovered
    if (hoveredDistance !== null && distances.length > 0) {
      const idx = nearestIndexByDistance(distances, hoveredDistance);
      const [hx, hy] = toScreen(pos_x[idx], pos_z[idx], transform);

      // Glow
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,92,246,0.4)';
      ctx.fill();

      // Solid dot
      ctx.beginPath();
      ctx.arc(hx, hy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [pos_x, pos_z, size, flipZ, hoveredDistance, distances]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border border-gray-700 shadow-lg"
      style={{
        width: size,
        height: size,
      }}
    />
  );
}

export default MiniTrackMap;
