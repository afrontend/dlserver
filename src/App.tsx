import { useCallback, useEffect, useMemo, useRef } from "react";
import { trackMyLibrarySelect, trackPageView, trackSearch } from "./analytics";
import { BookList } from "./components/BookList";
import { EmptyResultHelp } from "./components/EmptyResultHelp";
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
    unreachableLibraries,
    lastSearch,
    performSearch,
    refreshSearch,
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

  // 도서관 하나를 검색했으면 그 도서관 (결과가 없을 때 사이트 링크·범위 넓히기에 쓴다)
  const lastLibrary = useMemo(
    () =>
      lastSearch && lastSearch.libName !== DEFAULT_LIBRARY
        ? libraryNames.find((lib) => lib.name === lastSearch.libName)
        : undefined,
    [lastSearch, libraryNames],
  );
  const widenLibraries = useMemo(
    () => (lastLibrary?.module ? libraryNames.filter((lib) => lib.module === lastLibrary.module) : []),
    [lastLibrary, libraryNames],
  );

  // 같은 모듈(시·군 도서관)의 도서관 전체로 넓혀 다시 검색하고, 검색 조건 화면도 그 모듈로 맞춘다
  const handleWiden = useCallback(() => {
    if (!lastSearch || !lastLibrary?.module) return;
    setSelectedRegion("");
    setSelectedModule(lastLibrary.module);
    setLibraryName(DEFAULT_LIBRARY);
    trackSearch(lastSearch.title, DEFAULT_LIBRARY, "group", widenLibraries.length);
    performSearch(lastSearch.title, DEFAULT_LIBRARY, widenLibraries);
  }, [lastSearch, lastLibrary, widenLibraries, setSelectedRegion, setSelectedModule, setLibraryName, performSearch]);

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
            unreachableLibraries={unreachableLibraries}
            isLoading={isLoading}
            hideRented={hideRented}
            onHideRentedChange={setHideRented}
            onRefresh={refreshSearch}
            emptyHelp={
              lastSearch &&
              aggregatedBooks.length === 0 && (
                <EmptyResultHelp
                  libraryName={lastLibrary?.name}
                  homeUrl={lastLibrary?.homeUrl}
                  widenModule={widenLibraries.length > 1 ? lastLibrary?.module : undefined}
                  onWiden={handleWiden}
                />
              )
            }
          />
        </div>
      </div>
      <ScrollToTopButton />
    </div>
  );
};

export default App;
