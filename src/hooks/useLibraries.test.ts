import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLibraries } from "./useLibraries";
import { LibraryAPI } from "../api/library";

vi.mock("../api/library", () => ({
  LibraryAPI: {
    getLibraryNames: vi.fn(),
    getModuleList: vi.fn(),
  },
}));

const mockLibraryNames = [
  "여주시립도서관",
  "여주어린이도서관",
  "강남도서관",
  "서울도서관",
  "세종도서관",
];

const mockModules = [
  { name: "여주", libraries: ["여주시립도서관", "여주어린이도서관"] },
  { name: "서울", libraries: ["강남도서관", "서울도서관"] },
];

describe("useLibraries", () => {
  beforeEach(() => {
    vi.mocked(LibraryAPI.getLibraryNames).mockResolvedValue(mockLibraryNames);
    vi.mocked(LibraryAPI.getModuleList).mockResolvedValue(mockModules);
  });

  async function setupHook() {
    const { result } = renderHook(() => useLibraries());
    // API 호출 완료 대기
    await vi.waitFor(() => {
      expect(result.current.libraryNames.length).toBeGreaterThan(0);
    });
    return result;
  }

  describe("filteredLibraries - 도서관 이름 필터링", () => {
    it("filterText가 비어있으면 전체 도서관 목록을 반환한다", async () => {
      const result = await setupHook();
      expect(result.current.filteredLibraries).toEqual(result.current.baseLibraries);
    });

    it("filterText로 도서관 이름을 필터링한다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText("여주");
      });

      expect(result.current.filteredLibraries).toHaveLength(2);
      expect(result.current.filteredLibraries.map((l) => l.name)).toEqual(
        expect.arrayContaining(["여주시립도서관", "여주어린이도서관"]),
      );
    });

    it("filterText에 뒤쪽 공백이 있어도 정상 필터링된다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText("여주 ");
      });

      expect(result.current.filteredLibraries).toHaveLength(2);
      expect(result.current.filteredLibraries.map((l) => l.name)).toEqual(
        expect.arrayContaining(["여주시립도서관", "여주어린이도서관"]),
      );
    });

    it("filterText에 앞쪽 공백이 있어도 정상 필터링된다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText(" 여주");
      });

      expect(result.current.filteredLibraries).toHaveLength(2);
    });

    it("filterText에 양쪽 공백이 있어도 정상 필터링된다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText("  여주  ");
      });

      expect(result.current.filteredLibraries).toHaveLength(2);
    });

    it("공백만 입력하면 전체 목록을 반환한다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText("   ");
      });

      expect(result.current.filteredLibraries).toEqual(result.current.baseLibraries);
    });

    it("일치하는 도서관이 없으면 빈 배열을 반환한다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText("존재하지않는도서관");
      });

      expect(result.current.filteredLibraries).toHaveLength(0);
    });
  });

  describe("모듈 선택", () => {
    it("모듈 선택 시 해당 모듈의 도서관만 baseLibraries에 포함된다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setSelectedModule("여주");
      });

      await vi.waitFor(() => {
        expect(result.current.baseLibraries).toHaveLength(2);
      });

      expect(result.current.baseLibraries.map((l) => l.name)).toEqual(
        expect.arrayContaining(["여주시립도서관", "여주어린이도서관"]),
      );
    });

    it("모듈 선택 시 filterText가 초기화된다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setFilterText("서울");
      });

      act(() => {
        result.current.setSelectedModule("여주");
      });

      expect(result.current.filterText).toBe("");
    });
  });
});
