import { useCallback } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { StepIndicator } from "./StepIndicator";
import { SearchHistoryDropdown } from "./SearchHistoryDropdown";
import { useStepWizard } from "../hooks/useStepWizard";
import { useState, useRef, useEffect } from "react";
import type { Library, ModuleInfo } from "../types";

const STEPS = [
  { number: 1, label: "책 이름" },
  { number: 2, label: "도서관" },
  { number: 3, label: "검색" },
];

interface StepWizardProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  searchHistory?: string[];
  onHistorySelect?: (query: string) => void;
  onHistoryClear?: () => void;
  filteredLibraries: Library[];
  selectedLibrary: string;
  onLibraryChange: (name: string) => void;
  filterText: string;
  onFilterChange: (text: string) => void;
  modules: ModuleInfo[];
  selectedModule: string;
  onModuleChange: (name: string) => void;
  onSearch: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const StepWizard = ({
  searchText,
  onSearchTextChange,
  searchHistory,
  onHistorySelect,
  onHistoryClear,
  filteredLibraries,
  selectedLibrary,
  onLibraryChange,
  filterText,
  onFilterChange,
  modules,
  selectedModule,
  onModuleChange,
  onSearch,
  onCancel,
  isLoading,
}: StepWizardProps) => {
  const { currentStep, isStepCompleted, completeStep, goToStep } =
    useStepWizard();

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current);
    };
  }, []);

  const handleStep1KeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setIsHistoryOpen(false);
      if (searchText.trim()) {
        completeStep(1);
      }
    } else if (e.key === "Escape") {
      setIsHistoryOpen(false);
    }
  };

  const handleInputFocus = () => {
    if (searchHistory && searchHistory.length > 0) {
      setIsHistoryOpen(true);
    }
  };

  const handleInputBlur = () => {
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

  const handleStep2Skip = () => {
    onLibraryChange("도서관을 선택하세요.");
    completeStep(2);
  };

  const handleEditStep = useCallback(
    (step: number) => {
      goToStep(step);
    },
    [goToStep],
  );

  const getLibrarySummary = () => {
    const parts = [];
    if (selectedModule) parts.push(selectedModule);
    if (selectedLibrary === "도서관을 선택하세요.") {
      parts.push("전체 도서관");
    } else {
      parts.push(selectedLibrary);
    }
    return parts.join(" > ");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <StepIndicator
        steps={STEPS}
        currentStep={currentStep}
        isStepCompleted={isStepCompleted}
        onStepClick={handleEditStep}
      />

      <div className="border-t border-gray-100">
        {/* Step 1: Book name */}
        {currentStep === 1 && !isStepCompleted(1) ? (
          <div className="p-4" data-testid="step-1-content">
            <p className="text-sm text-gray-500 mb-2">어떤 책을 찾으시나요?</p>
            <div className="relative">
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 p-1 transition-colors"
                onClick={() => searchText.trim() && completeStep(1)}
                aria-label="Search"
                data-testid="search-button"
              >
                <i className="fa fa-search" />
              </button>
              <input
                type="text"
                value={searchText}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  onSearchTextChange(e.target.value)
                }
                onKeyDown={handleStep1KeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px] placeholder-gray-400"
                placeholder="책 이름을 입력하세요."
                data-testid="search-input"
                autoFocus
              />
              {searchText && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  onClick={() => onSearchTextChange("")}
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
            {searchText.trim() && (
              <button
                type="button"
                onClick={() => completeStep(1)}
                className="mt-3 w-full py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                data-testid="step-1-next"
              >
                다음 단계 →
              </button>
            )}
          </div>
        ) : isStepCompleted(1) ? (
          <div
            className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            data-testid="step-1-summary"
            onClick={() => handleEditStep(1)}
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-500"><i className="fa fa-book" /></span>
              <span className="font-medium">{searchText}</span>
            </div>
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-blue-500"
              data-testid="step-1-edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEditStep(1);
              }}
            >
              수정
            </button>
          </div>
        ) : null}

        {/* Step 2: Library selection */}
        {currentStep === 2 && !isStepCompleted(2) ? (
          <div className="p-4 border-t border-gray-100" data-testid="step-2-content">
            <p className="text-sm text-gray-500 mb-2">
              도서관을 선택하세요. (선택하지 않으면 전체 검색)
            </p>
            <div className="space-y-3">
              {modules.length > 0 && (
                <div className="relative">
                  <select
                    data-testid="module-select"
                    disabled={isLoading}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] appearance-none pr-10"
                    value={selectedModule}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                      onModuleChange(e.target.value)
                    }
                  >
                    <option value="">모듈 선택 ({modules.length}개)</option>
                    {modules.map((mod) => (
                      <option key={mod.name} value={mod.name}>
                        {mod.name}
                      </option>
                    ))}
                  </select>
                  {selectedModule && (
                    <button
                      type="button"
                      data-testid="module-clear-button"
                      onClick={() => onModuleChange("")}
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      <i className="fa fa-trash-o" />
                    </button>
                  )}
                </div>
              )}
              <div className="relative">
                <input
                  type="text"
                  data-testid="library-filter-input"
                  disabled={isLoading}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] pr-10 placeholder-gray-400"
                  placeholder="도서관 이름 검색..."
                  value={filterText}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    onFilterChange(e.target.value)
                  }
                />
                {filterText && (
                  <button
                    type="button"
                    data-testid="library-filter-clear-button"
                    onClick={() => onFilterChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  >
                    <i className="fa fa-trash-o" />
                  </button>
                )}
              </div>
              <div className="relative">
                <select
                  data-testid="library-select"
                  disabled={isLoading}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] appearance-none pr-10"
                  value={selectedLibrary}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                    onLibraryChange(e.target.value);
                    if (e.target.value !== "도서관을 선택하세요.") {
                      completeStep(2);
                    }
                  }}
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
              </div>
            </div>
            <button
              type="button"
              onClick={handleStep2Skip}
              className="mt-3 w-full py-2 text-sm text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
              data-testid="step-2-skip"
            >
              전체 도서관에서 검색 →
            </button>
          </div>
        ) : isStepCompleted(2) ? (
          <div
            className="px-4 py-3 border-t border-gray-100 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
            data-testid="step-2-summary"
            onClick={() => handleEditStep(2)}
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-500"><i className="fa fa-university" /></span>
              <span className="font-medium">{getLibrarySummary()}</span>
            </div>
            <button
              type="button"
              className="text-sm text-gray-400 hover:text-blue-500"
              data-testid="step-2-edit"
              onClick={(e) => {
                e.stopPropagation();
                handleEditStep(2);
              }}
            >
              수정
            </button>
          </div>
        ) : currentStep < 2 ? (
          <div className="px-4 py-3 border-t border-gray-100 text-gray-300 text-sm" data-testid="step-2-disabled">
            <i className="fa fa-university mr-2" />
            도서관 선택
          </div>
        ) : null}

        {/* Step 3: Search */}
        {currentStep === 3 && !isStepCompleted(3) ? (
          <div className="p-4 border-t border-gray-100" data-testid="step-3-content">
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <p className="text-sm text-gray-500 mb-1">검색 요약</p>
              <p className="text-sm">
                <span className="font-medium">{searchText}</span>
                <span className="text-gray-400 mx-1">·</span>
                <span className="text-gray-600">{getLibrarySummary()}</span>
              </p>
            </div>
            {isLoading ? (
              <button
                type="button"
                onClick={onCancel}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium bg-red-400 hover:bg-red-500 transition-colors"
                data-testid="cancel-button"
              >
                <i className="fa fa-spinner fa-spin" />
                취소
              </button>
            ) : (
              <button
                type="button"
                onClick={onSearch}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors"
                data-testid="search-submit-button"
              >
                <i className="fa fa-search" />
                검색하기
              </button>
            )}
          </div>
        ) : currentStep < 3 ? (
          <div className="px-4 py-3 border-t border-gray-100 text-gray-300 text-sm" data-testid="step-3-disabled">
            <i className="fa fa-search mr-2" />
            검색
          </div>
        ) : null}
      </div>
    </div>
  );
};
