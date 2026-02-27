import { BookList } from "./components/BookList";
import { LibrarySelector } from "./components/LibrarySelector";
import { SearchBar } from "./components/SearchBar";
import { Header } from "./components/Header";
import { SearchProgressBar } from "./components/SearchProgress";
import { LibraryTagFilter } from "./components/LibraryTagFilter";
import ScrollToTopButton from "./components/ScrollToTopButton";
import { useSearchHistory } from "./hooks/useSearchHistory";
import { useBookSearch } from "./hooks/useBookSearch";
import { useLibraries } from "./hooks/useLibraries";
import { useBookFilters } from "./hooks/useBookFilters";
import { useSearchState } from "./hooks/useSearchState";
import { useSearchCoordinator } from "./hooks/useSearchCoordinator";

const App = () => {
  const { history, addToHistory, clearHistory } = useSearchHistory();

  const { isLoading, searchProgress, aggregatedBooks, performSearch, cancelSearch, clearResults } =
    useBookSearch();
  const { libraryNames, filterText, setFilterText } = useLibraries();
  const {
    displayedBooks,
    hideRented,
    setHideRented,
    selectedLibraryTags,
    setSelectedLibraryTags,
    resetFilters,
  } = useBookFilters(aggregatedBooks);

  const { searchText, setSearchText, libraryName, setLibraryName } = useSearchState(
    libraryNames,
    performSearch,
    clearResults,
  );

  const { handleSearch } = useSearchCoordinator({
    searchText,
    libraryName,
    libraryNames,
    performSearch,
    resetFilters,
    addToHistory,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 md:p-8 pb-8 max-w-4xl mx-auto safe-area-inset">
        <Header />
        <div className="space-y-4">
          <SearchBar
            searchText={searchText}
            onSearchTextChange={setSearchText}
            onSearch={handleSearch}
            onCancel={cancelSearch}
            isLoading={isLoading}
            searchHistory={history}
            onHistorySelect={setSearchText}
            onHistoryClear={clearHistory}
          />
          <LibrarySelector
            libraryNames={libraryNames}
            selectedLibrary={libraryName}
            onLibraryChange={setLibraryName}
            filterText={filterText}
            onFilterChange={setFilterText}
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
