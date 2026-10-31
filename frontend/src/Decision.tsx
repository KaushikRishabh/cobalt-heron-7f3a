import {
  ShieldCheck,
  CheckCircle2,
  Info,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
import type { Dashboard } from "./types";
import { number, shortDate, timestamp } from "./utils";
import Metric from "./Metric";
import Chart from "./Chart";
export default function Decision({
  data,
  showActual,
  setShowActual,
}: {
  data: Dashboard;
  showActual: boolean;
  setShowActual: (v: boolean) => void;
}) {
  const known = data.series.flatMap((s) =>
    s.forecast_mw === null ? [] : [s.forecast_mw],
  );
  const average = known.length
    ? known.reduce((a, b) => a + b, 0) / known.length
    : null;
  const peak = known.length ? Math.max(...known) : null;
  const peakSlot =
    peak === null ? undefined : data.series.find((s) => s.forecast_mw === peak);
  return (
    <>
      <div className="decision-strip">
        <div className="strip-icon">
          <ShieldCheck size={22} />
        </div>
        <div>
          <strong>Only what was known at the decision cutoff</strong>
          <p>
            Forecast publications after {data.cutoff} GMT on{" "}
            {shortDate(data.decision_date)} are excluded.
          </p>
        </div>
        <span
          className={`pill ${data.forecast_coverage_pct < 100 ? "warning" : ""}`}
        >
          {data.forecast_coverage_pct === 100 ? (
            <CheckCircle2 size={14} />
          ) : (
            <Info size={14} />
          )}{" "}
          {number(data.forecast_coverage_pct)}% forecast coverage
        </span>
      </div>
      <div className="metric-grid">
        <Metric
          label="Forecast wind energy"
          value={number(
            data.forecast_total_mwh == null
              ? null
              : data.forecast_total_mwh / 1000,
            1,
          )}
          unit="GWh"
          detail={
            data.forecast_coverage_pct === 100
              ? "Across the full delivery day"
              : "Known hours only · incomplete day"
          }
          accent
        />
        <Metric
          label="Average wind generation"
          value={number(average)}
          unit="MW"
          detail={`${known.length} of ${data.series.length} delivery hours available`}
        />
        <Metric
          label="Peak forecast"
          value={number(peak)}
          unit="MW"
          detail={
            peakSlot
              ? `At ${peakSlot.start_time.slice(11, 16)} GMT on delivery day`
              : "No eligible forecast available"
          }
        />
        <Metric
          label="Latest selected publication"
          value={
            data.latest_publish_time
              ? data.latest_publish_time.slice(11, 16)
              : "—"
          }
          unit="GMT"
          detail={
            data.latest_publish_time
              ? `${timestamp(data.latest_publish_time).split(",")[0]} · see per-hour provenance`
              : "No publication at or before cutoff"
          }
        />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">DELIVERY PROFILE</div>
            <h2>Wind available for the day ahead</h2>
            <p>{shortDate(data.delivery_date)} 2026 · hourly generation · MW</p>
          </div>
          <div className="chart-actions">
            <span className="legend">
              <i /> Forecast
            </span>
            {showActual && (
              <span className="legend actual">
                <i /> Actual
              </span>
            )}
            <label className="toggle">
              <input
                type="checkbox"
                checked={showActual}
                onChange={(e) => setShowActual(e.target.checked)}
              />
              <span /> Show retrospective actuals
            </label>
          </div>
        </div>
        {showActual && (
          <div className="retrospective">
            <Info size={16} /> Actuals are hindsight, not information available
            for this purchase decision.
          </div>
        )}
        <Chart series={data.series} actual={showActual} />
      </section>
      <div className="bottom-grid">
        <section className="panel explanation">
          <div className="eyebrow">HOW TO READ THIS</div>
          <h2>A wind outlook, not a purchase order.</h2>
          <p>
            Use the forecast to understand the national wind contribution.
            Portfolio demand, contracted generation and market prices are
            outside this pilot’s scope.
          </p>
          <div className="inline-note">
            <ArrowUpRight size={19} />
            <span>
              Over-forecasting wind can leave a buyer short of energy. Review
              historical error before relying on the forecast.
            </span>
          </div>
        </section>
        <section className="panel provenance">
          <div className="eyebrow">AUDIT TRAIL</div>
          <h2>Trace every forecast to its issue time</h2>
          <dl>
            <div>
              <dt>Decision snapshot</dt>
              <dd>{timestamp(data.cutoff_timestamp)} GMT</dd>
            </div>
            <div>
              <dt>Selected publications</dt>
              <dd>
                {timestamp(data.oldest_publish_time)} —{" "}
                {timestamp(data.latest_publish_time)}
              </dd>
            </div>
            <div>
              <dt>Source datasets</dt>
              <dd>WINDFOR · FUELHH (WIND)</dd>
            </div>
            <div>
              <dt>Time alignment</dt>
              <dd>
                {data.resolution_minutes}-minute targets · no interpolation
              </dd>
            </div>
          </dl>
        </section>
      </div>
      <details className="panel interval-table">
        <summary>
          Inspect hourly values and publication timestamps{" "}
          <ChevronRight size={16} />
        </summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Delivery hour (GMT)</th>
                <th>Forecast (MW)</th>
                <th>Published (GMT)</th>
                {showActual && (
                  <>
                    <th>Actual (MW)</th>
                    <th>Error (MW)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.series.map((s) => (
                <tr key={s.start_time}>
                  <td>{s.start_time.slice(11, 16)}</td>
                  <td>{number(s.forecast_mw)}</td>
                  <td>{timestamp(s.publish_time)}</td>
                  {showActual && (
                    <>
                      <td>{number(s.actual_mw)}</td>
                      <td>{number(s.error_mw)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
