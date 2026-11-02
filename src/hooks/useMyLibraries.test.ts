import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyLibraries } from "./useMyLibraries";

const STORAGE_KEY = "dlserver-my-libraries";

describe("useMyLibraries", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("처음에는 비어 있다", () => {
    const { result } = renderHook(() => useMyLibraries());
    expect(result.current.myLibraries).toEqual([]);
  });

  it("localStorage 에 저장된 목록을 읽는다", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["판교도서관", "중앙도서관"]));

    const { result } = renderHook(() => useMyLibraries());
    expect(result.current.myLibraries).toEqual(["판교도서관", "중앙도서관"]);
  });

  it("저장된 값이 깨져 있으면 빈 목록으로 시작한다", () => {
    localStorage.setItem(STORAGE_KEY, "{not json");

    const { result } = renderHook(() => useMyLibraries());
    expect(result.current.myLibraries).toEqual([]);
  });

  it("최근에 쓴 도서관을 앞에 두고 중복을 없앤다", () => {
    const { result } = renderHook(() => useMyLibraries());

    act(() => {
      result.current.addMyLibrary("판교도서관");
      result.current.addMyLibrary("중앙도서관");
      result.current.addMyLibrary("판교도서관");
    });

    expect(result.current.myLibraries).toEqual(["판교도서관", "중앙도서관"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual(["판교도서관", "중앙도서관"]);
  });

  it("5개까지만 남긴다", () => {
    const { result } = renderHook(() => useMyLibraries());

    act(() => {
      for (const name of ["가", "나", "다", "라", "마", "바"]) {
        result.current.addMyLibrary(name);
      }
    });

    expect(result.current.myLibraries).toEqual(["바", "마", "라", "다", "나"]);
  });

  it("도서관을 뺀다", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["판교도서관", "중앙도서관"]));
    const { result } = renderHook(() => useMyLibraries());

    act(() => {
      result.current.removeMyLibrary("판교도서관");
    });

    expect(result.current.myLibraries).toEqual(["중앙도서관"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual(["중앙도서관"]);
  });
});
