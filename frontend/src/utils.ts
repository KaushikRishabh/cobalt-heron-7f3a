export const number = (value: number | null | undefined, digits = 0) =>
  value == null || !Number.isFinite(value)
    ? "—"
    : new Intl.NumberFormat("en-GB", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value);
export const shortDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/London",
  });
export const timestamp = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/London",
        hour12: false,
      })
    : "Unavailable";
export const csvCell = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;
export function downloadCsv(name: string, rows: unknown[][]) {
  const blob = new Blob(
    [rows.map((row) => row.map(csvCell).join(",")).join("\r\n")],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
export function segments(
  values: (number | null)[],
  width: number,
  height: number,
  max: number,
  min = 0,
): string[] {
  const result: string[] = [];
  let current: string[] = [];
  values.forEach((v, i) => {
    if (v === null) {
      if (current.length) result.push(current.join(" "));
      current = [];
    } else
      current.push(
        `${(i * width) / Math.max(1, values.length - 1)},${height - ((v - min) / (max - min)) * height}`,
      );
  });
  if (current.length) result.push(current.join(" "));
  return result;
}
