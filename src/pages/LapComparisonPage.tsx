import { useState, useEffect } from 'react';
import { compareLaps, getRaceStatus, listRaceIds, LapComparisonResponse, RaceStatus } from '@/lib/api';
import { LapComparisonCharts } from '@/components/LapComparisonCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { ChartSkeleton, KpiSkeleton, TrackMapSkeleton } from '@/components/ui/chart-skeletons';

/**
 * Skeleton layout matching the LapComparisonCharts structure.
 * Displayed while the comparison data is loading.
 */
function LapComparisonSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>

      {/* Segment analysis skeleton */}
      <ChartSkeleton height={200} />

      {/* Two-column layout skeleton */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Track map column */}
        <div className="w-full lg:w-[30%] order-first lg:order-last">
          <TrackMapSkeleton />
        </div>

        {/* Charts column */}
        <div className="w-full lg:w-[70%] space-y-4">
          <ChartSkeleton height={280} />
          <ChartSkeleton height={280} />
          <ChartSkeleton height={280} />
          <ChartSkeleton height={250} />
        </div>
      </div>

      {/* Corner analysis table skeleton */}
      <ChartSkeleton height={200} />
    </div>
  );
}

export function LapComparisonPage() {
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [raceStatus, setRaceStatus] = useState<RaceStatus | null>(null);
  const [lap1, setLap1] = useState<number>(1);
  const [lap2, setLap2] = useState<number>(2);
  const [comparisonData, setComparisonData] = useState<LapComparisonResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      const raceIds = await listRaceIds();
      setRaces(raceIds);
      if (raceIds.length > 0 && !selectedRace) {
        setSelectedRace(raceIds[0]);
      }
    } catch (err) {
      setError('Failed to load races');
    }
  };

  const loadRaceStatus = async (raceId: string) => {
    try {
      const status = await getRaceStatus(raceId);
      setRaceStatus(status);
    } catch (err) {
      setError('Failed to load race status');
    }
  };

  useEffect(() => {
    if (selectedRace) {
      loadRaceStatus(selectedRace);
    }
  }, [selectedRace]);

  const handleCompare = async () => {
    if (!selectedRace) return;

    setLoading(true);
    setError('');
    setComparisonData(null);

    try {
      const data = await compareLaps(selectedRace, lap1, lap2);
      setComparisonData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to compare laps');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-foreground">Lap Comparison</h1>
        <Button onClick={loadRaces} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Race Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Race & Laps</CardTitle>
          <CardDescription>Choose a race and two laps to compare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Race</label>
              <select
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                value={selectedRace}
                onChange={(e) => setSelectedRace(e.target.value)}
              >
                <option value="">Select race...</option>
                {races.map((raceId) => (
                  <option key={raceId} value={raceId}>
                    {raceId.substring(0, 8)}...
                  </option>
                ))}
              </select>
            </div>

            {raceStatus && (
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">Status</label>
                <div className={`px-3 py-2 rounded-md ${
                  raceStatus.status === 'Ready' ? 'bg-green-500/10 text-green-400 border border-green-500/30' :
                  raceStatus.status === 'Processing' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                  'bg-red-500/10 text-red-400 border border-red-500/30'
                }`}>
                  {raceStatus.status} ({raceStatus.laps_count} laps)
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Lap 1</label>
              <input
                type="number"
                min="1"
                max={raceStatus?.laps_count || 999}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                value={lap1}
                onChange={(e) => setLap1(parseInt(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">Lap 2</label>
              <input
                type="number"
                min="1"
                max={raceStatus?.laps_count || 999}
                className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground"
                value={lap2}
                onChange={(e) => setLap2(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleCompare}
              disabled={!selectedRace || loading || raceStatus?.status !== 'Ready'}
              className="w-full md:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Compare Laps
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loading skeleton */}
      {loading && <LapComparisonSkeleton />}

      {/* Comparison Results */}
      {comparisonData && !loading && (
        <LapComparisonCharts
          data={comparisonData}
          lap1Number={lap1}
          lap2Number={lap2}
        />
      )}

      {!comparisonData && !loading && (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-muted-foreground">
              Select a race and laps to compare telemetry data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
