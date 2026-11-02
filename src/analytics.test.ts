import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { trackSearch, trackSearchCancel, trackSearchComplete } from "./analytics";

describe("analytics", () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockClear();
    window.gtag = gtag;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.gtag;
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
});
