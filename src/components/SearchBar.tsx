import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { SearchHistoryDropdown } from "./SearchHistoryDropdown";

interface SearchBarProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onCancel: () => void;
  isLoading: boolean;
  searchHistory?: string[];
  onHistorySelect?: (query: string) => void;
  onHistoryClear?: () => void;
}

export const SearchBar = ({
  searchText,
  onSearchTextChange,
  onSearch,
  onCancel,
  isLoading,
  searchHistory,
  onHistorySelect,
  onHistoryClear,
}: SearchBarProps) => {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<number | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsHistoryOpen(false);
      onSearch();
    } else if (e.key === "Escape") {
      setIsHistoryOpen(false);
    }
  };

  const handleFocus = () => {
    if (searchHistory && searchHistory.length > 0) {
      setIsHistoryOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay closing to allow click on dropdown items
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsHistoryOpen(false);
    }, 150);
  };

  const handleHistorySelect = (query: string) => {
    onSearchTextChange(query);
    setIsHistoryOpen(false);
    onHistorySelect?.(query);
  };

  const handleHistoryClear = () => {
    setIsHistoryOpen(false);
    onHistoryClear?.();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
      <div className="relative flex-grow" ref={containerRef}>
        <input
          type="text"
          value={searchText}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onSearchTextChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
          placeholder="책 이름을 입력하세요."
          data-testid="search-input"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => onSearchTextChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
            data-testid="clear-button"
          >
            <i className="fa fa-trash-o" />
          </button>
        )}
        {isHistoryOpen && searchHistory && searchHistory.length > 0 && (
          <SearchHistoryDropdown
            history={searchHistory}
            onSelect={handleHistorySelect}
            onClear={handleHistoryClear}
          />
        )}
      </div>
      {isLoading ? (
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-red-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-red-600 active:bg-red-700 text-center font-medium min-h-[48px] min-w-[80px] transition-colors"
          data-testid="cancel-button"
        >
          취소
        </button>
      ) : (
        <button
          type="button"
          onClick={onSearch}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-blue-600 active:bg-blue-700 text-center font-medium min-h-[48px] min-w-[80px] transition-colors"
          data-testid="search-button"
        >
          검색
        </button>
      )}
    </div>
  );
};
