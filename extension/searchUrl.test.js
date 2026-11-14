import { describe, it, expect } from "vitest";
import { buildSearchUrl, normalizeTitle } from "./searchUrl.js";

describe("확장 검색 주소", () => {
  it("선택한 제목과 ref=ext 로 사이트를 연다", () => {
    const url = new URL(buildSearchUrl("채식주의자"));

    expect(url.origin).toBe("https://dongne.afrontend.dev");
    expect(url.searchParams.get("title")).toBe("채식주의자");
    expect(url.searchParams.get("ref")).toBe("ext");
    expect(url.searchParams.has("library")).toBe(false);
  });

  it("줄바꿈·연속 공백을 한 칸으로 줄이고 100자로 자른다", () => {
    expect(normalizeTitle("  비전공자도\n이해할   수 있는\tLLM  ")).toBe("비전공자도 이해할 수 있는 LLM");
    expect(normalizeTitle("가".repeat(150))).toHaveLength(100);
  });

  it("선택이 없으면 제목 없이 ref=ext 만 붙인다", () => {
    const url = new URL(buildSearchUrl("   "));

    expect(url.searchParams.has("title")).toBe(false);
    expect(url.searchParams.get("ref")).toBe("ext");
    expect(new URL(buildSearchUrl(undefined)).searchParams.has("title")).toBe(false);
  });

  it("& · # 같은 문자도 제목에 그대로 담는다", () => {
    const url = new URL(buildSearchUrl("R&D #1 가이드"));

    expect(url.searchParams.get("title")).toBe("R&D #1 가이드");
  });
});
