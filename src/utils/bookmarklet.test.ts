import { describe, it, expect, vi, afterEach } from "vitest";
import { buildBookmarklet } from "./bookmarklet";

const run = (href: string) => {
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function(decodeURIComponent(href.slice("javascript:".length)))();
};

describe("buildBookmarklet", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    window.getSelection()?.removeAllRanges();
  });

  it("고른 글자와 도서관, ref=bm 으로 새 탭을 연다", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "  채식주의자 " } as Selection);

    run(buildBookmarklet("https://dongne.onrender.com", "판교도서관"));

    const url = new URL(open.mock.calls[0][0] as string);
    expect(url.origin).toBe("https://dongne.onrender.com");
    expect(url.searchParams.get("title")).toBe("채식주의자");
    expect(url.searchParams.get("library")).toBe("판교도서관");
    expect(url.searchParams.get("ref")).toBe("bm");
    expect(open.mock.calls[0][1]).toBe("_blank");
  });

  it("고른 글자가 없으면 묻고, 취소하면 열지 않는다", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "" } as Selection);
    const ask = vi.spyOn(window, "prompt").mockReturnValue(null);

    run(buildBookmarklet("https://dongne.onrender.com", "판교도서관"));

    expect(ask).toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it("도서관 이름의 따옴표가 코드를 깨지 않는다", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    vi.spyOn(window, "getSelection").mockReturnValue({ toString: () => "책" } as Selection);

    run(buildBookmarklet("http://localhost:3000", '이상한"도서관\'</script>'));

    expect(new URL(open.mock.calls[0][0] as string).searchParams.get("library")).toBe('이상한"도서관\'</script>');
  });
});
