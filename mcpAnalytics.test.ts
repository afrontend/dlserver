import { describe, it, expect, vi } from "vitest";
import { createMcpAnalytics } from "./mcpAnalytics";

const SESSION = "9e732c67-a1b8-4160-9053-97727f77fb3b";

describe("createMcpAnalytics", () => {
  it("환경 변수가 없으면 보내지 않는다", () => {
    const send = vi.fn();
    createMcpAnalytics({}, send).track(SESSION, "search");
    createMcpAnalytics({ GA_MEASUREMENT_ID: "G-TEST" }, send).track(SESSION, "search");
    expect(send).not.toHaveBeenCalled();
  });

  it("세션이 없으면 보내지 않는다", () => {
    const send = vi.fn().mockResolvedValue({});
    createMcpAnalytics({ GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "s" }, send).track(undefined, "search");
    expect(send).not.toHaveBeenCalled();
  });

  it("Measurement Protocol 형식으로 세션 ID 와 함께 보낸다", () => {
    const send = vi.fn().mockResolvedValue({});
    createMcpAnalytics({ GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "secret" }, send).track( // gitleaks:allow (테스트용 가짜 값)
      SESSION,
      "search",
      { search_term: "해리", module: undefined },
    );

    const [url, init] = send.mock.calls[0];
    expect(url).toBe("https://www.google-analytics.com/mp/collect?measurement_id=G-TEST&api_secret=secret");
    const body = JSON.parse(init.body);
    expect(body.client_id).toBe(SESSION);
    expect(body.events).toEqual([
      {
        name: "search",
        params: { search_term: "해리", session_id: 0x9e732c67a1b8, engagement_time_msec: 1 },
      },
    ]);
  });

  it("전송이 실패해도 예외를 던지지 않는다", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const send = vi.fn().mockRejectedValue(new Error("offline"));
    expect(() =>
      createMcpAnalytics({ GA_MEASUREMENT_ID: "G-TEST", GA_API_SECRET: "s" }, send).track(SESSION, "search"),
    ).not.toThrow();
    await vi.waitFor(() => expect(error).toHaveBeenCalled());
    error.mockRestore();
  });
});
