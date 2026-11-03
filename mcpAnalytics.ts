/**
 * MCP 서버(SSE)의 도구 호출을 GA4 Measurement Protocol 로 보낸다.
 * 브라우저가 없어서 gtag.js 대신 서버가 직접 보낸다.
 * GA_MEASUREMENT_ID·GA_API_SECRET 이 없으면 아무것도 보내지 않는다.
 * 사용자 PC 에서 도는 STDIO 서버에는 붙이지 않는다.
 */

const GA_ENDPOINT = "https://www.google-analytics.com/mp/collect";

export type AnalyticsParams = Record<string, string | number | undefined>;

export interface McpAnalytics {
  track: (sessionId: string | undefined, name: string, params?: AnalyticsParams) => void;
}

// GA 세션은 숫자 session_id 로 묶인다. MCP 세션 ID(UUID)에서 같은 숫자를 만든다
const toGaSessionId = (sessionId: string): number =>
  parseInt(sessionId.replace(/-/g, "").slice(0, 12), 16) || 1;

export const createMcpAnalytics = (
  env: Record<string, string | undefined> = process.env,
  send: typeof fetch = fetch,
): McpAnalytics => {
  const measurementId = env.GA_MEASUREMENT_ID;
  const apiSecret = env.GA_API_SECRET;

  if (!measurementId || !apiSecret) {
    return { track: () => {} };
  }

  const url = `${GA_ENDPOINT}?${new URLSearchParams({ measurement_id: measurementId, api_secret: apiSecret })}`;

  return {
    // 응답을 기다리지 않고, 실패해도 도구 응답에 영향을 주지 않는다
    track: (sessionId, name, params = {}) => {
      if (!sessionId) return;
      const body = JSON.stringify({
        client_id: sessionId,
        events: [
          {
            name,
            params: {
              ...params,
              session_id: toGaSessionId(sessionId),
              engagement_time_msec: 1,
            },
          },
        ],
      });
      send(url, { method: "POST", body }).catch((error) => {
        console.error("GA send failed:", error instanceof Error ? error.message : error);
      });
    },
  };
};
