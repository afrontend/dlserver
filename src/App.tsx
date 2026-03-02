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
import { useSearchManager } from "./hooks/useSearchManager";

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

  const { searchText, setSearchText, libraryName, setLibraryName, handleSearch } = useSearchManager({
    libraryNames,
    performSearch,
    clearResults,
    resetFilters,
    addToHistory,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 sm:p-6 md:p-8 pb-8 max-w-4xl mx-auto safe-area-inset">
        <Header />
        <div className="space-y-4">
          <div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
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
              <div className="border-t border-gray-100">
                <LibrarySelector
                  libraryNames={libraryNames}
                  selectedLibrary={libraryName}
                  onLibraryChange={setLibraryName}
                  filterText={filterText}
                  onFilterChange={setFilterText}
                  isLoading={isLoading}
                />
              </div>
              <div className="border-t border-gray-100 px-4 py-3 flex justify-center">
                <button
                  onClick={handleSearch}
                  disabled={isLoading || !searchText?.trim()}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
                    isLoading || !searchText?.trim()
                      ? "bg-blue-300 opacity-50 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700"
                  }`}
                >
                  {isLoading ? (
                    <i className="fa fa-spinner fa-spin" />
                  ) : (
                    <i className="fa fa-search" />
                  )}
                  검색하기
                </button>
              </div>
            </div>
          </div>
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
