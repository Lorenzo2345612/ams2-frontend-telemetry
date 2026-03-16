import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface TelemetryCursorContextType {
  hoveredDistance: number | null;
  setHoveredDistance: (d: number | null) => void;
  zoomRange: { start: number; end: number };
  setZoomRange: (range: { start: number; end: number }) => void;
}

const TelemetryCursorContext = createContext<TelemetryCursorContextType | null>(null);

interface TelemetryCursorProviderProps {
  children: ReactNode;
}

export function TelemetryCursorProvider({ children }: TelemetryCursorProviderProps) {
  const [hoveredDistance, setHoveredDistanceRaw] = useState<number | null>(null);
  const [zoomRange, setZoomRangeRaw] = useState<{ start: number; end: number }>({
    start: 0,
    end: 100,
  });

  const setHoveredDistance = useCallback((d: number | null) => {
    setHoveredDistanceRaw(d);
  }, []);

  const setZoomRange = useCallback((range: { start: number; end: number }) => {
    setZoomRangeRaw(range);
  }, []);

  return (
    <TelemetryCursorContext.Provider
      value={{
        hoveredDistance,
        setHoveredDistance,
        zoomRange,
        setZoomRange,
      }}
    >
      {children}
    </TelemetryCursorContext.Provider>
  );
}

export function useTelemetryCursor(): TelemetryCursorContextType {
  const context = useContext(TelemetryCursorContext);
  if (!context) {
    throw new Error('useTelemetryCursor must be used within a TelemetryCursorProvider');
  }
  return context;
}
