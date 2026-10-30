import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  ChevronRight,
  Clock3,
  Database,
  Info,
  LoaderCircle,
  RefreshCw,
  Wind,
} from "lucide-react";
import type { Analysis, Dashboard } from "./types";
import { downloadCsv, shortDate } from "./utils";
import useResource from "./useResource";
import Decision from "./Decision";
import Accuracy from "./Accuracy";
export default function App() {
  const [tab, setTab] = useState<"decision" | "accuracy">("decision");
  const [date, setDate] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState("09:45");
  const [start, setStart] = useState("2026-01-01");
  const [end, setEnd] = useState("2026-01-31");
  const [showActual, setShowActual] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const invalidCutoff = !/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoff);
  const invalid =
    invalidCutoff ||
    (tab === "decision"
      ? date < "2026-01-01" || date > "2026-01-31"
      : start < "2026-01-01" ||
        end > "2026-01-31" ||
        start > end ||
        !start ||
        !end);
  const query =
    tab === "decision"
      ? `dashboard?decision_date=${date}&cutoff=${cutoff}`
      : `analysis?start=${start}&end=${end}&cutoff=${cutoff}`;
  const resource = useResource<Dashboard | Analysis>(`/api/${query}`, refresh);
  const data = !invalid ? resource.data : null;
  const exportData = () => {
    if (!data) return;
    if ("series" in data)
      downloadCsv(
        `wind-${data.decision_date}-${data.cutoff.replace(":", "")}.csv`,
        [
          [
            "delivery_hour_utc",
            "forecast_mw",
            "forecast_publish_time_utc",
            ...(showActual
              ? ["retrospective_actual_mw", "forecast_minus_actual_mw"]
              : []),
          ],
          ...data.series.map((s) => [
            s.start_time,
            s.forecast_mw,
            s.publish_time,
            ...(showActual ? [s.actual_mw, s.error_mw] : []),
          ]),
        ],
      );
    else
      downloadCsv(
        `wind-accuracy-${data.start}-to-${data.end}-${data.cutoff.replace(":", "")}GMT.csv`,
        [
          [
            "decision_date",
            "delivery_date",
            "decision_cutoff_gmt",
            "mae_mw",
            "rmse_mw",
            "bias_mw",
            "matched_hours",
            "expected_hours",
            "coverage_pct",
          ],
          ...data.daily.map((d) => [
            d.decision_date,
            d.delivery_date,
            data.cutoff,
            d.metrics.mae_mw,
            d.metrics.rmse_mw,
            d.metrics.bias_mw,
            d.metrics.count,
            d.metrics.expected_count,
            d.metrics.coverage_pct,
          ]),
        ],
      );
  };
  return (
    <div className="app">
      <aside className="sidebar">
        <a className="brand" href="#main">
          <div className="brand-symbol">
            <Wind size={25} />
          </div>
          <span>
            windward<span>ENERGY INTELLIGENCE</span>
          </span>
        </a>
        <div className="workspace">
          <span className="workspace-avatar">GB</span>
          <div>
            National wind pilot<small>Great Britain · Elexon</small>
          </div>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <button
            aria-current={tab === "decision" ? "page" : undefined}
            className={tab === "decision" ? "active" : ""}
            onClick={() => setTab("decision")}
          >
            <Wind size={18} />
            Decision desk
            <ChevronRight size={15} />
          </button>
          <button
            aria-current={tab === "accuracy" ? "page" : undefined}
            className={tab === "accuracy" ? "active" : ""}
            onClick={() => setTab("accuracy")}
          >
            <BarChart3 size={18} />
            Forecast accuracy
            <ChevronRight size={15} />
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="archive-badge">
            <Database size={17} />
            <span>January 2026 archive</span>
          </div>
          <p>
            A focused pilot for day-ahead wind decisions. No trading or order
            execution.
          </p>
          <span className="sidebar-foot">FUELHH + WINDFOR</span>
        </div>
      </aside>
      <main id="main">
        <header className="topbar">
          <span>
            Workspace <ChevronRight size={13} />{" "}
            <strong>
              {tab === "decision" ? "Decision desk" : "Forecast accuracy"}
            </strong>
          </span>
          <span className="archive-label">
            <span /> Historical pilot
          </span>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">DAY-AHEAD WIND INTELLIGENCE</div>
              <h1>
                {tab === "decision"
                  ? "A clearer view of tomorrow."
                  : "Know the forecast’s blind spots."}
              </h1>
              <p>
                {tab === "decision"
                  ? "The latest eligible wind outlook, frozen at your purchase-decision time."
                  : "Quantify how the decision-time forecast compared with what was delivered."}
              </p>
            </div>
            <button
              className="secondary export"
              onClick={exportData}
              disabled={!data || resource.loading}
            >
              <ArrowDownToLine size={16} /> Export CSV
            </button>
          </div>
          <section className="filters" aria-label="Forecast selection">
            {tab === "decision" ? (
              <label>
                Purchase-decision date
                <input
                  aria-label="Purchase-decision date"
                  type="date"
                  min="2026-01-01"
                  max="2026-01-31"
                  value={date}
                  onInput={(e) => {
                    setDate(e.currentTarget.value);
                    setShowActual(false);
                  }}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setShowActual(false);
                  }}
                />
              </label>
            ) : (
              <>
                <label>
                  First decision date
                  <input
                    aria-label="First decision date"
                    type="date"
                    min="2026-01-01"
                    max="2026-01-31"
                    value={start}
                    onInput={(e) => setStart(e.currentTarget.value)}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </label>
                <label>
                  Last decision date
                  <input
                    aria-label="Last decision date"
                    type="date"
                    min={start}
                    max="2026-01-31"
                    value={end}
                    onInput={(e) => setEnd(e.currentTarget.value)}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </label>
              </>
            )}
            <label>
              Decision cutoff · GMT
              <input
                aria-label="Decision cutoff"
                type="time"
                value={cutoff}
                onInput={(e) => setCutoff(e.currentTarget.value)}
                onChange={(e) => setCutoff(e.target.value)}
              />
            </label>
            <div className="filter-context">
              {tab === "decision" && data && "delivery_date" in data ? (
                <>
                  <ArrowRight size={18} />
                  <div>
                    <small>DELIVERY DAY</small>
                    <strong>{shortDate(data.delivery_date)} 2026</strong>
                  </div>
                </>
              ) : (
                <>
                  <Clock3 size={18} />
                  <div>
                    <small>DECISION-TIME SNAPSHOT</small>
                    <strong>Latest publication ≤ cutoff</strong>
                  </div>
                </>
              )}
            </div>
          </section>
          <p className="cutoff-note">
            <Info size={14} /> 09:45 GMT is an illustrative pre-auction cutoff,
            not a universal market deadline. All times are Europe/London (GMT in
            January).
          </p>
          {invalid ? (
            <div className="state-box" role="alert">
              <Info />
              <h2>Choose valid January dates and a cutoff</h2>
              <p>
                Enter a valid time. Dates must be between 1 and 31 January 2026,
                with the start no later than the end.
              </p>
            </div>
          ) : resource.loading ? (
            <div className="state-box" role="status">
              <LoaderCircle className="spin" />
              <h2>Reconstructing the decision snapshot</h2>
              <p>Matching eligible publications and checking data coverage…</p>
            </div>
          ) : resource.error ? (
            <div className="state-box" role="alert">
              <Info />
              <h2>We couldn’t load this view</h2>
              <p>{resource.error}</p>
              <button
                className="secondary"
                onClick={() => setRefresh((v) => v + 1)}
              >
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          ) : data ? (
            "series" in data ? (
              <Decision
                data={data}
                showActual={showActual}
                setShowActual={setShowActual}
              />
            ) : (
              <Accuracy data={data} />
            )
          ) : null}
          {data && data.notes.length > 0 && (
            <details className="methodology">
              <summary>
                <Info size={15} /> Data notes & methodology
              </summary>
              <ul>
                {data.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </details>
          )}
          <footer>
            <span>
              <Database size={14} /> Elexon Insights · National wind only
            </span>
            <span>
              Decision dates 1–31 Jan 2026 · Delivery dates 2 Jan–1 Feb 2026
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}
