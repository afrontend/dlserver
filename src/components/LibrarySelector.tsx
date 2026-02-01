import type { ChangeEvent } from "react";
import type { Library } from "../types";

interface LibrarySelectorProps {
  libraryNames: Library[];
  selectedLibrary: string;
  onLibraryChange: (libraryName: string) => void;
  filterText: string;
  onFilterChange: (text: string) => void;
}

export const LibrarySelector = ({
  libraryNames,
  selectedLibrary,
  onLibraryChange,
  filterText,
  onFilterChange,
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
        className="w-full sm:w-48 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        placeholder="도서관 이름 검색..."
        value={filterText}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onFilterChange(e.target.value)
        }
      />
      <select
        className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] appearance-none bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E&quot;)] bg-[length:1.5rem_1.5rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
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
      <span className="text-sm text-gray-500 text-center sm:text-left">
        {filteredLibraries.length}개 도서관
      </span>
    </div>
  );
};
