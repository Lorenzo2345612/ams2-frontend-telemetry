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
  ReferenceDot,
  Label,
} from 'recharts';

// Helper function to get color based on delta value (-1 = green, 0 = grey, 1 = red)
const getTrackColor = (colorValue: number): string => {
  if (colorValue > 0) return '#ef4444'; // Red for time loss
  if (colorValue < 0) return '#22c55e'; // Green for time gain
  return '#9ca3af'; // Grey for neutral
};

// Helper to create line segments grouped by consecutive color
interface TrackSegment {
  points: { pos_x: number; pos_z: number }[];
  color: string;
}

const createTrackSegments = (
  posX: number[],
  posZ: number[],
  colorValues: number[]
): TrackSegment[] => {
  const segments: TrackSegment[] = [];
  if (posX.length === 0) return segments;

  let currentColor = getTrackColor(colorValues[0]);
  let currentPoints: { pos_x: number; pos_z: number }[] = [{ pos_x: posX[0], pos_z: posZ[0] }];

  for (let i = 1; i < posX.length; i++) {
    const color = getTrackColor(colorValues[i]);
    if (color === currentColor) {
      currentPoints.push({ pos_x: posX[i], pos_z: posZ[i] });
    } else {
      // Add last point to current segment for continuity
      currentPoints.push({ pos_x: posX[i], pos_z: posZ[i] });
      segments.push({ points: currentPoints, color: currentColor });
      // Start new segment with current point
      currentColor = color;
      currentPoints = [{ pos_x: posX[i], pos_z: posZ[i] }];
    }
  }
  // Push the last segment
  if (currentPoints.length > 0) {
    segments.push({ points: currentPoints, color: currentColor });
  }

  return segments;
};
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

      {/* Segment Analysis Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Top Time Gain/Loss Segments</CardTitle>
          <CardDescription>
            Non-overlapping segments where Lap {lap2Number} gains or loses the most time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Loss Segments */}
            <div>
              <h3 className="text-lg font-semibold text-red-600 mb-3">Time Lost</h3>
              <div className="space-y-2">
                {data.segment_analysis.time_loss_segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium">
                          {(segment.start_distance / 1000).toFixed(2)}km - {(segment.end_distance / 1000).toFixed(2)}km
                        </p>
                        <p className="text-xs text-gray-500">
                          {segment.start_distance.toFixed(0)}m - {segment.end_distance.toFixed(0)}m ({(segment.end_distance - segment.start_distance).toFixed(0)}m)
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-red-600">
                      {formatDelta(segment.time_delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Gain Segments */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3">Time Gained</h3>
              <div className="space-y-2">
                {data.segment_analysis.time_gain_segments.map((segment, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-500">#{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium">
                          {(segment.start_distance / 1000).toFixed(2)}km - {(segment.end_distance / 1000).toFixed(2)}km
                        </p>
                        <p className="text-xs text-gray-500">
                          {segment.start_distance.toFixed(0)}m - {segment.end_distance.toFixed(0)}m ({(segment.end_distance - segment.start_distance).toFixed(0)}m)
                        </p>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      {formatDelta(segment.time_delta)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Track Map - Delta Visualization */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Track Map - Time Delta</CardTitle>
          <CardDescription>
            Green = Lap {lap2Number} gaining time | Red = Lap {lap2Number} losing time | Grey = Neutral | Numbered markers = Corners
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <XAxis
                type="number"
                dataKey="pos_x"
                stroke="#000"
                domain={['auto', 'auto']}
                hide
              />
              <YAxis
                type="number"
                dataKey="pos_z"
                stroke="#000"
                domain={['auto', 'auto']}
                hide
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
              />
              {createTrackSegments(
                data.delta_track_map.pos_x,
                data.delta_track_map.pos_z,
                data.delta_track_map.color_value
              ).map((segment, idx) => (
                <Line
                  key={`segment-${idx}`}
                  type="linear"
                  data={segment.points}
                  dataKey="pos_z"
                  stroke={segment.color}
                  strokeWidth={3}
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
              ))}
              {data.delta_track_map.corners.map((corner) => (
                <ReferenceDot
                  key={`corner-${corner.corner_number}`}
                  x={corner.pos_x}
                  y={corner.pos_z}
                  r={12}
                  fill="#1e40af"
                  stroke="#fff"
                  strokeWidth={2}
                >
                  <Label
                    value={`${corner.corner_number}`}
                    position="center"
                    fill="#fff"
                    fontSize={10}
                    fontWeight="bold"
                  />
                </ReferenceDot>
              ))}
            </LineChart>
          </ResponsiveContainer>
          {/* Color legend */}
          <div className="flex justify-center mt-4 gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#22c55e' }} />
              <span className="text-sm">Gaining Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9ca3af' }} />
              <span className="text-sm">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-sm">Losing Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#1e40af' }}>1</div>
              <span className="text-sm">Corner</span>
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
