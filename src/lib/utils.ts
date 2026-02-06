import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3);
  return `${mins}:${secs.padStart(6, '0')}`;
}

export function formatDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '-';
  const absDelta = Math.abs(delta);
  const mins = Math.floor(absDelta / 60);
  const secs = absDelta % 60;
  return `${sign}${mins.toString().padStart(2, '0')}:${secs.toFixed(3).padStart(6, '0')}`;
}
