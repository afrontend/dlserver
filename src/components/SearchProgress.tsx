import type { SearchProgress } from "../types";

interface SearchProgressProps {
  progress: SearchProgress;
}

export const SearchProgressBar = ({ progress }: SearchProgressProps) => {
  const { totalLibraries, completedLibraries, searchingLibraries, isSearchingAll } = progress;

  if (!isSearchingAll || totalLibraries === 0) {
    return null;
  }

  const percentage = Math.round((completedLibraries / totalLibraries) * 100);
  const isComplete = completedLibraries === totalLibraries;

  return (
    <div
      className="bg-blue-50 rounded-lg border border-blue-200 p-3 mb-4"
      data-testid="search-progress"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-blue-800">
          {isComplete ? (
            "검색 완료"
          ) : (
            <>
              검색 진행 중: {completedLibraries}/{totalLibraries} 도서관
            </>
          )}
        </span>
        <span className="text-sm text-blue-600">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
          data-testid="progress-bar"
        />
      </div>

      {/* Currently searching libraries */}
      {searchingLibraries.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-blue-700">
          <span className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="truncate">
            {searchingLibraries.slice(0, 3).join(", ")}
            {searchingLibraries.length > 3 && ` 외 ${searchingLibraries.length - 3}곳`}
          </span>
        </div>
      )}
    </div>
  );
};
