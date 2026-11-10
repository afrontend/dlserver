import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { app } from "./server";
import { clearSearchCache } from "./librarySearch";

// 이름이 같은 도서관을 구분하는 모듈 직접 검색 경로용
const cheonanSearch = vi.hoisted(() => vi.fn());
const ansanSearch = vi.hoisted(() => vi.fn());
const gunpoSearch = vi.hoisted(() => vi.fn());

// Mock dongnelibrary module
vi.mock("dongnelibrary", async (importOriginal) => {
  const actual = await importOriginal<typeof import("dongnelibrary")>();
  const stubs: Record<string, unknown> = {
    천안시도서관: cheonanSearch,
    안산시도서관: ansanSearch,
    군포시도서관: gunpoSearch,
  };
  return {
    search: vi.fn(
      (
        _options: { title: string; libraryName: string },
        _unknown: unknown,
        callback: (
          err: Error | null,
          result: Array<{ booklist: Array<{ title: string; exist: boolean }> }>
        ) => void
      ) => {
        callback(null, [
          {
            booklist: [
              { title: "테스트 책", exist: true },
              { title: "다른 책", exist: false },
            ],
          },
        ]);
      }
    ),
    getLibraryNames: vi.fn(() => ["판교", "동탄", "성남"]),
    getAllLibraryNames: vi.fn(() => ["판교", "동탄", "성남"]),
    getAllModuleNames: vi.fn(() => ["성남시도서관", "수원시도서관"]),
    isModuleName: vi.fn((name: string) =>
      ["성남시도서관", "수원시도서관"].includes(name)
    ),
    // 실제 모듈 목록을 쓰되, 몇 모듈은 search 만 바꾼다
    getLibraryModules: () =>
      actual
        .getLibraryModules()
        .map((mod) => (stubs[mod.moduleName] ? { ...mod, search: stubs[mod.moduleName] } : mod)),
  };
});

const respondWith = (title: string) => (_opt: unknown, callback: (err: null, data: object) => void) =>
  callback(null, { totalBookCount: 1, booklist: [{ title, exist: true }] });

describe("Server API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearSearchCache();
  });

  describe("GET /libraryList", () => {
    it("returns array of library names", async () => {
      const res = await request(app).get("/libraryList");

      expect(res.status).toBe(200);
      expect(res.body).toEqual(["판교", "동탄", "성남"]);
    });
  });

  describe("GET /moduleList", () => {
    it("returns array of objects with name and libraries", async () => {
      const res = await request(app).get("/moduleList");

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      res.body.forEach(
        (mod: { name: string; libraries: string[] }) => {
          expect(mod).toHaveProperty("name");
          expect(mod).toHaveProperty("libraries");
          expect(typeof mod.name).toBe("string");
          expect(Array.isArray(mod.libraries)).toBe(true);
        }
      );
    });
  });

  describe("GET /search", () => {
    it("returns search results as JSON", async () => {
      const res = await request(app).get(
        "/search?title=테스트&libraryName=판교"
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty("booklist");
    });

    it("returns empty results when no books found", async () => {
      const dl = await import("dongnelibrary");
      vi.mocked(dl.search).mockImplementationOnce(
        (_options, _unknown, callback) => {
          callback?.(null, []);
        }
      );

      const res = await request(app).get(
        "/search?title=없는책&libraryName=판교"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it("keeps the error of a library that could not be searched", async () => {
      const dl = await import("dongnelibrary");
      const failed = {
        libraryName: "판교도서관",
        totalBookCount: 0,
        booklist: [],
        error: { msg: "Connect Timeout Error", libraryName: "판교도서관" },
      };
      vi.mocked(dl.search).mockImplementationOnce(
        (_options, _unknown, callback) => {
          callback?.(null, [failed]);
        }
      );

      const res = await request(app).get(
        "/search?title=테스트&libraryName=판교"
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual([{ ...failed, checkedAt: expect.any(String) }]);
    });
  });

  describe("GET /search cache", () => {
    const searchCheonan = (fresh = false) =>
      request(app).get(
        "/search?title=a&libraryName=" + encodeURIComponent("중앙도서관") +
          "&module=" + encodeURIComponent("천안시도서관") +
          (fresh ? "&fresh=1" : ""),
      );

    it("같은 검색은 도서관 사이트에 다시 묻지 않고 처음 확인한 시각과 함께 돌려준다", async () => {
      cheonanSearch.mockImplementation(respondWith("천안 책"));

      const first = await searchCheonan();
      const second = await searchCheonan();

      expect(cheonanSearch).toHaveBeenCalledTimes(1);
      expect(first.body[0].checkedAt).toEqual(expect.any(String));
      expect(second.body).toEqual(first.body);
    });

    it("fresh=1 이면 캐시를 건너뛰고 다시 검색한다", async () => {
      cheonanSearch.mockImplementation(respondWith("천안 책"));

      await searchCheonan();
      await searchCheonan(true);

      expect(cheonanSearch).toHaveBeenCalledTimes(2);
    });

    it("실패한 결과는 캐시하지 않는다", async () => {
      cheonanSearch.mockImplementationOnce((_opt, callback) => callback({ msg: "접속 실패" }));
      cheonanSearch.mockImplementationOnce(respondWith("천안 책"));

      const failed = await searchCheonan();
      const retried = await searchCheonan();

      expect(failed.body[0].error.msg).toBe("접속 실패");
      expect(retried.body[0].booklist[0].title).toBe("천안 책");
      expect(cheonanSearch).toHaveBeenCalledTimes(2);
    });
  });

  describe("GET /search with module", () => {
    it("모듈과 도서관 이름이 맞으면 그 모듈로 바로 검색한다", async () => {
      const { search } = await import("dongnelibrary");
      cheonanSearch.mockImplementation((_opt, callback) => {
        callback(null, {
          totalBookCount: 2,
          startPage: 1,
          booklist: [
            { libraryName: "중앙도서관", title: "없는 책", exist: false, extra: 1 },
            { libraryName: "중앙도서관", title: "있는 책", exist: true },
          ],
        });
      });

      const res = await request(app).get(
        "/search?title=" + encodeURIComponent("책") +
          "&libraryName=" + encodeURIComponent("중앙도서관") +
          "&module=" + encodeURIComponent("천안시도서관"),
      );

      expect(res.status).toBe(200);
      expect(search).not.toHaveBeenCalled();
      expect(cheonanSearch).toHaveBeenCalledWith(
        expect.objectContaining({ title: "책", libraryName: "중앙도서관" }),
        expect.any(Function),
      );
      expect(res.body).toHaveLength(1);
      expect(res.body[0].libraryName).toBe("중앙도서관");
      expect(res.body[0].booklist).toEqual([
        { libraryName: "중앙도서관", title: "있는 책", exist: true },
        { libraryName: "중앙도서관", title: "없는 책", exist: false },
      ]);
    });

    it("모듈 검색이 실패하면 error 와 빈 booklist 를 돌려준다", async () => {
      cheonanSearch.mockImplementation((_opt, callback) => callback({ msg: "접속 실패" }));

      const res = await request(app).get(
        "/search?title=a&libraryName=" + encodeURIComponent("중앙도서관") +
          "&module=" + encodeURIComponent("천안시도서관"),
      );

      expect(res.body[0].booklist).toEqual([]);
      expect(res.body[0].error.msg).toBe("접속 실패");
    });

    it("모듈에 없는 도서관이면 이름으로 검색한다", async () => {
      const { search } = await import("dongnelibrary");

      await request(app).get(
        "/search?title=a&libraryName=" + encodeURIComponent("판교") +
          "&module=" + encodeURIComponent("천안시도서관"),
      );

      expect(cheonanSearch).not.toHaveBeenCalled();
      expect(search).toHaveBeenCalled();
    });
  });

  describe("GET /search without module", () => {
    it("이름이 정확히 같은 도서관이 한 곳이면 그 모듈로 바로 검색한다", async () => {
      const { search } = await import("dongnelibrary");
      cheonanSearch.mockImplementation(respondWith("천안 책"));

      const res = await request(app).get("/search?title=a&libraryName=" + encodeURIComponent("쌍용도서관"));

      expect(search).not.toHaveBeenCalled();
      expect(res.body).toHaveLength(1);
      expect(res.body[0].moduleName).toBe("천안시도서관");
    });

    it("이름이 같은 도서관이 여러 모듈에 있으면 모두 검색한다", async () => {
      ansanSearch.mockImplementation(respondWith("안산 책"));
      gunpoSearch.mockImplementation(respondWith("군포 책"));

      const res = await request(app).get("/search?title=a&libraryName=" + encodeURIComponent("부곡도서관"));

      expect(res.body.map((r: { moduleName: string }) => r.moduleName)).toEqual(["안산시도서관", "군포시도서관"]);
    });

    it("module 을 주면 같은 이름 중 그 모듈만 검색한다", async () => {
      gunpoSearch.mockImplementation(respondWith("군포 책"));

      const res = await request(app).get(
        "/search?title=a&libraryName=" + encodeURIComponent("부곡도서관") +
          "&module=" + encodeURIComponent("군포시도서관"),
      );

      expect(ansanSearch).not.toHaveBeenCalled();
      expect(res.body.map((r: { moduleName: string }) => r.moduleName)).toEqual(["군포시도서관"]);
    });
  });

  describe("GET /:title/:libraryName", () => {
    it("returns HTML with availability markers", async () => {
      const res = await request(app).get("/테스트/판교");

      expect(res.status).toBe(200);
      expect(res.text).toContain("✓");
      expect(res.text).toContain("✖");
      expect(res.text).toContain("테스트 책");
    });
  });

  describe("404 handling", () => {
    it("returns 404 for unknown routes", async () => {
      const res = await request(app).get("/unknown/route/test");

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("message");
    });
  });
});
