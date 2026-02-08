import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSearchHistory } from "./useSearchHistory";

const STORAGE_KEY = "dlserver-search-history";

describe("useSearchHistory", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("returns empty history initially", () => {
    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("loads history from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["query1", "query2"]));

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(["query1", "query2"]);
  });

  it("adds new item to history", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("해리포터");
    });

    expect(result.current.history).toEqual(["해리포터"]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual(["해리포터"]);
  });

  it("adds item to front of history", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["query1", "query2"]));
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("query3");
    });

    expect(result.current.history).toEqual(["query3", "query1", "query2"]);
  });

  it("deduplicates by moving existing item to top", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["query1", "query2", "query3"]));
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("query2");
    });

    expect(result.current.history).toEqual(["query2", "query1", "query3"]);
  });

  it("limits history to 10 items", () => {
    const initialHistory = Array.from({ length: 10 }, (_, i) => `query${i + 1}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialHistory));
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("newQuery");
    });

    expect(result.current.history).toHaveLength(10);
    expect(result.current.history[0]).toBe("newQuery");
    expect(result.current.history[9]).toBe("query9");
    expect(result.current.history).not.toContain("query10");
  });

  it("trims whitespace from queries", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("  해리포터  ");
    });

    expect(result.current.history).toEqual(["해리포터"]);
  });

  it("ignores empty strings", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("");
    });

    expect(result.current.history).toEqual([]);
  });

  it("ignores whitespace-only strings", () => {
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.addToHistory("   ");
    });

    expect(result.current.history).toEqual([]);
  });

  it("clears all history", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["query1", "query2"]));
    const { result } = renderHook(() => useSearchHistory());

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toEqual([]);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toEqual([]);
  });

  it("handles malformed JSON in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json");

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("handles non-array data in localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ key: "value" }));

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual([]);
  });

  it("filters out non-string values from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["valid", 123, null, "also valid"]));

    const { result } = renderHook(() => useSearchHistory());
    expect(result.current.history).toEqual(["valid", "also valid"]);
  });

  it("handles localStorage errors gracefully when saving", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const { result } = renderHook(() => useSearchHistory());

    // Should not throw
    act(() => {
      result.current.addToHistory("query");
    });

    // State should still update even if localStorage fails
    expect(result.current.history).toEqual(["query"]);

    setItemSpy.mockRestore();
  });
});
