import { useState, useEffect } from 'react';
import { listRaces, downloadRaceRaw, deleteRace, RaceInfo } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Download, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';

export function RaceListPage() {
  const [races, setRaces] = useState<RaceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    setLoading(true);
    setError('');
    try {
      const raceList = await listRaces();
      setRaces(raceList);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load races');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (raceId: string) => {
    setDownloadingId(raceId);
    try {
      const blob = await downloadRaceRaw(raceId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `race_${raceId.substring(0, 8)}.deflate`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to download race');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (raceId: string) => {
    if (!confirm(`Are you sure you want to delete race ${raceId.substring(0, 8)}...?`)) {
      return;
    }

    setDeletingId(raceId);
    try {
      await deleteRace(raceId);
      setRaces(races.filter(r => r.race_id !== raceId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete race');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Processing':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Failed':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Race Packages</h1>
        <Button onClick={loadRaces} variant="outline" size="icon" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-100 border border-red-300 rounded-md text-red-800">
          {error}
        </div>
      )}

      {loading && races.length === 0 ? (
        <Card className="bg-white border-gray-300">
          <CardContent className="py-12">
            <div className="flex justify-center items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Loading races...</span>
            </div>
          </CardContent>
        </Card>
      ) : races.length === 0 ? (
        <Card className="bg-white border-gray-300">
          <CardContent className="py-12">
            <p className="text-center text-gray-600">
              No races found. Upload a race to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {races.map((race) => (
            <Card key={race.race_id} className="bg-white border-gray-300">
              <CardContent className="py-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  {/* Race Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(race.status)}
                      <h3 className="font-mono text-lg font-semibold">
                        {race.race_id.substring(0, 8)}...
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-md border ${getStatusColor(race.status)}`}>
                        {race.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Laps:</span> {race.laps_count}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(race.created_at)}
                      </div>
                      <div>
                        <span className="font-medium">Updated:</span> {formatDate(race.updated_at)}
                      </div>
                      <div>
                        <span className="font-medium">Data:</span>{' '}
                        {race.raw_data_path ? 'Available' : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(race.race_id)}
                      disabled={!race.raw_data_path || downloadingId === race.race_id}
                    >
                      {downloadingId === race.race_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span className="ml-2">Download</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(race.race_id)}
                      disabled={deletingId === race.race_id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === race.race_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      <span className="ml-2">Delete</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Card */}
      {races.length > 0 && (
        <Card className="mt-6 bg-white border-gray-300">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Overview of all race packages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Races</p>
                <p className="text-2xl font-bold">{races.length}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-green-500">
                  {races.filter(r => r.status === 'Ready').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {races.filter(r => r.status === 'Processing').length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-500">
                  {races.filter(r => r.status === 'Failed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
