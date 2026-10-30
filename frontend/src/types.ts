export interface Metrics {
  count: number;
  expected_count: number;
  coverage_pct: number;
  mae_mw: number | null;
  rmse_mw: number | null;
  bias_mw: number | null;
  wape_pct: number | null;
  forecast_energy_mwh: number | null;
  actual_energy_mwh: number | null;
  energy_error_mwh: number | null;
  overforecast_hours: number;
  underforecast_hours: number;
}
export interface Slot {
  start_time: string;
  forecast_mw: number | null;
  actual_mw: number | null;
  publish_time: string | null;
  error_mw: number | null;
  actual_half_hours: number;
}
export interface Dashboard {
  decision_date: string;
  delivery_date: string;
  cutoff: string;
  cutoff_timestamp: string;
  timezone: string;
  resolution_minutes: number;
  series: Slot[];
  metrics: Metrics;
  forecast_coverage_pct: number;
  latest_publish_time: string | null;
  oldest_publish_time: string | null;
  forecast_total_mwh: number | null;
  actual_total_mwh: number | null;
  notes: string[];
  provenance: unknown;
}
export interface Analysis {
  start: string;
  end: string;
  cutoff: string;
  resolution_minutes: number;
  metrics: Metrics;
  daily: {
    decision_date: string;
    delivery_date: string;
    metrics: Metrics;
    forecast_coverage_pct: number;
  }[];
  notes: string[];
  provenance: unknown;
}
