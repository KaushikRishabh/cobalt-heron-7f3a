// @vitest-environment jsdom
import { afterEach, describe, it, expect, vi } from "vitest";
import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";
import App from "./App";
import * as utils from "./utils";
const metrics = {
  count: 1,
  expected_count: 24,
  coverage_pct: 4.17,
  mae_mw: 100,
  rmse_mw: 100,
  bias_mw: 100,
  wape_pct: 10,
  forecast_energy_mwh: 1100,
  actual_energy_mwh: 1000,
  energy_error_mwh: 100,
  overforecast_hours: 1,
  underforecast_hours: 0,
};
const dashboard = {
  decision_date: "2026-01-15",
  delivery_date: "2026-01-16",
  cutoff: "09:45",
  cutoff_timestamp: "2026-01-15T09:45:00Z",
  timezone: "Europe/London",
  resolution_minutes: 60,
  series: [
    {
      start_time: "2026-01-16T00:00:00Z",
      forecast_mw: 1100,
      actual_mw: 1000,
      publish_time: "2026-01-15T08:30:00Z",
      error_mw: 100,
      actual_half_hours: 2,
    },
  ],
  metrics,
  forecast_coverage_pct: 4.17,
  latest_publish_time: "2026-01-15T08:30:00Z",
  oldest_publish_time: "2026-01-15T08:30:00Z",
  forecast_total_mwh: 1100,
  actual_total_mwh: 1000,
  notes: [],
  provenance: {},
};
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
function success(body: unknown = dashboard) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => body }),
  );
}
describe("decision desk", () => {
  it("hides hindsight actuals by default and reveals them explicitly", async () => {
    success();
    render(<App />);
    await screen.findByText("Wind available for the day ahead");
    expect(screen.queryByText("Actual (MW)")).toBeNull();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show retrospective actuals" }),
    );
    expect(screen.getByText("Actual (MW)")).toBeTruthy();
    expect(screen.getByText(/Actuals are hindsight/)).toBeTruthy();
    expect(screen.getByText("Known hours only · incomplete day")).toBeTruthy();
  });
  it("keeps a missing forecast empty instead of inventing a peak", async () => {
    success({
      ...dashboard,
      forecast_coverage_pct: 0,
      forecast_total_mwh: null,
      latest_publish_time: null,
      oldest_publish_time: null,
      series: [
        { ...dashboard.series[0], forecast_mw: null, publish_time: null },
      ],
    });
    render(<App />);
    await screen.findByText("Wind available for the day ahead");
    expect(screen.getByText("No eligible forecast available")).toBeTruthy();
    expect(screen.getByText("0 of 1 delivery hours available")).toBeTruthy();
    expect(screen.queryByText("At 00:00 GMT on delivery day")).toBeNull();
  });
  it("uses the documented default cutoff and next-day delivery", async () => {
    success();
    render(<App />);
    await screen.findByText("Wind available for the day ahead");
    expect(fetch).toHaveBeenCalledWith(
      "/api/dashboard?decision_date=2026-01-15&cutoff=09:45",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(screen.getByText("16 Jan 2026")).toBeTruthy();
  });
  it("shows useful backend errors and can retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          json: async () => ({ detail: "Verified data snapshot unavailable." }),
        })
        .mockResolvedValue({ ok: true, json: async () => dashboard }),
    );
    render(<App />);
    await screen.findByText("Verified data snapshot unavailable.");
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Wind available for the day ahead");
  });
  it("rejects a decision date outside January", async () => {
    success();
    render(<App />);
    fireEvent.change(screen.getByLabelText("Purchase-decision date"), {
      target: { value: "2026-02-01" },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "Choose valid January",
    );
    expect(
      screen
        .getByRole("button", { name: "Export CSV" })
        .hasAttribute("disabled"),
    ).toBe(true);
  });
  it("switches to retrospective monthly accuracy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((url: string) =>
        Promise.resolve({
          ok: true,
          json: async () =>
            url.includes("/analysis")
              ? {
                  start: "2026-01-01",
                  end: "2026-01-31",
                  cutoff: "09:45",
                  resolution_minutes: 60,
                  metrics,
                  daily: [
                    {
                      decision_date: "2026-01-15",
                      delivery_date: "2026-01-16",
                      metrics,
                      forecast_coverage_pct: 4.17,
                    },
                  ],
                  notes: [],
                  provenance: {},
                }
              : dashboard,
        }),
      ),
    );
    render(<App />);
    await screen.findByText("Wind available for the day ahead");
    fireEvent.click(screen.getByRole("button", { name: /Forecast accuracy/ }));
    await screen.findByText("How did each decision day perform?");
    expect(screen.getByText("Mean absolute error")).toBeTruthy();
    expect(screen.queryByText("Wind available for the day ahead")).toBeNull();
  });
  it("handles native input events and resets retrospective mode for a new decision", async () => {
    success();
    render(<App />);
    await screen.findByText("Wind available for the day ahead");
    fireEvent.click(
      screen.getByRole("checkbox", { name: "Show retrospective actuals" }),
    );
    fireEvent.input(screen.getByLabelText("Purchase-decision date"), {
      target: { value: "2026-01-31" },
    });
    await waitFor(() =>
      expect(fetch).toHaveBeenLastCalledWith(
        "/api/dashboard?decision_date=2026-01-31&cutoff=09:45",
        expect.anything(),
      ),
    );
    await screen.findByText("Wind available for the day ahead");
    expect(
      (
        screen.getByRole("checkbox", {
          name: "Show retrospective actuals",
        }) as HTMLInputElement
      ).checked,
    ).toBe(false);
  });
  it("exports accuracy with the exact date range and cutoff provenance", async () => {
    const csv = vi.spyOn(utils, "downloadCsv").mockImplementation(() => {});
    success({
      start: "2026-01-03",
      end: "2026-01-09",
      cutoff: "10:15",
      resolution_minutes: 60,
      metrics,
      daily: [
        {
          decision_date: "2026-01-03",
          delivery_date: "2026-01-04",
          metrics,
          forecast_coverage_pct: 100,
        },
      ],
      notes: [],
      provenance: {},
    });
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Forecast accuracy/ }));
    await screen.findByText("How did each decision day perform?");
    expect(
      screen
        .getByRole("button", { name: /Forecast accuracy/ })
        .getAttribute("aria-current"),
    ).toBe("page");
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(csv).toHaveBeenCalledWith(
      "wind-accuracy-2026-01-03-to-2026-01-09-1015GMT.csv",
      expect.anything(),
    );
    const rows = csv.mock.calls[0][1];
    expect(rows[0]).toContain("decision_cutoff_gmt");
    expect(rows[1][2]).toBe("10:15");
  });
  it("aborts obsolete requests after date changes", async () => {
    success();
    render(<App />);
    await screen.findByText("Wind available for the day ahead");
    const signal = (vi.mocked(fetch).mock.calls[0][1] as RequestInit).signal;
    fireEvent.change(screen.getByLabelText("Purchase-decision date"), {
      target: { value: "2026-01-20" },
    });
    await waitFor(() => expect(signal?.aborted).toBe(true));
  });
});
