import { useState, useEffect } from 'react';
import { compareLaps, getRaceStatus, listRaceIds, LapComparisonResponse } from './lib/api';
import { LapComparisonCharts } from './components/LapComparisonCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

function App() {
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [raceStatus, setRaceStatus] = useState<any>(null);
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
    <div className="min-h-screen bg-white text-black">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">AMS2 Telemetry Analysis</h1>
          <Button onClick={loadRaces} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Race Selection */}
        <Card className="mb-6 bg-white border-gray-300">
          <CardHeader>
            <CardTitle>Select Race & Laps</CardTitle>
            <CardDescription>Choose a race and two laps to compare</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Race</label>
                <select
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
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
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <div className={`px-3 py-2 rounded-md ${
                    raceStatus.status === 'Ready' ? 'bg-green-100 text-green-800 border border-green-300' :
                    raceStatus.status === 'Processing' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                    'bg-red-100 text-red-800 border border-red-300'
                  }`}>
                    {raceStatus.status} ({raceStatus.laps_count} laps)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Lap 1</label>
                <input
                  type="number"
                  min="1"
                  max={raceStatus?.laps_count || 999}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                  value={lap1}
                  onChange={(e) => setLap1(parseInt(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Lap 2</label>
                <input
                  type="number"
                  min="1"
                  max={raceStatus?.laps_count || 999}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
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
              <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {comparisonData && (
          <LapComparisonCharts
            data={comparisonData}
            lap1Number={lap1}
            lap2Number={lap2}
          />
        )}

        {!comparisonData && !loading && (
          <Card className="bg-white border-gray-300">
            <CardContent className="py-12">
              <p className="text-center text-gray-600">
                Select a race and laps to compare telemetry data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
