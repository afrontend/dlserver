import type { ChangeEvent } from "react";
import type { Library } from "../types";

interface LibrarySelectorProps {
  libraryNames: Library[];
  selectedLibrary: string;
  onLibraryChange: (libraryName: string) => void;
  filterText: string;
  onFilterChange: (text: string) => void;
  isLoading?: boolean;
}

export const LibrarySelector = ({
  libraryNames,
  selectedLibrary,
  onLibraryChange,
  filterText,
  onFilterChange,
  isLoading = false,
}: LibrarySelectorProps) => {
  const filteredLibraries = filterText?.trim()
    ? libraryNames.filter(
        (lib) =>
          lib.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1,
      )
    : libraryNames;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
      <input
        type="text"
        data-testid="library-filter-input"
        disabled={isLoading}
        className={`w-full sm:w-48 border rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] ${
          isLoading
            ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
            : "border-gray-300"
        }`}
        placeholder="도서관 이름 검색..."
        value={filterText}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onFilterChange(e.target.value)
        }
      />
      <div className="relative flex items-center">
        <select
          data-testid="library-select"
          disabled={isLoading}
          className={`w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] appearance-none bg-[length:1.5rem_1.5rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${
            isLoading
              ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200"
              : "bg-white"
          }`}
          value={selectedLibrary}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onLibraryChange(e.target.value)
          }
        >
          <option value="도서관을 선택하세요.">도서관을 선택하세요.</option>
          {filteredLibraries.map((lib) => (
            <option key={lib.id} value={lib.name}>
              {lib.name}
            </option>
          ))}
        </select>
        {selectedLibrary !== "도서관을 선택하세요." && !isLoading && (
          <button
            type="button"
            data-testid="library-clear-button"
            onClick={() => onLibraryChange("도서관을 선택하세요.")}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear library selection"
          >
            <i className="fa fa-times" />
          </button>
        )}
      </div>
      <span className="text-sm text-gray-500 text-center sm:text-left">
        {filteredLibraries.length}개 도서관
      </span>
    </div>
  );
};
