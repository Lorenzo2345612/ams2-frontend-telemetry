import { LapComparisonResponse } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatDelta, formatTime } from '@/lib/utils';

interface Props {
  data: LapComparisonResponse;
  lap1Number: number;
  lap2Number: number;
}

export function LapComparisonCharts({ data, lap1Number, lap2Number }: Props) {
  // Prepare data for delta time chart
  const deltaData = data.delta_time.distance.map((distance, idx) => ({
    distance: distance,
    delta: data.delta_time.delta[idx],
  }));

  // Prepare data for speed chart
  const speedData = data.speed.distance.map((distance, idx) => ({
    distance: distance,
    lap1: data.speed.lap_1[idx],
    lap2: data.speed.lap_2[idx],
  }));

  // Prepare data for inputs chart (throttle, brake, steering)
  const inputsData = data.throttle.distance.map((distance, idx) => ({
    distance: distance,
    throttle1: data.throttle.lap_1[idx],
    throttle2: data.throttle.lap_2[idx],
    brake1: data.brake.lap_1[idx],
    brake2: data.brake.lap_2[idx],
  }));

  const steeringData = data.steering.distance.map((distance, idx) => ({
    distance: distance,
    lap1: data.steering.lap_1[idx],
    lap2: data.steering.lap_2[idx],
  }));

  // Generate X-axis ticks in 200m intervals
  const maxDistance = Math.max(...data.delta_time.distance);
  const xAxisTicks = [];
  for (let i = 0; i <= maxDistance; i += 200) {
    xAxisTicks.push(i);
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Lap Comparison Summary</CardTitle>
          <CardDescription>
            Lap {lap1Number} vs Lap {lap2Number}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Lap {lap1Number} Time</p>
              <p className="text-2xl font-bold">{formatTime(data.summary.lap_1_time)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lap {lap2Number} Time</p>
              <p className="text-2xl font-bold">{formatTime(data.summary.lap_2_time)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Final Delta</p>
              <p className={`text-2xl font-bold ${data.summary.delta_final < 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatDelta(data.summary.delta_final)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Best Gain</p>
              <p className="text-2xl font-bold text-green-500">
                {formatDelta(data.summary.delta_min)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Speed (L{lap1Number})</p>
              <p className="text-xl font-bold">{data.summary.max_speed_lap_1.toFixed(1)} km/h</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Max Speed (L{lap2Number})</p>
              <p className="text-xl font-bold">{data.summary.max_speed_lap_2.toFixed(1)} km/h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delta Time Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Delta Time</CardTitle>
          <CardDescription>
            Positive values = Lap {lap2Number} slower | Negative values = Lap {lap2Number} faster
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={deltaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Delta (s)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => formatDelta(value)}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="delta"
                stroke="#60a5fa"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Speed Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Speed Comparison</CardTitle>
          <CardDescription>Speed (km/h) over distance</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={speedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${value.toFixed(1)} km/h`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="lap1"
                stroke="#8b5cf6"
                name={`Lap ${lap1Number}`}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="lap2"
                stroke="#f59e0b"
                name={`Lap ${lap2Number}`}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Throttle Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Throttle Input</CardTitle>
          <CardDescription>Throttle application comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inputsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Throttle (0-1)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
                domain={[0, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="throttle1"
                stroke="#10b981"
                name={`Lap ${lap1Number}`}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="throttle2"
                stroke="#34d399"
                name={`Lap ${lap2Number}`}
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Brake Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Brake Input</CardTitle>
          <CardDescription>Brake application comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={inputsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Brake (0-1)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
                domain={[0, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="brake1"
                stroke="#ef4444"
                name={`Lap ${lap1Number}`}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="brake2"
                stroke="#f87171"
                name={`Lap ${lap2Number}`}
                dot={false}
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Steering Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Steering Input</CardTitle>
          <CardDescription>Steering angle comparison</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={steeringData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Steering (-1 to 1)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
                domain={[-1, 1]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
              />
              <Legend />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="lap1"
                stroke="#f59e0b"
                name={`Lap ${lap1Number}`}
                dot={false}
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="lap2"
                stroke="#062cd4"
                name={`Lap ${lap2Number}`}
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
