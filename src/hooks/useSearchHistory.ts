import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "dlserver-search-history";
const MAX_HISTORY_ITEMS = 10;

export interface UseSearchHistoryReturn {
  history: string[];
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

function loadHistory(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    // Filter out non-string or empty values
    return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  } catch {
    return [];
  }
}

function saveHistory(history: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore localStorage errors (e.g., quota exceeded, private browsing)
  }
}

export function useSearchHistory(): UseSearchHistoryReturn {
  const [history, setHistory] = useState<string[]>(() => loadHistory());

  // Sync state with localStorage on mount (for SSR/hydration scenarios)
  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const addToHistory = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      // Remove existing occurrence (deduplication)
      const filtered = prev.filter((item) => item !== trimmed);
      // Add to front and limit to max items
      const updated = [trimmed, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      saveHistory(updated);
      return updated;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  return { history, addToHistory, clearHistory };
}
