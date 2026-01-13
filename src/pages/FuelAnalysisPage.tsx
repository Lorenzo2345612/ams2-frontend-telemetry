import { useState, useEffect } from 'react';
import { analyzeLapFuel, getRaceStatus, listRaceIds, SingleLapFuelResponse, RaceStatus } from '@/lib/api';
import { SingleLapFuelCharts } from '@/components/FuelAnalysisCharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

export function FuelAnalysisPage() {
  const [races, setRaces] = useState<string[]>([]);
  const [selectedRace, setSelectedRace] = useState<string>('');
  const [raceStatus, setRaceStatus] = useState<RaceStatus | null>(null);
  const [lapNumber, setLapNumber] = useState<number>(1);
  const [fuelData, setFuelData] = useState<SingleLapFuelResponse | null>(null);
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

  const handleAnalyze = async () => {
    if (!selectedRace) return;

    setLoading(true);
    setError('');
    setFuelData(null);

    try {
      const data = await analyzeLapFuel(selectedRace, lapNumber);
      setFuelData(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to analyze fuel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Fuel Analysis</h1>
        <Button onClick={loadRaces} variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Race Selection */}
      <Card className="mb-6 bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Select Race & Lap</CardTitle>
          <CardDescription>Choose a race and lap to analyze fuel consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium mb-2">Lap Number</label>
              <input
                type="number"
                min="1"
                max={raceStatus?.laps_count || 999}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-black"
                value={lapNumber}
                onChange={(e) => setLapNumber(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleAnalyze}
              disabled={!selectedRace || loading || raceStatus?.status !== 'Ready'}
              className="w-full md:w-auto"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Fuel
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fuel Analysis Results */}
      {fuelData && (
        <SingleLapFuelCharts
          data={fuelData}
          lapNumber={lapNumber}
        />
      )}

      {!fuelData && !loading && (
        <Card className="bg-white border-gray-300">
          <CardContent className="py-12">
            <p className="text-center text-gray-600">
              Select a race and lap to analyze fuel consumption
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
