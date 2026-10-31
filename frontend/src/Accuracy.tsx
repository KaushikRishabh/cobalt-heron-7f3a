import { BarChart3, ChevronRight } from "lucide-react";
import type { Analysis } from "./types";
import { number, shortDate } from "./utils";
import Metric from "./Metric";
export default function Accuracy({ data }: { data: Analysis }) {
  const m = data.metrics;
  return (
    <>
      <div className="decision-strip analysis-strip">
        <BarChart3 size={23} />
        <div>
          <strong>Historical evaluation · not a live risk guarantee</strong>
          <p>
            Each delivery hour uses the latest forecast available at{" "}
            {data.cutoff} GMT on the previous day.
          </p>
        </div>
        <span className="pill">
          {number(m.count)} / {number(m.expected_count)} matched hours
        </span>
      </div>
      <div className="metric-grid">
        <Metric
          label="Mean absolute error"
          value={number(m.mae_mw)}
          unit="MW"
          detail="Typical error magnitude, regardless of direction"
          accent
        />
        <Metric
          label="Root mean squared error"
          value={number(m.rmse_mw)}
          unit="MW"
          detail="Gives larger misses more weight"
        />
        <Metric
          label="Forecast bias"
          value={number(m.bias_mw)}
          unit="MW"
          detail="Positive = too much wind forecast"
        />
        <Metric
          label="Matched coverage"
          value={number(m.coverage_pct, 1)}
          unit="%"
          detail="Requires a forecast and both actual half-hours"
        />
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <div className="eyebrow">ERROR THROUGH THE MONTH</div>
            <h2>How did each decision day perform?</h2>
            <p>Mean absolute error by purchase-decision date · MW</p>
          </div>
          <span className="legend">
            <i /> Daily MAE
          </span>
        </div>
        <div
          className="bar-chart"
          role="img"
          aria-label="Daily mean absolute error. Exact values are in the table below."
        >
          {data.daily.map((d) => (
            <div className="bar-column" key={d.decision_date}>
              <div className="bar-space">
                <div
                  className={`bar ${d.metrics.mae_mw === null ? "missing" : ""}`}
                  style={{
                    height:
                      d.metrics.mae_mw === null
                        ? "3px"
                        : `${Math.max(2, (d.metrics.mae_mw / Math.max(1, ...data.daily.map((x) => x.metrics.mae_mw ?? 0))) * 100)}%`,
                  }}
                >
                  <span>
                    {shortDate(d.decision_date)}: {number(d.metrics.mae_mw)} MW
                  </span>
                </div>
              </div>
              <small>{d.decision_date.slice(8)}</small>
            </div>
          ))}
        </div>
        <div className="chart-caption">
          <span>Missing days are not treated as zero error.</span>
          <span>Decision date · January 2026</span>
        </div>
      </section>
      <div className="bottom-grid">
        <section className="panel explanation">
          <div className="eyebrow">DIRECTION MATTERS</div>
          <h2>
            {m.bias_mw == null
              ? "Not enough matched data"
              : m.bias_mw > 0
                ? "Wind was over-forecast on average."
                : m.bias_mw < 0
                  ? "Wind was under-forecast on average."
                  : "Average signed error was zero."}
          </h2>
          <p>
            Bias is forecast minus actual. Positive errors mean less wind
            arrived than expected; negative errors mean more arrived. A small
            average bias can hide large errors in both directions.
          </p>
          <div className="mini-stats">
            <div>
              <strong>{number(m.overforecast_hours)}</strong>
              <span>over-forecast hours</span>
            </div>
            <div>
              <strong>{number(m.underforecast_hours)}</strong>
              <span>under-forecast hours</span>
            </div>
            <div>
              <strong>{number(m.wape_pct, 1)}%</strong>
              <span>weighted absolute error</span>
            </div>
          </div>
        </section>
        <section className="panel explanation">
          <div className="eyebrow">EVALUATION BOUNDARIES</div>
          <h2>Comparable hours. Visible limitations.</h2>
          <p>
            Hourly WINDFOR values are compared with the mean of the two
            corresponding FUELHH actuals. Incomplete pairs are excluded, not
            filled.
          </p>
          <p>
            Energy error is <strong>{number(m.energy_error_mwh)} MWh</strong>{" "}
            across matched hours only. This is a retrospective pilot: January
            errors must not be presented as advance knowledge for January
            decisions.
          </p>
        </section>
      </div>
      <details className="panel interval-table">
        <summary>
          View daily accuracy and coverage <ChevronRight size={16} />
        </summary>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Decision date</th>
                <th>Delivery date</th>
                <th>MAE (MW)</th>
                <th>RMSE (MW)</th>
                <th>Bias (MW)</th>
                <th>Matched coverage</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.map((d) => (
                <tr key={d.decision_date}>
                  <td>{shortDate(d.decision_date)}</td>
                  <td>{shortDate(d.delivery_date)}</td>
                  <td>{number(d.metrics.mae_mw)}</td>
                  <td>{number(d.metrics.rmse_mw)}</td>
                  <td>{number(d.metrics.bias_mw)}</td>
                  <td>{number(d.metrics.coverage_pct)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
