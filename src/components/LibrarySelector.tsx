import type { ChangeEvent } from "react";
import type { Library, ModuleInfo } from "../types";

interface LibrarySelectorProps {
  filteredLibraries: Library[];
  selectedLibrary: string;
  onLibraryChange: (libraryName: string) => void;
  filterText: string;
  onFilterChange: (text: string) => void;
  isLoading?: boolean;
  modules: ModuleInfo[];
  selectedModule: string;
  onModuleChange: (moduleName: string) => void;
}

export const LibrarySelector = ({
  filteredLibraries,
  selectedLibrary,
  onLibraryChange,
  filterText,
  onFilterChange,
  isLoading = false,
  modules,
  selectedModule,
  onModuleChange,
}: LibrarySelectorProps) => {
  return (
    <div>
      <div className="relative flex items-center">
        <select
          data-testid="module-select"
          disabled={isLoading}
          className={`w-full bg-transparent border-0 px-4 py-3 text-base focus:outline-none focus:ring-0 min-h-[48px] appearance-none pr-10 ${
            isLoading ? "text-gray-500 cursor-not-allowed" : ""
          }`}
          value={selectedModule}
          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
            onModuleChange(e.target.value)
          }
        >
          <option value="">
            도서관 모듈을 선택하세요. ({modules.length}개)
          </option>
          {modules.map((mod) => (
            <option key={mod.name} value={mod.name}>
              {mod.name}
            </option>
          ))}
        </select>
        {selectedModule && !isLoading && (
          <button
            type="button"
            data-testid="module-clear-button"
            onClick={() => onModuleChange("")}
            className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear module selection"
          >
            <i className="fa fa-trash-o" />
          </button>
        )}
      </div>
      <div className="border-t border-gray-100 grid grid-cols-1 sm:grid-cols-[3fr_2fr] gap-3">
        <div className="relative">
          <input
            type="text"
            data-testid="library-filter-input"
            disabled={isLoading || !!selectedModule}
            className={`w-full bg-transparent border-0 px-4 py-3 text-base focus:outline-none focus:ring-0 min-h-[48px] pr-10 placeholder-gray-400 ${
              isLoading || selectedModule ? "text-gray-500 cursor-not-allowed" : ""
            }`}
            placeholder="도서관 이름 검색..."
            value={filterText}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              onFilterChange(e.target.value)
            }
          />
          {filterText && !isLoading && (
            <button
              type="button"
              data-testid="library-filter-clear-button"
              onClick={() => onFilterChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear filter"
            >
              <i className="fa fa-trash-o" />
            </button>
          )}
        </div>
        <div className="relative flex items-center">
          <select
            data-testid="library-select"
            disabled={isLoading}
            className={`w-full bg-transparent border-0 px-4 py-3 text-base focus:outline-none focus:ring-0 min-h-[48px] appearance-none pr-10 ${
              isLoading ? "text-gray-500 cursor-not-allowed" : ""
            }`}
            value={selectedLibrary}
            onChange={(e: ChangeEvent<HTMLSelectElement>) =>
              onLibraryChange(e.target.value)
            }
          >
            <option value="도서관을 선택하세요.">
              도서관을 선택하세요. ({filteredLibraries.length}개)
            </option>
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
              <i className="fa fa-trash-o" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
