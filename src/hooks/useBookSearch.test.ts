import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookSearch } from "./useBookSearch";
import { LibraryAPI } from "../api/library";
import { DEFAULT_LIBRARY } from "../constants";
import type { Library, LibrarySearchResult } from "../types";

vi.mock("../api/library", () => ({
  LibraryAPI: {
    getLibrary: vi.fn(),
  },
}));

vi.mock("../analytics", () => ({
  trackSearchComplete: vi.fn(),
  trackSearchCancel: vi.fn(),
}));

import { trackSearchCancel, trackSearchComplete } from "../analytics";

const mockLibraries: Library[] = [
  { id: 0, name: "여주시립도서관" },
  { id: 1, name: "강남도서관" },
  { id: 2, name: "서울도서관" },
];

const makeSearchResult = (libraryName: string, titles: string[]) => [
  {
    booklist: titles.map((title) => ({
      title,
      exist: true,
      libraryName,
    })),
  },
];

describe("useBookSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("초기 상태", () => {
    it("초기값이 올바르다", () => {
      const { result } = renderHook(() => useBookSearch());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.aggregatedBooks).toEqual([]);
      expect(result.current.searchProgress).toEqual({
        totalLibraries: 0,
        completedLibraries: 0,
        searchingLibraries: [],
        isSearchingAll: false,
      });
    });
  });

  describe("단일 도서관 검색", () => {
    it("특정 도서관을 지정하여 검색한다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue(
        makeSearchResult("여주시립도서관", ["해리포터"]),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", "여주시립도서관", mockLibraries);
      });

      expect(result.current.isLoading).toBe(true);

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks).toHaveLength(1);
      expect(result.current.aggregatedBooks[0].title).toBe("해리포터");
      expect(LibraryAPI.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({ title: "해리포터", libraryName: "여주시립도서관" }),
      );
    });

    it("목록에 있는 도서관은 실제 이름과 모듈로 검색하고 책에는 표시 이름을 단다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue(makeSearchResult("중앙도서관", ["해리포터"]));
      const libraries: Library[] = [
        { id: 0, name: "중앙도서관 (안산시도서관)", libraryName: "중앙도서관", module: "안산시도서관" },
        { id: 1, name: "중앙도서관 (천안시도서관)", libraryName: "중앙도서관", module: "천안시도서관" },
      ];

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", "중앙도서관 (천안시도서관)", libraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(LibraryAPI.getLibrary).toHaveBeenCalledWith(
        expect.objectContaining({ libraryName: "중앙도서관", module: "천안시도서관" }),
      );
      expect(result.current.aggregatedBooks[0].libraryName).toBe("중앙도서관 (천안시도서관)");
    });

    it("서버가 확인한 시각을 책에 달고, 새로 확인하면 fresh 로 다시 검색한다", async () => {
      const checkedAt = "2026-11-10T00:00:00.000Z";
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue([
        { ...makeSearchResult("여주시립도서관", ["해리포터"])[0], checkedAt },
      ]);

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", "여주시립도서관", mockLibraries);
      });
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks[0].checkedAt).toBe(checkedAt);
      expect(LibraryAPI.getLibrary).toHaveBeenLastCalledWith(
        expect.objectContaining({ fresh: false }),
      );

      act(() => {
        result.current.refreshSearch();
      });
      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(LibraryAPI.getLibrary).toHaveBeenLastCalledWith(
        expect.objectContaining({ title: "해리포터", libraryName: "여주시립도서관", fresh: true }),
      );
    });

    it("검색 결과가 없으면 빈 배열을 반환한다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue([{ booklist: [] }]);

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("없는책", "여주시립도서관", mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks).toEqual([]);
      expect(result.current.failedLibraries).toEqual([]);
    });

    it("도서관 사이트에 접속하지 못하면 실패한 도서관으로 알린다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue([
        { booklist: [], error: { msg: "Connect Timeout Error" } },
      ]);

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", "여주시립도서관", mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks).toEqual([]);
      expect(result.current.failedLibraries).toEqual(["여주시립도서관"]);
    });

    it("빈 제목으로 검색하면 아무 동작도 하지 않는다", () => {
      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("", "여주시립도서관", mockLibraries);
      });

      expect(result.current.isLoading).toBe(false);
      expect(LibraryAPI.getLibrary).not.toHaveBeenCalled();
    });
  });

  describe("전체 도서관 검색 (DEFAULT_LIBRARY)", () => {
    it("모든 도서관에 동시 검색 요청을 보낸다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(({ libraryName }) =>
        Promise.resolve(makeSearchResult(libraryName, ["해리포터"])),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.searchProgress.totalLibraries).toBe(3);

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks).toHaveLength(3);
      expect(LibraryAPI.getLibrary).toHaveBeenCalledTimes(3);
    });

    it("searchProgress가 진행 상황을 반영한다", async () => {
      let resolvers: Array<(value: LibrarySearchResult[]) => void> = [];

      vi.mocked(LibraryAPI.getLibrary).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvers.push(resolve);
          }),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      expect(result.current.searchProgress.totalLibraries).toBe(3);
      expect(result.current.searchProgress.isSearchingAll).toBe(true);

      // 첫 번째 도서관 검색 완료
      await act(async () => {
        resolvers[0](makeSearchResult("여주시립도서관", ["해리포터"]));
      });

      await vi.waitFor(() => {
        expect(result.current.searchProgress.completedLibraries).toBe(1);
      });
    });

    it("일부 도서관 검색이 실패해도 나머지 결과를 반환한다", async () => {
      let callCount = 0;
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error("네트워크 오류"));
        }
        return Promise.resolve(makeSearchResult("도서관", ["해리포터"]));
      });

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 3개 중 1개 실패 → 2개 성공 결과
      expect(result.current.aggregatedBooks).toHaveLength(2);
    });

    it("error 가 담긴 결과는 실패한 도서관으로 모은다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(({ libraryName }) =>
        Promise.resolve(
          libraryName === "강남도서관"
            ? [{ booklist: [], error: { msg: "Connect Timeout Error" } }]
            : makeSearchResult(libraryName, ["해리포터"]),
        ),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks).toHaveLength(2);
      expect(result.current.failedLibraries).toEqual(["강남도서관"]);
    });

    it("서버에서 접속할 수 없는 도서관은 실패한 도서관과 따로 모은다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(({ libraryName }) =>
        Promise.resolve(
          libraryName === "강남도서관"
            ? [{ booklist: [], error: { msg: "접속 불가", code: "UNREACHABLE" } }]
            : makeSearchResult(libraryName, ["해리포터"]),
        ),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.failedLibraries).toEqual([]);
      expect(result.current.unreachableLibraries).toEqual(["강남도서관"]);
    });

    it("동시 요청 수가 제한된다 (MAX_CONCURRENT_SEARCHES)", async () => {
      const fiveLibraries: Library[] = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        name: `도서관${i}`,
      }));

      let activeRequests = 0;
      let maxActiveRequests = 0;

      vi.mocked(LibraryAPI.getLibrary).mockImplementation(
        () =>
          new Promise((resolve) => {
            activeRequests++;
            maxActiveRequests = Math.max(maxActiveRequests, activeRequests);
            setTimeout(() => {
              activeRequests--;
              resolve(makeSearchResult("도서관", ["책"]));
            }, 10);
          }),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("책", DEFAULT_LIBRARY, fiveLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(maxActiveRequests).toBeLessThanOrEqual(3);
    });
  });

  describe("검색 취소 (cancelSearch)", () => {
    it("진행 중인 검색을 취소한다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ booklist: [] }]), 1000)),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.cancelSearch();
      });

      expect(result.current.isLoading).toBe(false);
    });

    it("새 검색이 이전 검색을 취소한다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue(
        makeSearchResult("도서관", ["두번째 결과"]),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("첫번째", "여주시립도서관", mockLibraries);
      });
      act(() => {
        result.current.performSearch("두번째", "여주시립도서관", mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // 마지막 검색의 결과만 표시
      expect(LibraryAPI.getLibrary).toHaveBeenCalledTimes(2);
    });
  });

  describe("clearResults", () => {
    it("검색 결과를 초기화한다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue(
        makeSearchResult("여주시립도서관", ["해리포터"]),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", "여주시립도서관", mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.aggregatedBooks).toHaveLength(1);

      act(() => {
        result.current.clearResults();
      });

      expect(result.current.aggregatedBooks).toEqual([]);
    });
  });

  describe("검색 측정", () => {
    it("전체 검색이 끝나면 도서관·실패·결과 수를 보낸다", async () => {
      let callCount = 0;
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(() => {
        callCount++;
        if (callCount === 2) {
          return Promise.reject(new Error("네트워크 오류"));
        }
        return Promise.resolve([
          {
            booklist: [
              { title: "해리포터 1", exist: true },
              { title: "해리포터 2", exist: false },
            ],
          },
        ]);
      });

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(trackSearchComplete).toHaveBeenCalledTimes(1);
      expect(trackSearchComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          libraryCount: 3,
          failedCount: 1,
          resultCount: 4,
          availableCount: 2,
        }),
      );
    });

    it("도서관 하나 검색이 실패해도 완료로 보낸다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockRejectedValue(new Error("네트워크 오류"));

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", "강남도서관", mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(trackSearchComplete).toHaveBeenCalledWith(
        expect.objectContaining({ libraryCount: 1, failedCount: 1, resultCount: 0 }),
      );
    });

    it("취소하면 search_cancel 만 보내고 완료는 보내지 않는다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([{ booklist: [] }]), 50)),
      );

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("해리포터", DEFAULT_LIBRARY, mockLibraries);
      });
      act(() => {
        result.current.cancelSearch();
      });

      expect(trackSearchCancel).toHaveBeenCalledWith(
        expect.objectContaining({ libraryCount: 3, completedCount: 0 }),
      );

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(trackSearchComplete).not.toHaveBeenCalled();
    });

    it("새 검색이 이전 검색을 대신하면 이전 검색은 완료로 보내지 않는다", async () => {
      vi.mocked(LibraryAPI.getLibrary).mockResolvedValue([{ booklist: [] }]);

      const { result } = renderHook(() => useBookSearch());

      act(() => {
        result.current.performSearch("첫번째", "강남도서관", mockLibraries);
        result.current.performSearch("두번째", "서울도서관", mockLibraries);
      });

      await vi.waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(trackSearchComplete).toHaveBeenCalledTimes(1);
    });
  });
});
