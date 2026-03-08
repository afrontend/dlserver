import { useCallback } from "react";
import { BookList } from "./components/BookList";
import { StepWizard } from "./components/StepWizard";
import { Header } from "./components/Header";
import { SearchProgressBar } from "./components/SearchProgress";
import { LibraryTagFilter } from "./components/LibraryTagFilter";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { useBookSearch } from "./hooks/useBookSearch";
import { useLibraries } from "./hooks/useLibraries";
import { useBookFilters } from "./hooks/useBookFilters";
import { useSearchManager } from "./hooks/useSearchManager";
import { DEFAULT_LIBRARY } from "./constants";

const App = () => {
  const { history, addToHistory, clearHistory } = useSearchHistory();

  const {
    isLoading,
    searchProgress,
    aggregatedBooks,
    performSearch,
    cancelSearch,
    clearResults,
  } = useBookSearch();
  const {
    libraryNames,
    baseLibraries,
    filteredLibraries,
    filterText,
    setFilterText,
    modules,
    selectedModule,
    setSelectedModule,
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
    baseLibraries,
    performSearch,
    clearResults,
    resetFilters,
    addToHistory,
  });

  const handleModuleChange = useCallback(
    (moduleName: string) => {
      setSelectedModule(moduleName);
      setLibraryName(DEFAULT_LIBRARY);
    },
    [setSelectedModule, setLibraryName],
  );

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
            filterText={filterText}
            onFilterChange={setFilterText}
            modules={modules}
            selectedModule={selectedModule}
            onModuleChange={handleModuleChange}
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
