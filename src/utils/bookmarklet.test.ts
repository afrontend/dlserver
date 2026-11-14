import { describe, it, expect, vi, afterEach } from "vitest";
import { buildBookmarklet } from "./bookmarklet";

const run = (href: string) => {
  new Function(decodeURIComponent(href.slice("javascript:".length)))();
};

describe("buildBookmarklet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("고른 글자와 ref=bm 으로 새 탭을 연다 (도서관은 넣지 않는다)", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "  채식주의자 " } as Selection);

    run(buildBookmarklet("https://dongne.afrontend.dev"));

    const url = new URL(open.mock.calls[0][0] as string);
    expect(url.origin).toBe("https://dongne.afrontend.dev");
    expect(url.searchParams.get("title")).toBe("채식주의자");
    expect(url.searchParams.get("library")).toBeNull();
    expect(url.searchParams.get("ref")).toBe("bm");
    expect(open.mock.calls[0][1]).toBe("_blank");
  });

  it("고른 글자가 없으면 묻고, 취소하면 열지 않는다", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "" } as Selection);
    const ask = vi.spyOn(window, "prompt").mockReturnValue(null);

    run(buildBookmarklet("https://dongne.afrontend.dev"));

    expect(ask).toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("입력한 제목은 100자로 자른다", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "가".repeat(150) } as Selection);

    run(buildBookmarklet("http://localhost:3000"));

    expect(new URL(open.mock.calls[0][0] as string).searchParams.get("title")).toHaveLength(100);
  });
});
