import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchManager } from "./useSearchManager";
import { DEFAULT_LIBRARY } from "../constants";
import type { Library } from "../types";

// URL 유틸리티 모킹
vi.mock("../utils/url", () => ({
  getUrlParams: vi.fn(() => ({ title: "", library: DEFAULT_LIBRARY })),
  updateUrl: vi.fn(),
}));

vi.mock("../analytics", () => ({
  trackSearch: vi.fn(),
}));

import { getUrlParams, updateUrl } from "../utils/url";
import { trackSearch } from "../analytics";

const mockLibraries: Library[] = [
  { id: 0, name: "여주시립도서관" },
  { id: 1, name: "여주어린이도서관" },
  { id: 2, name: "강남도서관" },
  { id: 3, name: "서울도서관" },
];

const filteredYeoju: Library[] = [
  { id: 0, name: "여주시립도서관" },
  { id: 1, name: "여주어린이도서관" },
];

type SearchManagerParams = Parameters<typeof useSearchManager>[0];

function createMockParams(overrides?: Partial<SearchManagerParams>): SearchManagerParams {
  return {
    libraryNames: mockLibraries,
    filteredLibraries: mockLibraries,
    performSearch: vi.fn(),
    clearResults: vi.fn(),
    resetFilters: vi.fn(),
    addToHistory: vi.fn(),
    ...overrides,
  };
}

describe("useSearchManager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getUrlParams).mockReturnValue({ title: "", library: DEFAULT_LIBRARY });
  });

  describe("초기 상태", () => {
    it("URL 파라미터에서 초기값을 가져온다", () => {
      vi.mocked(getUrlParams).mockReturnValue({
        title: "해리포터",
        library: "여주시립도서관",
      });

      const params = createMockParams();
      const { result } = renderHook(() => useSearchManager(params));

      expect(result.current.searchText).toBe("해리포터");
      expect(result.current.libraryName).toBe("여주시립도서관");
    });

    it("URL 파라미터가 없으면 기본값을 사용한다", () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchManager(params));

      expect(result.current.searchText).toBe("");
      expect(result.current.libraryName).toBe(DEFAULT_LIBRARY);
    });
  });

  describe("URL 파라미터 기반 초기 검색", () => {
    it("URL에 title이 있고 libraryNames가 로드되면 자동 검색한다", () => {
      vi.mocked(getUrlParams).mockReturnValue({
        title: "해리포터",
        library: DEFAULT_LIBRARY,
      });

      const params = createMockParams();
      renderHook(() => useSearchManager(params));

      expect(params.performSearch).toHaveBeenCalledWith(
        "해리포터",
        DEFAULT_LIBRARY,
        mockLibraries,
      );
    });

    it("북마클릿으로 도서관 없이 들어오면 내 도서관만 검색한다", () => {
      vi.mocked(getUrlParams).mockReturnValue({ title: "해리포터", library: DEFAULT_LIBRARY, ref: "bm" });

      const params = createMockParams({ myLibraries: ["강남도서관", "없는도서관"] });
      const { result } = renderHook(() => useSearchManager(params));

      expect(params.performSearch).toHaveBeenCalledWith("해리포터", DEFAULT_LIBRARY, [
        { id: 2, name: "강남도서관" },
      ]);
      expect(result.current.searchText).toBe("해리포터");
    });

    it("북마클릿 범위가 살아 있으면 검색 버튼도 내 도서관만 검색한다", () => {
      vi.mocked(getUrlParams).mockReturnValue({ title: "해리포터", library: DEFAULT_LIBRARY, ref: "bm" });

      const params = createMockParams({ myLibraries: ["강남도서관"] });
      const { result } = renderHook(() => useSearchManager(params));
      expect(result.current.scopeLibraries).toEqual([{ id: 2, name: "강남도서관" }]);

      act(() => result.current.handleSearch());

      expect(params.performSearch).toHaveBeenLastCalledWith("해리포터", DEFAULT_LIBRARY, [
        { id: 2, name: "강남도서관" },
      ]);
    });

    it("도서관이나 필터 목록을 바꾸면 내 도서관 범위가 풀린다", () => {
      vi.mocked(getUrlParams).mockReturnValue({ title: "해리포터", library: DEFAULT_LIBRARY, ref: "bm" });

      const params = createMockParams({ myLibraries: ["강남도서관"] });
      const { result, rerender } = renderHook((p: SearchManagerParams) => useSearchManager(p), {
        initialProps: params,
      });

      rerender({ ...params, filteredLibraries: filteredYeoju });
      expect(result.current.scopeLibraries).toBeUndefined();
      act(() => result.current.handleSearch());
      expect(params.performSearch).toHaveBeenLastCalledWith("해리포터", DEFAULT_LIBRARY, filteredYeoju);

      rerender(params);
      act(() => result.current.setLibraryName("서울도서관"));
      expect(result.current.scopeLibraries).toBeUndefined();
    });

    it("북마클릿으로 들어왔는데 내 도서관이 없으면 제목만 채우고 검색하지 않는다", () => {
      vi.mocked(getUrlParams).mockReturnValue({ title: "해리포터", library: DEFAULT_LIBRARY, ref: "bm" });

      const params = createMockParams({ myLibraries: [] });
      const { result } = renderHook(() => useSearchManager(params));

      expect(params.performSearch).not.toHaveBeenCalled();
      expect(result.current.searchText).toBe("해리포터");
    });

    it("ref 가 있어도 도서관이 정해져 있으면 그 도서관을 검색한다", () => {
      vi.mocked(getUrlParams).mockReturnValue({ title: "해리포터", library: "강남도서관", ref: "bm" });

      const params = createMockParams({ myLibraries: ["서울도서관"] });
      renderHook(() => useSearchManager(params));

      expect(params.performSearch).toHaveBeenCalledWith("해리포터", "강남도서관", mockLibraries);
    });

    it("URL에 title이 없으면 자동 검색하지 않는다", () => {
      const params = createMockParams();
      renderHook(() => useSearchManager(params));

      expect(params.performSearch).not.toHaveBeenCalled();
    });

    it("libraryNames가 비어있으면 자동 검색하지 않는다", () => {
      vi.mocked(getUrlParams).mockReturnValue({
        title: "해리포터",
        library: DEFAULT_LIBRARY,
      });

      const params = createMockParams();
      params.libraryNames = [];
      renderHook(() => useSearchManager(params));

      expect(params.performSearch).not.toHaveBeenCalled();
    });
  });

  describe("handleSearch", () => {
    it("도서관 하나를 골라 검색하면 내 도서관에 남긴다", () => {
      const params = createMockParams({ addToMyLibraries: vi.fn() });
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.setSearchText("어린왕자");
        result.current.setLibraryName("여주시립도서관");
      });
      act(() => {
        result.current.handleSearch();
      });

      expect(params.addToMyLibraries).toHaveBeenCalledWith("여주시립도서관");
    });

    it("여러 도서관을 검색하면 내 도서관에 남기지 않는다", () => {
      const params = createMockParams({ addToMyLibraries: vi.fn() });
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.setSearchText("어린왕자");
      });
      act(() => {
        result.current.handleSearch();
      });

      expect(params.addToMyLibraries).not.toHaveBeenCalled();
    });

    it("검색 시 URL 업데이트, 히스토리 추가, 검색 수행을 한다", () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.setSearchText("어린왕자");
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(params.resetFilters).toHaveBeenCalled();
      expect(params.addToHistory).toHaveBeenCalledWith("어린왕자");
      expect(updateUrl).toHaveBeenCalledWith("어린왕자", DEFAULT_LIBRARY);
      expect(params.performSearch).toHaveBeenCalledWith(
        "어린왕자",
        DEFAULT_LIBRARY,
        mockLibraries,
      );
    });

    it("검색어가 비어있으면 검색하지 않는다", () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.handleSearch();
      });

      expect(params.performSearch).not.toHaveBeenCalled();
      expect(params.addToHistory).not.toHaveBeenCalled();
    });

    it("도서관을 지정하여 검색할 수 있다", () => {
      const params = createMockParams();
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.setSearchText("해리포터");
        result.current.setLibraryName("여주시립도서관");
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(updateUrl).toHaveBeenCalledWith("해리포터", "여주시립도서관");
      expect(params.performSearch).toHaveBeenCalledWith(
        "해리포터",
        "여주시립도서관",
        mockLibraries,
      );
    });
  });

  describe("필터링된 도서관으로 전체 검색", () => {
    it("도서관 필터가 적용된 상태에서 전체 검색 시 필터링된 도서관만 검색한다", () => {
      const params = createMockParams({ filteredLibraries: filteredYeoju });
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.setSearchText("해리포터");
      });

      act(() => {
        result.current.handleSearch();
      });

      // DEFAULT_LIBRARY(전체 검색)일 때 filteredLibraries를 사용해야 한다
      expect(params.performSearch).toHaveBeenCalledWith(
        "해리포터",
        DEFAULT_LIBRARY,
        filteredYeoju,
      );
    });

    it("특정 도서관을 선택한 경우 filteredLibraries와 무관하게 해당 도서관으로 검색한다", () => {
      const params = createMockParams({ filteredLibraries: filteredYeoju });
      const { result } = renderHook(() => useSearchManager(params));

      act(() => {
        result.current.setSearchText("해리포터");
        result.current.setLibraryName("강남도서관");
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(params.performSearch).toHaveBeenCalledWith(
        "해리포터",
        "강남도서관",
        filteredYeoju,
      );
    });

    it("필터가 변경되면 다음 검색에 반영된다", () => {
      const params = createMockParams({ filteredLibraries: filteredYeoju });
      const { result, rerender } = renderHook(
        (props) => useSearchManager(props),
        { initialProps: params },
      );

      // 필터가 변경됨 (전체 도서관으로 복원)
      const updatedParams = { ...params, filteredLibraries: mockLibraries };
      rerender(updatedParams);

      act(() => {
        result.current.setSearchText("해리포터");
      });

      act(() => {
        result.current.handleSearch();
      });

      expect(updatedParams.performSearch).toHaveBeenCalledWith(
        "해리포터",
        DEFAULT_LIBRARY,
        mockLibraries,
      );
    });
  });

  describe("popstate (뒤로가기/앞으로가기)", () => {
    it("popstate 이벤트 시 URL 파라미터로 검색을 수행한다", () => {
      const params = createMockParams();
      renderHook(() => useSearchManager(params));

      vi.mocked(getUrlParams).mockReturnValue({
        title: "데미안",
        library: "강남도서관",
      });

      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(params.performSearch).toHaveBeenCalledWith("데미안", "강남도서관", mockLibraries);
    });

    it("popstate에서 title이 없으면 결과를 초기화한다", () => {
      const params = createMockParams();
      renderHook(() => useSearchManager(params));

      vi.mocked(getUrlParams).mockReturnValue({ title: "", library: DEFAULT_LIBRARY });

      act(() => {
        window.dispatchEvent(new PopStateEvent("popstate"));
      });

      expect(params.clearResults).toHaveBeenCalled();
    });
  });

  describe("검색 측정 (trackSearch)", () => {
    const search = (params: SearchManagerParams, libraryName?: string) => {
      const { result } = renderHook(() => useSearchManager(params));
      act(() => {
        result.current.setSearchText("해리포터");
        if (libraryName) result.current.setLibraryName(libraryName);
      });
      act(() => {
        result.current.handleSearch();
      });
    };

    it("도서관을 고르지 않고 필터도 없으면 all 로 보낸다", () => {
      search(createMockParams());

      expect(trackSearch).toHaveBeenCalledWith("해리포터", DEFAULT_LIBRARY, "all", 4);
    });

    it("필터로 좁힌 전체 검색은 group 으로 보낸다", () => {
      search(createMockParams({ filteredLibraries: filteredYeoju }));

      expect(trackSearch).toHaveBeenCalledWith("해리포터", DEFAULT_LIBRARY, "group", 2);
    });

    it("도서관을 고르면 single 로 보낸다", () => {
      search(createMockParams({ filteredLibraries: filteredYeoju }), "강남도서관");

      expect(trackSearch).toHaveBeenCalledWith("해리포터", "강남도서관", "single", 1);
    });
  });
});
