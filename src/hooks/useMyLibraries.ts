import { useState, useCallback } from "react";

const STORAGE_KEY = "dlserver-my-libraries";
const MAX_MY_LIBRARIES = 5;

export interface UseMyLibrariesReturn {
  myLibraries: string[];
  addMyLibrary: (name: string) => void;
  removeMyLibrary: (name: string) => void;
}

function loadMyLibraries(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

function saveMyLibraries(names: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded, private browsing)
  }
}

/**
 * 도서관 하나를 골라 검색한 기록을 "내 도서관"으로 남긴다. 최근에 쓴 도서관이 앞에 온다.
 */
export function useMyLibraries(): UseMyLibrariesReturn {
  const [myLibraries, setMyLibraries] = useState<string[]>(() => loadMyLibraries());

  const addMyLibrary = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setMyLibraries((prev) => {
      const updated = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, MAX_MY_LIBRARIES);
      saveMyLibraries(updated);
      return updated;
    });
  }, []);

  const removeMyLibrary = useCallback((name: string) => {
    setMyLibraries((prev) => {
      const updated = prev.filter((item) => item !== name);
      saveMyLibraries(updated);
      return updated;
    });
  }, []);

  return { myLibraries, addMyLibrary, removeMyLibrary };
}
