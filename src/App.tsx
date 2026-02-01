import { useState, useEffect, useCallback, useRef } from "react";

import { BookList } from "./components/BookList";
import { LibrarySelector } from "./components/LibrarySelector";
import { SearchBar } from "./components/SearchBar";
import { Header } from "./components/Header";
import { LibraryAPI } from "./api/library";
import { sortByTitle, sortByName } from "./utils/sorting";
import { getUrlParams, updateUrl } from "./utils/url";
import type { Book, Library } from "./types";

// Main App Component
const App = () => {
  const [searchText, setSearchText] = useState(() => getUrlParams().title);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryName, setLibraryName] = useState(() => getUrlParams().library);
  const [libraryNames, setLibraryNames] = useState<Library[]>([]);
  const [filterText, setFilterText] = useState("");

  // AbortController ref for cancelling ongoing searches
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

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

      if (libName === "도서관을 선택하세요.") {
        Promise.all(
          libraries.map((library) => updateBookList(title, library.name, signal)),
        )
          .then((results) => {
            if (signal.aborted) return;
            const allBooks = results.flat();
            setBooks(sortByTitle(allBooks));
            setIsLoading(false);
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
              setIsLoading(false);
            }
          });
      } else {
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
          />
          <LibrarySelector
            libraryNames={libraryNames}
            selectedLibrary={libraryName}
            onLibraryChange={setLibraryName}
            filterText={filterText}
            onFilterChange={setFilterText}
          />
          <BookList books={books} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};

export default App;
