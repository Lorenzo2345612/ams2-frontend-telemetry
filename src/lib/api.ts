import axios from 'axios';

const API_BASE_URL = "https://api-production-9f0e.up.railway.app"

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface RaceStatus {
  race_id: string;
  status: 'Processing' | 'Ready' | 'Failed';
  created_at: string;
  updated_at: string;
  raw_data_path: string;
  laps_count: number;
}

export interface LapSummary {
  lap_1_time: number;
  lap_2_time: number;
  delta_final: number;
  delta_min: number;
  delta_max: number;
  delta_min_position: number;
  delta_max_position: number;
  max_speed_lap_1: number;
  max_speed_lap_2: number;
}

export interface TelemetryTimeSeries {
  distance: number[];
  lap_1: number[];
  lap_2: number[];
}

export interface DeltaTimeSeries {
  distance: number[];
  delta: number[];
}

export interface LapComparisonResponse {
  summary: LapSummary;
  delta_time: DeltaTimeSeries;
  speed: TelemetryTimeSeries;
  throttle: TelemetryTimeSeries;
  brake: TelemetryTimeSeries;
  steering: TelemetryTimeSeries;
}

export const uploadRace = async (base64Data: string) => {
  const response = await api.post('/race/upload', {
    data: base64Data,
  });
  return response.data;
};

export const getRaceStatus = async (raceId: string): Promise<RaceStatus> => {
  const response = await api.get(`/race/${raceId}/status`);
  return response.data;
};

export const listRaceIds = async (): Promise<string[]> => {
  const response = await api.get('/race/list_ids');
  return response.data;
};

export const compareLaps = async (
  raceId: string,
  lap1: number,
  lap2: number
): Promise<LapComparisonResponse> => {
  const response = await api.get(`/race/${raceId}/compare/${lap1}/${lap2}`);
  return response.data;
};

// Fuel Analysis Types
export interface FuelSummary {
  lap_number: number;
  lap_time: number;
  fuel_capacity: number;
  fuel_start: number;
  fuel_end: number;
  fuel_used: number;
  consumption_rate_per_km: number;
  lap_distance_km: number;
  estimated_laps_remaining: number;
}

export interface FuelCurve {
  distance: number[];
  fuel_liters: number[];
  fuel_percentage: number[];
}

export interface FuelSpeedScatter {
  speed: number[];
  fuel_consumed: number[];
  throttle: number[];
  gear: number[];
}

export interface FuelThrottleScatter {
  throttle: number[];
  fuel_consumed: number[];
  speed: number[];
  gear: number[];
}

export interface FuelTrackMap {
  pos_x: number[];
  pos_z: number[];
  fuel_consumed: number[];
  fuel_normalized: number[];
}

export interface SingleLapFuelResponse {
  summary: FuelSummary;
  fuel_curve: FuelCurve;
  fuel_speed_scatter: FuelSpeedScatter;
  fuel_throttle_scatter: FuelThrottleScatter;
  fuel_track_map: FuelTrackMap;
}

export interface FuelComparisonSummary {
  lap_1_number: number;
  lap_2_number: number;
  lap_1_time: number;
  lap_2_time: number;
  lap_1_fuel_used: number;
  lap_2_fuel_used: number;
  fuel_delta: number;
  lap_1_consumption_rate: number;
  lap_2_consumption_rate: number;
  consumption_rate_delta: number;
  more_efficient_lap: number;
}

export interface FuelDeltaSeries {
  distance: number[];
  delta: number[];
}

export interface FuelComparisonCurves {
  distance: number[];
  lap_1_fuel: number[];
  lap_2_fuel: number[];
}

export interface FuelComparisonResponse {
  summary: FuelComparisonSummary;
  fuel_delta: FuelDeltaSeries;
  fuel_curves: FuelComparisonCurves;
}

// Fuel Analysis API Functions
export const analyzeLapFuel = async (
  raceId: string,
  lapNumber: number
): Promise<SingleLapFuelResponse> => {
  const response = await api.get(`/race/${raceId}/fuel/${lapNumber}`);
  return response.data;
};

export const compareLapFuel = async (
  raceId: string,
  lap1: number,
  lap2: number
): Promise<FuelComparisonResponse> => {
  const response = await api.get(`/race/${raceId}/fuel/compare/${lap1}/${lap2}`);
  return response.data;
};

// Race Management Types
export interface RaceInfo {
  race_id: string;
  status: 'Processing' | 'Ready' | 'Failed';
  created_at: string;
  updated_at: string;
  laps_count: number;
  raw_data_path: string | null;
}

export interface RaceDownload {
  race_id: string;
  status: string;
  size_bytes: number;
  data: string;
}

// Race Management API Functions
export const listRaces = async (): Promise<RaceInfo[]> => {
  const response = await api.get('/race/list');
  return response.data;
};

export const downloadRace = async (raceId: string): Promise<RaceDownload> => {
  const response = await api.get(`/race/${raceId}/download`);
  return response.data;
};

export const downloadRaceRaw = async (raceId: string): Promise<Blob> => {
  const response = await api.get(`/race/${raceId}/download/raw`, {
    responseType: 'blob',
  });
  return response.data;
};

export const deleteRace = async (raceId: string): Promise<void> => {
  await api.delete(`/race/${raceId}`);
};
