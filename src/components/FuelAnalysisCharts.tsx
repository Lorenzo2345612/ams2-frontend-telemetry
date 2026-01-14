import { SingleLapFuelResponse, FuelComparisonResponse } from '@/lib/api';
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
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { formatTime } from '@/lib/utils';

interface SingleLapProps {
  data: SingleLapFuelResponse;
  lapNumber: number;
}

export function SingleLapFuelCharts({ data, lapNumber }: SingleLapProps) {
  // Prepare data for fuel curve chart
  const fuelCurveData = data.fuel_curve.distance.map((distance, idx) => ({
    distance: distance,
    fuel_liters: data.fuel_curve.fuel_liters[idx],
    fuel_percentage: data.fuel_curve.fuel_percentage[idx] * 100,
  }));

  // Generate X-axis ticks in 500m intervals
  const maxDistance = Math.max(...data.fuel_curve.distance);
  const xAxisTicks = [];
  for (let i = 0; i <= maxDistance; i += 500) {
    xAxisTicks.push(i);
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Analysis - Lap {lapNumber}</CardTitle>
          <CardDescription>
            Fuel consumption and efficiency metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Lap Time</p>
              <p className="text-2xl font-bold">{formatTime(data.summary.lap_time)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fuel Used</p>
              <p className="text-2xl font-bold text-orange-500">
                {data.summary.fuel_used.toFixed(2)} L
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Consumption Rate</p>
              <p className="text-2xl font-bold">
                {data.summary.consumption_rate_per_km.toFixed(3)} L/km
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Est. Laps Remaining</p>
              <p className="text-2xl font-bold text-blue-500">
                {data.summary.estimated_laps_remaining.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fuel Start</p>
              <p className="text-xl font-bold">{data.summary.fuel_start.toFixed(2)} L</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fuel End</p>
              <p className="text-xl font-bold">{data.summary.fuel_end.toFixed(2)} L</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tank Capacity</p>
              <p className="text-xl font-bold">{data.summary.fuel_capacity.toFixed(0)} L</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lap Distance</p>
              <p className="text-xl font-bold">{data.summary.lap_distance_km.toFixed(2)} km</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Remaining Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Remaining</CardTitle>
          <CardDescription>
            Fuel level (liters) over lap distance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={fuelCurveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Fuel (L)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${value.toFixed(2)} L`}
              />
              <Area
                type="monotone"
                dataKey="fuel_liters"
                stroke="#f97316"
                fill="#fed7aa"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fuel Percentage Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Level Percentage</CardTitle>
          <CardDescription>
            Fuel level (%) over lap distance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={fuelCurveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Fuel (%)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Area
                type="monotone"
                dataKey="fuel_percentage"
                stroke="#3b82f6"
                fill="#bfdbfe"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fuel vs Speed Scatter Plot */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Consumption vs Speed</CardTitle>
          <CardDescription>
            Fuel consumed per segment at different speeds (bubble size = throttle)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                type="number"
                dataKey="speed"
                name="Speed"
                label={{ value: 'Speed (km/h)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
              />
              <YAxis
                type="number"
                dataKey="fuel_consumed"
                name="Fuel"
                label={{ value: 'Fuel Consumed (L)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
              />
              <ZAxis
                type="number"
                dataKey="throttle"
                range={[50, 400]}
                name="Throttle"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Speed') return `${value.toFixed(1)} km/h`;
                  if (name === 'Fuel') return `${value.toFixed(4)} L`;
                  if (name === 'Throttle') return `${(value * 100).toFixed(0)}%`;
                  return value;
                }}
              />
              <Legend />
              <Scatter
                name="Fuel vs Speed"
                data={data.fuel_speed_scatter.speed.map((speed, idx) => ({
                  speed,
                  fuel_consumed: data.fuel_speed_scatter.fuel_consumed[idx],
                  throttle: data.fuel_speed_scatter.throttle[idx],
                  gear: data.fuel_speed_scatter.gear[idx],
                }))}
                fill="#f97316"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

interface ComparisonProps {
  data: FuelComparisonResponse;
  lap1Number: number;
  lap2Number: number;
}

export function FuelComparisonCharts({ data, lap1Number, lap2Number }: ComparisonProps) {
  // Prepare data for fuel delta chart
  const deltaData = data.fuel_delta.distance.map((distance, idx) => ({
    distance: distance,
    delta: data.fuel_delta.delta[idx],
  }));

  // Prepare data for fuel curves comparison
  const curvesData = data.fuel_curves.distance.map((distance, idx) => ({
    distance: distance,
    lap1: data.fuel_curves.lap_1_fuel[idx],
    lap2: data.fuel_curves.lap_2_fuel[idx],
  }));

  // Generate X-axis ticks in 500m intervals
  const maxDistance = Math.max(...data.fuel_delta.distance);
  const xAxisTicks = [];
  for (let i = 0; i <= maxDistance; i += 500) {
    xAxisTicks.push(i);
  }

  const moreEfficient = data.summary.more_efficient_lap;
  const efficiencyDiff = Math.abs(data.summary.fuel_delta);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Comparison Summary</CardTitle>
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
              <p className="text-sm text-muted-foreground">More Efficient</p>
              <p className="text-2xl font-bold text-green-500">
                Lap {moreEfficient}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fuel Saved</p>
              <p className="text-2xl font-bold text-green-500">
                {efficiencyDiff.toFixed(3)} L
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lap {lap1Number} Fuel Used</p>
              <p className="text-xl font-bold text-orange-500">
                {data.summary.lap_1_fuel_used.toFixed(2)} L
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Lap {lap2Number} Fuel Used</p>
              <p className="text-xl font-bold text-orange-500">
                {data.summary.lap_2_fuel_used.toFixed(2)} L
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">L{lap1Number} Rate (L/km)</p>
              <p className="text-xl font-bold">
                {data.summary.lap_1_consumption_rate.toFixed(3)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">L{lap2Number} Rate (L/km)</p>
              <p className="text-xl font-bold">
                {data.summary.lap_2_consumption_rate.toFixed(3)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fuel Delta Chart */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Consumption Delta</CardTitle>
          <CardDescription>
            Positive = Lap {lap2Number} used more fuel | Negative = Lap {lap2Number} more efficient
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
                label={{ value: 'Delta (L)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${value > 0 ? '+' : ''}${value.toFixed(3)} L`}
              />
              <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
              <Line
                type="monotone"
                dataKey="delta"
                stroke="#f97316"
                dot={false}
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fuel Curves Comparison */}
      <Card className="bg-white border-gray-300">
        <CardHeader>
          <CardTitle>Fuel Remaining Comparison</CardTitle>
          <CardDescription>
            Fuel level comparison over lap distance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={curvesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="distance"
                label={{ value: 'Distance (m)', position: 'insideBottom', offset: -5 }}
                stroke="#000"
                ticks={xAxisTicks}
              />
              <YAxis
                label={{ value: 'Fuel (L)', angle: -90, position: 'insideLeft' }}
                stroke="#000"
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #d1d5db' }}
                formatter={(value: number) => `${value.toFixed(2)} L`}
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
    </div>
  );
}
