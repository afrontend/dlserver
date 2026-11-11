import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  initAnalytics,
  parseEntryRef,
  setEntryRef,
  trackPageView,
  trackSearch,
  trackSearchCancel,
  trackSearchComplete,
} from "./analytics";

describe("initAnalytics", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
    window.dataLayer = [];
    document.getElementById("google-analytics-gtag")?.remove();
  });

  it("dataLayer 에 배열이 아닌 arguments 객체로 명령을 넣는다", () => {
    vi.stubEnv("PROD", true);

    initAnalytics();

    expect(window.dataLayer).toHaveLength(2);
    for (const command of window.dataLayer) {
      expect(Array.isArray(command)).toBe(false);
      expect(Object.prototype.toString.call(command)).toBe("[object Arguments]");
    }
    expect(Array.from(window.dataLayer[1] as IArguments)).toEqual([
      "config",
      "G-9WDTNJDBR7",
      { send_page_view: false },
    ]);
  });
});

describe("analytics", () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockClear();
    window.gtag = gtag;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
    setEntryRef(undefined);
  });

  it("개발 빌드에서는 보내지 않는다", () => {
    vi.stubEnv("PROD", false);

    trackSearch("해리포터", "강남도서관", "single", 1);

    expect(gtag).not.toHaveBeenCalled();
  });

  it("search 이벤트에 검색 범위와 도서관 수를 담는다", () => {
    vi.stubEnv("PROD", true);

    trackSearch("해리포터", "도서관을 선택하세요.", "all", 1342);

    expect(gtag).toHaveBeenCalledWith("event", "search", {
      search_term: "해리포터",
      library_name: "도서관을 선택하세요.",
      search_scope: "all",
      library_count: 1342,
    });
  });

  it("완료·취소 이벤트를 GA 파라미터 이름으로 보낸다", () => {
    vi.stubEnv("PROD", true);

    trackSearchComplete({
      libraryCount: 3,
      failedCount: 1,
      resultCount: 4,
      availableCount: 2,
      durationMs: 1500,
    });
    trackSearchCancel({ libraryCount: 1342, completedCount: 120, durationMs: 30000 });

    expect(gtag).toHaveBeenCalledWith("event", "search_complete", {
      library_count: 3,
      failed_count: 1,
      result_count: 4,
      available_count: 2,
      duration_ms: 1500,
    });
    expect(gtag).toHaveBeenCalledWith("event", "search_cancel", {
      library_count: 1342,
      completed_count: 120,
      duration_ms: 30000,
    });
  });

  it("들어온 경로가 있으면 page_view 에 utm_source 와 entry_ref 를 붙인다", () => {
    vi.stubEnv("PROD", true);
    setEntryRef("ext");

    trackPageView();

    const params = gtag.mock.calls[0][2];
    expect(params.entry_ref).toBe("ext");
    const location = new URL(params.page_location);
    expect(location.searchParams.get("utm_source")).toBe("ext");
    expect(location.searchParams.get("utm_medium")).toBe("referral");
  });

  it("들어온 경로는 search 이벤트에도 남는다", () => {
    vi.stubEnv("PROD", true);
    setEntryRef("bm");

    trackSearch("해리포터", "강남도서관", "single", 1);

    expect(gtag.mock.calls[0][2]).toMatchObject({ entry_ref: "bm" });
  });

  it("들어온 경로가 없으면 page_location 을 그대로 보낸다", () => {
    vi.stubEnv("PROD", true);

    trackPageView();

    expect(gtag.mock.calls[0][2]).not.toHaveProperty("entry_ref");
    expect(gtag.mock.calls[0][2].page_location).toBe(window.location.href);
  });
});

describe("parseEntryRef", () => {
  it("짧은 영문 소문자 값만 받는다", () => {
    expect(parseEntryRef("?title=a&ref=ext")).toBe("ext");
    expect(parseEntryRef("?ref=bm")).toBe("bm");
    expect(parseEntryRef("?ref=EXT")).toBeUndefined();
    expect(parseEntryRef("?ref=<script>")).toBeUndefined();
    expect(parseEntryRef(`?ref=${"a".repeat(21)}`)).toBeUndefined();
    expect(parseEntryRef("?title=a")).toBeUndefined();
  });
});
