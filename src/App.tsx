import { useCallback, useEffect, useMemo, useRef } from "react";
import { trackMyLibrarySelect, trackPageView } from "./analytics";
import { BookList } from "./components/BookList";
import { StepWizard } from "./components/StepWizard";
import { Header } from "./components/Header";
import { SearchProgressBar } from "./components/SearchProgress";
import { LibraryTagFilter } from "./components/LibraryTagFilter";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { useMyLibraries } from "./hooks/useMyLibraries";
import { useBookSearch } from "./hooks/useBookSearch";
import { useLibraries } from "./hooks/useLibraries";
import { useBookFilters } from "./hooks/useBookFilters";
import { useSearchManager } from "./hooks/useSearchManager";
import { DEFAULT_LIBRARY } from "./constants";
import { getRegionList } from "./utils/regions";

const REGIONS = getRegionList();

const App = () => {
  const pageViewTrackedRef = useRef(false);
  const { history, addToHistory, clearHistory } = useSearchHistory();
  const { myLibraries, addMyLibrary, removeMyLibrary } = useMyLibraries();

  const {
    isLoading,
    searchProgress,
    aggregatedBooks,
    failedLibraries,
    performSearch,
    cancelSearch,
    clearResults,
  } = useBookSearch();
  const {
    libraryNames,
    filteredLibraries,
    filterText,
    setFilterText,
    availableModules,
    selectedModule,
    setSelectedModule,
    selectedSido,
    selectedSigungu,
    setSelectedRegion,
  } = useLibraries();
  const {
    displayedBooks,
    hideRented,
    setHideRented,
    selectedLibraryTags,
    setSelectedLibraryTags,
    resetFilters,
  } = useBookFilters(aggregatedBooks);

  const {
    searchText,
    setSearchText,
    libraryName,
    setLibraryName,
    handleSearch,
  } = useSearchManager({
    libraryNames,
    filteredLibraries,
    performSearch,
    clearResults,
    resetFilters,
    addToHistory,
    addToMyLibraries: addMyLibrary,
  });

  const handleModuleChange = useCallback(
    (moduleName: string) => {
      setSelectedModule(moduleName);
      setLibraryName(DEFAULT_LIBRARY);
    },
    [setSelectedModule, setLibraryName],
  );

  const handleRegionChange = useCallback(
    (sido: string, sigungu: string) => {
      setSelectedRegion(sido, sigungu);
      setLibraryName(DEFAULT_LIBRARY);
    },
    [setSelectedRegion, setLibraryName],
  );

  // 서버 목록에서 빠진 도서관은 골라도 검색되지 않으므로 숨긴다
  const availableMyLibraries = useMemo(
    () => myLibraries.filter((name) => libraryNames.some((lib) => lib.name === name)),
    [myLibraries, libraryNames],
  );

  // 지역·모듈·이름 필터가 걸려 있으면 도서관 목록에서 고른 도서관이 빠질 수 있어 함께 푼다
  const handleMyLibrarySelect = useCallback(
    (name: string) => {
      setSelectedRegion("");
      setSelectedModule("");
      setLibraryName(name);
      trackMyLibrarySelect();
    },
    [setSelectedRegion, setSelectedModule, setLibraryName],
  );

  useEffect(() => {
    if (pageViewTrackedRef.current) {
      return;
    }

    pageViewTrackedRef.current = true;
    trackPageView();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 md:p-8 pb-8 max-w-4xl mx-auto safe-area-inset">
        <Header />
        <div className="space-y-4">
          <StepWizard
            searchText={searchText}
            onSearchTextChange={setSearchText}
            searchHistory={history}
            onHistorySelect={setSearchText}
            onHistoryClear={clearHistory}
            filteredLibraries={filteredLibraries}
            selectedLibrary={libraryName}
            onLibraryChange={setLibraryName}
            myLibraries={availableMyLibraries}
            onMyLibrarySelect={handleMyLibrarySelect}
            onMyLibraryRemove={removeMyLibrary}
            filterText={filterText}
            onFilterChange={setFilterText}
            modules={availableModules}
            selectedModule={selectedModule}
            onModuleChange={handleModuleChange}
            regions={REGIONS}
            selectedSido={selectedSido}
            selectedSigungu={selectedSigungu}
            onRegionChange={handleRegionChange}
            onSearch={handleSearch}
            onCancel={cancelSearch}
            isLoading={isLoading}
          />
          <SearchProgressBar progress={searchProgress} />
          <LibraryTagFilter
            books={aggregatedBooks}
            selectedLibraries={selectedLibraryTags}
            onSelectionChange={setSelectedLibraryTags}
            disabled={isLoading}
          />
          <BookList
            books={displayedBooks}
            totalBooks={aggregatedBooks.length}
            failedLibraries={failedLibraries}
            isLoading={isLoading}
            hideRented={hideRented}
            onHideRentedChange={setHideRented}
          />
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default App;
