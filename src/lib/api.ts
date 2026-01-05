import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
