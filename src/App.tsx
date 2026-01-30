import { useState, useEffect, useCallback, useRef, ChangeEvent, KeyboardEvent } from "react";

// URL parameter helpers
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    title: params.get("title") || "",
    library: params.get("library") || "도서관을 선택하세요.",
  };
};

const updateUrl = (title: string, library: string) => {
  const params = new URLSearchParams();
  if (title) params.set("title", title);
  if (library !== "도서관을 선택하세요.") params.set("library", library);

  const newUrl = params.toString()
    ? `${window.location.pathname}?${params}`
    : window.location.pathname;
  window.history.pushState({ title, library }, "", newUrl);
};

// Types
interface Book {
  title: string;
  exist: boolean;
  bookUrl?: string;
  libraryName?: string;
}

interface Library {
  id: number;
  name: string;
}

interface LibrarySearchResult {
  booklist: Book[];
}

// Utility function for alphabetical sorting by title
const sortByTitle = (items: Book[]): Book[] =>
  [...items].sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

// Utility function for alphabetical sorting by name
const sortByName = (items: Library[]): Library[] =>
  [...items].sort((a, b) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

type LibrarySearchParams = {
  title: string;
  libraryName: string;
  signal?: AbortSignal;
};

// API Layer
const LibraryAPI = {
  getLibrary: async ({
    title,
    libraryName,
    signal,
  }: LibrarySearchParams): Promise<LibrarySearchResult[]> => {
    const params = new URLSearchParams({ title, libraryName });
    return fetch(`/search?${params}`, { signal }).then((response) => {
      if (!response.ok) {
        throw new Error("검색에 실패했어요.");
      }
      return response.json();
    });
  },
  getLibraryNames: (): Promise<string[]> =>
    fetch("/libraryList").then((response) => response.json()),
};

// BookItem Component
interface BookItemProps {
  book: Book;
}

const BookItem = ({ book }: BookItemProps) => {
  const isAvailable = book.exist === true;
  const icon = isAvailable ? "\u2705" : "\u274C";
  const textClass = isAvailable
    ? "text-base break-words"
    : "text-base text-gray-500 break-words";
  const linkClass = isAvailable
    ? "ml-2 text-blue-500 hover:text-blue-700 active:text-blue-800 p-1"
    : "ml-2 text-gray-400 hover:text-gray-600 active:text-gray-700 p-1";

  return (
    <li className="px-4 py-3 sm:py-3 hover:bg-gray-50 active:bg-gray-100 min-h-[48px] flex items-center">
      <div className="flex items-start gap-3 w-full">
        <span className="flex-shrink-0 text-lg">{icon}</span>
        <span className={textClass}>
          {book.title}, {book.libraryName}
          {book.bookUrl && (
            <a
              href={book.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
            >
              <i className="fa fa-external-link" />
            </a>
          )}
        </span>
      </div>
    </li>
  );
};

// BookList Component
interface BookListProps {
  books: Book[];
  isLoading: boolean;
}

const BookList = ({ books, isLoading }: BookListProps) => {
  const availableCount = books.filter((book) => book.exist === true).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
        {isLoading ? (
          <h2 className="font-medium text-base text-gray-700 flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            찾고 있어요...
          </h2>
        ) : (
          <h2 className="font-medium text-base text-gray-700">
            지금 도서관에서 빌릴 수 있는 책이에요.
            {books.length > 0 && (
              <span className="block sm:inline sm:ml-1 text-sm text-gray-500 mt-1 sm:mt-0">
                ({books.length}권 중{" "}
                <span className="text-blue-600 font-semibold">
                  {availableCount}권 대출가능
                </span>
                )
              </span>
            )}
          </h2>
        )}
      </div>
      {books.length === 0 && !isLoading ? (
        <div className="px-4 py-8 text-center text-gray-500">
          검색 결과가 없습니다.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {books.map((book, index) => (
            <BookItem
              key={`${book.title}-${book.libraryName}-${index}`}
              book={book}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

// LibrarySelector Component
interface LibrarySelectorProps {
  libraryNames: Library[];
  selectedLibrary: string;
  onLibraryChange: (libraryName: string) => void;
  filterText: string;
  onFilterChange: (text: string) => void;
}

const LibrarySelector = ({
  libraryNames,
  selectedLibrary,
  onLibraryChange,
  filterText,
  onFilterChange,
}: LibrarySelectorProps) => {
  const filteredLibraries = filterText?.trim()
    ? libraryNames.filter(
        (lib) =>
          lib.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1,
      )
    : libraryNames;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
      <input
        type="text"
        className="w-full sm:w-48 border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px]"
        placeholder="도서관 이름 검색..."
        value={filterText}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onFilterChange(e.target.value)
        }
      />
      <select
        className="w-full sm:w-auto border border-gray-300 rounded-lg px-4 py-3 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] appearance-none bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E&quot;)] bg-[length:1.5rem_1.5rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
        value={selectedLibrary}
        onChange={(e: ChangeEvent<HTMLSelectElement>) =>
          onLibraryChange(e.target.value)
        }
      >
        <option value="도서관을 선택하세요.">도서관을 선택하세요.</option>
        {filteredLibraries.map((lib) => (
          <option key={lib.id} value={lib.name}>
            {lib.name}
          </option>
        ))}
      </select>
      <span className="text-sm text-gray-500 text-center sm:text-left">
        {filteredLibraries.length}개 도서관
      </span>
    </div>
  );
};

// SearchBar Component
interface SearchBarProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SearchBar = ({
  searchText,
  onSearchTextChange,
  onSearch,
  onCancel,
  isLoading,
}: SearchBarProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
      <div className="relative flex-grow">
        <input
          type="text"
          value={searchText}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onSearchTextChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
          placeholder="책 이름을 입력하세요."
        />
        {searchText && (
          <button
            type="button"
            onClick={() => onSearchTextChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
          >
            <i className="fa fa-times" />
          </button>
        )}
      </div>
      {isLoading ? (
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-red-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-red-600 active:bg-red-700 text-center font-medium min-h-[48px] min-w-[80px] transition-colors"
        >
          취소
        </button>
      ) : (
        <button
          type="button"
          onClick={onSearch}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-blue-600 active:bg-blue-700 text-center font-medium min-h-[48px] min-w-[80px] transition-colors"
        >
          검색
        </button>
      )}
    </div>
  );
};

// Header Component
const Header = () => (
  <div className="mb-4 sm:mb-6">
    <section className="bg-blue-500 text-white rounded-lg shadow-sm">
      <div className="py-5 px-4 sm:py-8 sm:px-6 md:py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center leading-tight">
            책을 빌릴 수 있는지 확인해요
          </h1>
        </div>
      </div>
    </section>
  </div>
);

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
