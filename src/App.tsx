import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { BookList } from "./components/BookList";
import { LibrarySelector } from "./components/LibrarySelector";
import { SearchBar } from "./components/SearchBar";
import { Header } from "./components/Header";
import { SearchProgressBar } from "./components/SearchProgress";
import { LibraryTagFilter } from "./components/LibraryTagFilter";
import { LibraryAPI } from "./api/library";
import { sortByTitle, sortByName } from "./utils/sorting";
import { getUrlParams, updateUrl } from "./utils/url";
import { useSearchHistory } from "./hooks/useSearchHistory";
import type { Book, Library, LibrarySearchState, SearchProgress } from "./types";

// Main App Component
const App = () => {
  const [searchText, setSearchText] = useState(() => getUrlParams().title);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryName, setLibraryName] = useState(() => getUrlParams().library);
  const [libraryNames, setLibraryNames] = useState<Library[]>([]);
  const [filterText, setFilterText] = useState("");
  const [hideRented, setHideRented] = useState(false);
  const [selectedLibraryTags, setSelectedLibraryTags] = useState<Set<string>>(new Set());
  const { history, addToHistory, clearHistory } = useSearchHistory();

  // Per-library search states for "search all" mode
  const [librarySearchStates, setLibrarySearchStates] = useState<Map<string, LibrarySearchState>>(
    new Map(),
  );
  const [isSearchingAll, setIsSearchingAll] = useState(false);

  // AbortController ref for cancelling ongoing searches
  const abortControllerRef = useRef<AbortController | null>(null);

  // Compute search progress from library search states
  const searchProgress: SearchProgress = useMemo(() => {
    const states = Array.from(librarySearchStates.values());
    const completedLibraries = states.filter(
      (s) => s.status === "done" || s.status === "error",
    ).length;
    const searchingLibraries = states
      .filter((s) => s.status === "searching")
      .map((s) => s.libraryName);

    return {
      totalLibraries: states.length,
      completedLibraries,
      searchingLibraries,
      isSearchingAll,
    };
  }, [librarySearchStates, isSearchingAll]);

  // Compute aggregated books from all library search states
  const aggregatedBooks: Book[] = useMemo(() => {
    if (!isSearchingAll) return books;

    const allBooks = Array.from(librarySearchStates.values())
      .filter((s) => s.status === "done")
      .flatMap((s) => s.books);

    return sortByTitle(allBooks);
  }, [librarySearchStates, isSearchingAll, books]);

  // Filter books based on selected library tags and hideRented toggle
  const displayedBooks: Book[] = useMemo(() => {
    let filtered = aggregatedBooks;

    // Filter by selected library tags (empty set means show all)
    if (selectedLibraryTags.size > 0) {
      filtered = filtered.filter(
        (book) => book.libraryName && selectedLibraryTags.has(book.libraryName),
      );
    }

    // Filter by hideRented toggle
    if (hideRented) {
      filtered = filtered.filter((book) => book.exist === true);
    }

    return filtered;
  }, [aggregatedBooks, selectedLibraryTags, hideRented]);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Preserve already-found results by merging into books
    if (isSearchingAll) {
      const foundBooks = Array.from(librarySearchStates.values())
        .filter((s) => s.status === "done")
        .flatMap((s) => s.books);
      setBooks(sortByTitle(foundBooks));
    }

    setIsLoading(false);
    setIsSearchingAll(false);
    setLibrarySearchStates(new Map());
  }, [isSearchingAll, librarySearchStates]);

  // Abort search on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const updateBookList = useCallback(
    (title: string, libName: string, signal?: AbortSignal): Promise<Book[]> =>
      LibraryAPI.getLibrary({ title, libraryName: libName, signal })
        .then((list) => list?.[0]?.booklist ?? [])
        .catch((error) => {
          // Don't log abort errors
          if (error.name !== "AbortError") {
            console.error("Search failed:", error);
          }
          return [];
        }),
    [],
  );

  const performSearch = useCallback(
    (title: string, libName: string, libraries: Library[]) => {
      if (!title?.length) return;

      // Abort any ongoing search
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new AbortController for this search
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      setBooks([]);
      setIsLoading(true);
      setSelectedLibraryTags(new Set());

      if (libName === "도서관을 선택하세요.") {
        // Search all libraries with progressive updates
        setIsSearchingAll(true);

        // Initialize all library states as "pending"
        const initialStates = new Map<string, LibrarySearchState>();
        libraries.forEach((library) => {
          initialStates.set(library.name, {
            libraryName: library.name,
            status: "pending",
            books: [],
          });
        });
        setLibrarySearchStates(initialStates);

        // Track completion count
        let completedCount = 0;
        const totalCount = libraries.length;

        // Start searching each library independently
        libraries.forEach((library) => {
          // Mark as searching
          setLibrarySearchStates((prev) => {
            const next = new Map(prev);
            next.set(library.name, {
              libraryName: library.name,
              status: "searching",
              books: [],
            });
            return next;
          });

          // Perform the search
          updateBookList(title, library.name, signal)
            .then((bookList) => {
              if (signal.aborted) return;

              // Mark as done with results
              setLibrarySearchStates((prev) => {
                const next = new Map(prev);
                next.set(library.name, {
                  libraryName: library.name,
                  status: "done",
                  books: bookList,
                });
                return next;
              });

              completedCount++;
              if (completedCount === totalCount) {
                setIsLoading(false);
              }
            })
            .catch(() => {
              if (signal.aborted) return;

              // Mark as error
              setLibrarySearchStates((prev) => {
                const next = new Map(prev);
                next.set(library.name, {
                  libraryName: library.name,
                  status: "error",
                  books: [],
                });
                return next;
              });

              completedCount++;
              if (completedCount === totalCount) {
                setIsLoading(false);
              }
            });
        });
      } else {
        // Single library search
        setIsSearchingAll(false);
        setLibrarySearchStates(new Map());

        updateBookList(title, libName, signal)
          .then((bookList) => {
            if (signal.aborted) return;
            setBooks(sortByTitle(bookList));
            setIsLoading(false);
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
              setIsLoading(false);
            }
          });
      }
    },
    [updateBookList],
  );

  // Fetch library names on mount and auto-search if URL has params
  useEffect(() => {
    LibraryAPI.getLibraryNames()
      .then((list) => {
        const libraries = list.map((name, index) => ({ id: index, name }));
        const sortedLibraries = sortByName(libraries);
        setLibraryNames(sortedLibraries);

        // Auto-search if URL has title param
        const { title, library } = getUrlParams();
        if (title) {
          performSearch(title, library, sortedLibraries);
        }
      })
      .catch((error) => {
        console.error("Failed to load library names:", error);
      });
  }, [performSearch]);

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      const { title, library } = getUrlParams();
      setSearchText(title);
      setLibraryName(library);
      if (title && libraryNames.length > 0) {
        performSearch(title, library, libraryNames);
      } else {
        setBooks([]);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [libraryNames, performSearch]);

  const handleSearch = () => {
    if (!searchText?.length) {
      console.log("검색할 책 이름을 입력해주세요.");
      return;
    }

    addToHistory(searchText);
    updateUrl(searchText, libraryName);
    performSearch(searchText, libraryName, libraryNames);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Safe area padding for notched phones */}
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
    </div>
  );
};

export default App;
