import type { Book } from "../types";

interface LibraryTagFilterProps {
  books: Book[];
  selectedLibraries: Set<string>;
  onSelectionChange: (libraries: Set<string>) => void;
  disabled?: boolean;
}

interface LibraryCount {
  name: string;
  count: number;
  availableCount: number;
}

export const LibraryTagFilter = ({
  books,
  selectedLibraries,
  onSelectionChange,
  disabled = false,
}: LibraryTagFilterProps) => {
  // Calculate counts per library
  const libraryCounts: LibraryCount[] = books.reduce((acc, book) => {
    const libraryName = book.libraryName || "알 수 없음";
    const existing = acc.find((l) => l.name === libraryName);
    if (existing) {
      existing.count++;
      if (book.exist) existing.availableCount++;
    } else {
      acc.push({
        name: libraryName,
        count: 1,
        availableCount: book.exist ? 1 : 0,
      });
    }
    return acc;
  }, [] as LibraryCount[]);

  // Sort by name
  libraryCounts.sort((a, b) => a.name.localeCompare(b.name, "ko"));

  // Don't render if no books or only one library
  if (books.length === 0 || libraryCounts.length <= 1) {
    return null;
  }

  const handleTagClick = (libraryName: string) => {
    if (disabled) return;

    const newSelection = new Set(selectedLibraries);
    if (newSelection.has(libraryName)) {
      newSelection.delete(libraryName);
    } else {
      newSelection.add(libraryName);
    }
    onSelectionChange(newSelection);
  };

  const handleSelectAll = () => {
    if (disabled) return;
    onSelectionChange(new Set());
  };

  const isAllSelected = selectedLibraries.size === 0;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3"
      data-testid="library-tag-filter"
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-500 shrink-0">도서관 필터:</span>
        <button
          type="button"
          onClick={handleSelectAll}
          disabled={disabled}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            isAllSelected
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          data-testid="tag-all"
        >
          전체
        </button>
        {libraryCounts.map((library) => {
          const isSelected = selectedLibraries.has(library.name);
          return (
            <button
              type="button"
              key={library.name}
              onClick={() => handleTagClick(library.name)}
              disabled={disabled}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isSelected
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              data-testid={`tag-${library.name}`}
            >
              {library.name}
              <span
                className={`ml-1 ${isSelected ? "text-blue-100" : "text-gray-400"}`}
              >
                ({library.availableCount}/{library.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
