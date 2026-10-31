import { useState } from "react";
import type { Slot } from "./types";
import { number, segments } from "./utils";
export default function Chart({
  series,
  actual,
}: {
  series: Slot[];
  actual: boolean;
}) {
  const all = series
    .flatMap((s) => [s.forecast_mw, ...(actual ? [s.actual_mw] : [])])
    .filter((v): v is number => v !== null);
  const max = Math.max(1000, Math.ceil(Math.max(0, ...all) / 1000) * 1000);
  const min = Math.min(0, Math.floor(Math.min(0, ...all) / 1000) * 1000);
  const w = 960,
    h = 240;
  const [selected, setSelected] = useState<number | null>(null);
  const index = selected !== null && selected < series.length ? selected : null;
  return (
    <>
      <div className="chart" aria-label="Hourly wind forecast chart">
        <svg
          viewBox="0 0 1040 300"
          role="img"
          aria-label={`Wind generation in megawatts. ${actual ? "Forecast and retrospective actuals" : "Forecast available at the decision cutoff"}. Full values in the interval table below.`}
        >
          <defs>
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0b968a" stopOpacity=".14" />
              <stop offset="100%" stopColor="#0b968a" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g transform="translate(66,15)">
            {[0, 0.25, 0.5, 0.75, 1].map((t) => (
              <g key={t}>
                <line
                  x1="0"
                  y1={h * t}
                  x2={w}
                  y2={h * t}
                  stroke="#e7edf0"
                  strokeDasharray={t === 1 ? "0" : "3 5"}
                />
                <text
                  x="-14"
                  y={h * t + 4}
                  textAnchor="end"
                  fill="#617681"
                  fontSize="11"
                >
                  {number(max - (max - min) * t)}
                </text>
              </g>
            ))}
            {segments(
              series.map((s) => s.forecast_mw),
              w,
              h,
              max,
              min,
            ).map((points, i) => (
              <polyline
                key={i}
                points={points}
                fill="none"
                stroke="#008d82"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}
            {actual &&
              segments(
                series.map((s) => s.actual_mw),
                w,
                h,
                max,
                min,
              ).map((points, i) => (
                <polyline
                  key={i}
                  points={points}
                  fill="none"
                  stroke="#6576bd"
                  strokeWidth="2.5"
                  strokeDasharray="6 4"
                />
              ))}
            {series.map((s, i) =>
              i % 3 === 0 || i === series.length - 1 ? (
                <text
                  key={s.start_time}
                  x={(i * w) / Math.max(1, series.length - 1)}
                  y={h + 27}
                  textAnchor="middle"
                  fill="#617681"
                  fontSize="11"
                >
                  {s.start_time.slice(11, 16)}
                </text>
              ) : null,
            )}
            {series.map((s, i) => (
              <rect
                key={s.start_time}
                x={Math.max(
                  0,
                  (i * w) / Math.max(1, series.length - 1) -
                    w / series.length / 2,
                )}
                y="0"
                width={w / series.length}
                height={h}
                fill="transparent"
                onMouseEnter={() => setSelected(i)}
                onMouseLeave={() => setSelected(null)}
              >
                <title>
                  {s.start_time.slice(11, 16)} · forecast{" "}
                  {number(s.forecast_mw)} MW
                  {actual ? ` · actual ${number(s.actual_mw)} MW` : ""}
                </title>
              </rect>
            ))}
            {index !== null && (
              <line
                x1={(index * w) / Math.max(1, series.length - 1)}
                y1="0"
                x2={(index * w) / Math.max(1, series.length - 1)}
                y2={h}
                stroke="#9db5bc"
                strokeDasharray="3 4"
              />
            )}
          </g>
        </svg>
      </div>
      <div className="chart-caption">
        <span>
          {index !== null
            ? `${series[index].start_time.slice(11, 16)} · Forecast ${number(series[index].forecast_mw)} MW${actual ? ` · Actual ${number(series[index].actual_mw)} MW` : ""}`
            : "Hover over the chart to inspect an hour. Missing values remain gaps."}
        </span>
        <span>Delivery time · GMT</span>
      </div>
    </>
  );
}
