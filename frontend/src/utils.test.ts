import { describe, it, expect } from "vitest";
import { number, segments, csvCell, shortDate, timestamp } from "./utils";
describe("display helpers", () => {
  it("keeps negative generation inside the chart range", () => {
    expect(segments([-10, 0, 10], 100, 100, 10, -10)).toEqual([
      "0,100 50,50 100,0",
    ]);
  });
  it("does not silently turn missing values into zero", () => {
    expect(number(null)).toBe("—");
    expect(number(undefined)).toBe("—");
    expect(number(NaN)).toBe("—");
    expect(number(0)).toBe("0");
  });
  it("formats negative bias and precision", () => {
    expect(number(-1344.123, 1)).toBe("-1,344.1");
  });
  it("uses UK dates across the month boundary", () => {
    expect(shortDate("2026-02-01")).toBe("1 Feb");
    expect(timestamp(null)).toBe("Unavailable");
  });
  it("escapes CSV delimiters and quotes", () => {
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell(null)).toBe('""');
  });
  it("breaks chart lines at missing observations", () => {
    expect(segments([10, null, 20, 30], 90, 30, 30)).toEqual([
      "0,20",
      "60,10 90,0",
    ]);
  });
  it("handles all-missing and a single-value series", () => {
    expect(segments([null, null], 90, 30, 30)).toEqual([]);
    expect(segments([0], 90, 30, 30)).toEqual(["0,30"]);
  });
});
