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
    <div className="relative" ref={containerRef}>
      {/* Left: search icon button */}
      <button
        type="button"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 p-1 transition-colors"
        onClick={onSearch}
        aria-label="Search"
        data-testid="search-button"
      >
        <i className="fa fa-search" />
      </button>

      {/* Input - borderless, inside card */}
      <input
        type="text"
        value={searchText}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onSearchTextChange(e.target.value)
        }
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className="w-full pl-10 pr-10 py-3 border-0 bg-transparent focus:outline-none focus:ring-0 text-base min-h-[48px] placeholder-gray-400"
        placeholder="책 이름을 입력하세요."
        data-testid="search-input"
      />

      {/* Right: loading spinner OR clear icon */}
      {isLoading ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 hover:text-red-600 p-1 transition-colors"
          onClick={onCancel}
          aria-label="Cancel search"
          data-testid="cancel-button"
        >
          <i className="fa fa-spinner fa-spin" />
        </button>
      ) : searchText ? (
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          onClick={() => onSearchTextChange("")}
          aria-label="Clear search"
          data-testid="clear-button"
        >
          <i className="fa fa-trash-o" />
        </button>
      ) : null}

      {/* History dropdown */}
      {isHistoryOpen && searchHistory && searchHistory.length > 0 && (
        <SearchHistoryDropdown
          history={searchHistory}
          onSelect={handleHistorySelect}
          onClear={handleHistoryClear}
        />
      )}
    </div>
  );
};
