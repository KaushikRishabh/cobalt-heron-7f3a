export default function Metric({
  label,
  value,
  unit,
  detail,
  accent = false,
}: {
  label: string;
  value: string;
  unit?: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <article className={`metric ${accent ? "accent" : ""}`}>
      <span className="metric-label">{label}</span>
      <div className="metric-value">
        {value}
        <span>{unit}</span>
      </div>
      <p>{detail}</p>
    </article>
  );
}
