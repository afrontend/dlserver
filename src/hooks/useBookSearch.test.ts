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
});
