import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLibraries, modulesToLibraries } from "./useLibraries";
import { LibraryAPI } from "../api/library";

vi.mock("../data/libraryRegions.json", () => ({
  default: {
    경기도: { 여주시: { 여주: ["여주시립도서관", "여주어린이도서관"] } },
    서울특별시: { 강남구: { 서울: ["강남도서관"] }, 중구: { 서울: ["서울도서관"] } },
  },
}));

vi.mock("../api/library", () => ({
  LibraryAPI: {
    getModuleList: vi.fn(),
  },
}));

const mockModules = [
  { name: "여주", libraries: ["여주시립도서관", "여주어린이도서관"] },
  { name: "서울", libraries: ["강남도서관", "서울도서관"] },
];

describe("useLibraries", () => {
  beforeEach(() => {
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

  describe("지역 선택", () => {
    it("시도를 고르면 그 시도의 도서관만 남긴다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setSelectedRegion("서울특별시");
      });

      expect(result.current.baseLibraries.map((l) => l.name).sort()).toEqual(["강남도서관", "서울도서관"]);
    });

    it("시군구까지 고르면 그 시군구의 도서관만 남긴다", async () => {
      const result = await setupHook();

      act(() => {
        result.current.setSelectedRegion("서울특별시", "강남구");
      });

      expect(result.current.baseLibraries.map((l) => l.name)).toEqual(["강남도서관"]);
    });

    it("지역을 고르면 그 지역에 도서관이 있는 모듈만 남긴다", async () => {
      const result = await setupHook();
      await vi.waitFor(() => expect(result.current.modules).toHaveLength(2));

      expect(result.current.availableModules.map((m) => m.name)).toEqual(["여주", "서울"]);
      act(() => {
        result.current.setSelectedRegion("서울특별시", "중구");
      });

      expect(result.current.availableModules.map((m) => m.name)).toEqual(["서울"]);
    });

    it("지역과 모듈을 함께 고르면 둘 다에 맞는 도서관만 남긴다", async () => {
      const result = await setupHook();
      await vi.waitFor(() => expect(result.current.modules).toHaveLength(2));

      act(() => {
        result.current.setSelectedRegion("서울특별시", "중구");
      });
      act(() => {
        result.current.setSelectedModule("서울");
      });

      expect(result.current.selectedSido).toBe("서울특별시");
      expect(result.current.baseLibraries.map((l) => l.name)).toEqual(["서울도서관"]);
    });

    it("지역을 바꿀 때 고른 모듈이 새 지역에 없으면 모듈 선택만 푼다", async () => {
      const result = await setupHook();
      await vi.waitFor(() => expect(result.current.modules).toHaveLength(2));

      act(() => {
        result.current.setSelectedModule("서울");
      });
      act(() => {
        result.current.setSelectedRegion("서울특별시", "강남구");
      });
      expect(result.current.selectedModule).toBe("서울");

      act(() => {
        result.current.setSelectedRegion("경기도");
      });
      expect(result.current.selectedModule).toBe("");
      expect(result.current.baseLibraries.map((l) => l.name).sort()).toEqual(["여주시립도서관", "여주어린이도서관"]);
    });
  });

  describe("이름이 같은 도서관", () => {
    const modules = [
      { name: "안산시도서관", libraries: ["중앙도서관", "감골도서관"] },
      { name: "천안시도서관", libraries: ["중앙도서관"] },
    ];

    it("모듈명을 붙여 구분하고 실제 이름과 모듈을 담는다", () => {
      expect(modulesToLibraries(modules).map(({ name, libraryName, module }) => ({ name, libraryName, module }))).toEqual([
        { name: "감골도서관", libraryName: "감골도서관", module: "안산시도서관" },
        { name: "중앙도서관 (안산시도서관)", libraryName: "중앙도서관", module: "안산시도서관" },
        { name: "중앙도서관 (천안시도서관)", libraryName: "중앙도서관", module: "천안시도서관" },
      ]);
    });

    it("모듈을 고르면 그 모듈의 같은 이름 도서관만 남긴다", async () => {
      vi.mocked(LibraryAPI.getModuleList).mockResolvedValue(modules);
      const result = await setupHook();

      act(() => {
        result.current.setSelectedModule("천안시도서관");
      });

      expect(result.current.baseLibraries.map((l) => l.name)).toEqual(["중앙도서관 (천안시도서관)"]);
    });
  });
});
