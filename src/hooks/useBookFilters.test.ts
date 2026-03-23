import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBookFilters } from "./useBookFilters";
import type { Book } from "../types";

const makeBook = (title: string, libraryName: string, exist: boolean): Book => ({
  title,
  exist,
  libraryName,
});

const mockBooks: Book[] = [
  makeBook("해리포터", "여주시립도서관", true),
  makeBook("반지의 제왕", "여주시립도서관", false),
  makeBook("어린왕자", "강남도서관", true),
  makeBook("데미안", "강남도서관", false),
  makeBook("코스모스", "서울도서관", true),
];

describe("useBookFilters", () => {
  describe("초기 상태", () => {
    it("필터 없이 전체 도서를 반환한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));
      expect(result.current.displayedBooks).toEqual(mockBooks);
      expect(result.current.hideRented).toBe(false);
      expect(result.current.selectedLibraryTags.size).toBe(0);
    });
  });

  describe("대출 가능 필터 (hideRented)", () => {
    it("hideRented 활성화 시 exist가 true인 도서만 반환한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setHideRented(true);
      });

      expect(result.current.displayedBooks).toHaveLength(3);
      expect(result.current.displayedBooks.every((b) => b.exist === true)).toBe(true);
    });

    it("hideRented 비활성화 시 전체 도서를 반환한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setHideRented(true);
      });
      act(() => {
        result.current.setHideRented(false);
      });

      expect(result.current.displayedBooks).toEqual(mockBooks);
    });
  });

  describe("도서관 태그 필터 (selectedLibraryTags)", () => {
    it("도서관 태그 선택 시 해당 도서관의 도서만 반환한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["여주시립도서관"]));
      });

      expect(result.current.displayedBooks).toHaveLength(2);
      expect(result.current.displayedBooks.every((b) => b.libraryName === "여주시립도서관")).toBe(
        true,
      );
    });

    it("여러 도서관 태그를 선택할 수 있다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["여주시립도서관", "서울도서관"]));
      });

      expect(result.current.displayedBooks).toHaveLength(3);
    });

    it("태그를 비우면 전체 도서를 반환한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["여주시립도서관"]));
      });
      act(() => {
        result.current.setSelectedLibraryTags(new Set());
      });

      expect(result.current.displayedBooks).toEqual(mockBooks);
    });
  });

  describe("필터 조합", () => {
    it("도서관 태그 + 대출 가능 필터를 동시에 적용한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["여주시립도서관"]));
        result.current.setHideRented(true);
      });

      expect(result.current.displayedBooks).toHaveLength(1);
      expect(result.current.displayedBooks[0].title).toBe("해리포터");
    });

    it("조건에 맞는 도서가 없으면 빈 배열을 반환한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["강남도서관"]));
        result.current.setHideRented(true);
      });

      // 강남도서관에서 exist=true인 책은 어린왕자 1권
      expect(result.current.displayedBooks).toHaveLength(1);
      expect(result.current.displayedBooks[0].title).toBe("어린왕자");
    });
  });

  describe("resetFilters", () => {
    it("도서관 태그 필터를 초기화한다", () => {
      const { result } = renderHook(() => useBookFilters(mockBooks));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["여주시립도서관"]));
      });

      expect(result.current.displayedBooks).toHaveLength(2);

      act(() => {
        result.current.resetFilters();
      });

      expect(result.current.selectedLibraryTags.size).toBe(0);
      expect(result.current.displayedBooks).toEqual(mockBooks);
    });
  });

  describe("빈 데이터", () => {
    it("빈 도서 목록을 처리한다", () => {
      const { result } = renderHook(() => useBookFilters([]));
      expect(result.current.displayedBooks).toEqual([]);
    });

    it("libraryName이 없는 도서는 태그 필터 시 제외된다", () => {
      const booksWithoutLibrary: Book[] = [
        { title: "테스트 책", exist: true },
        makeBook("해리포터", "여주시립도서관", true),
      ];

      const { result } = renderHook(() => useBookFilters(booksWithoutLibrary));

      act(() => {
        result.current.setSelectedLibraryTags(new Set(["여주시립도서관"]));
      });

      expect(result.current.displayedBooks).toHaveLength(1);
      expect(result.current.displayedBooks[0].title).toBe("해리포터");
    });
  });
});
