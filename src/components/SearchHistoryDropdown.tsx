interface SearchHistoryDropdownProps {
  history: string[];
  onSelect: (query: string) => void;
  onClear: () => void;
}

export const SearchHistoryDropdown = ({
  history,
  onSelect,
  onClear,
}: SearchHistoryDropdownProps) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div
      className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-gray-300 rounded-lg shadow-lg"
      data-testid="search-history-dropdown"
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200">
        <span className="text-sm text-gray-600 font-medium">최근 검색</span>
        <button
          type="button"
          onClick={onClear}
          className="text-sm text-gray-500 hover:text-gray-700"
          data-testid="clear-history-button"
        >
          전체 삭제
        </button>
      </div>
      <ul className="max-h-60 overflow-y-auto" data-testid="history-list">
        {history.map((query, index) => (
          <li key={`${query}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(query)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              data-testid={`history-item-${index}`}
            >
              <i className="fa fa-history text-gray-400" />
              <span className="truncate">{query}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
