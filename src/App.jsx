import { useState, useEffect } from "react";

// Utility function for alphabetical sorting by title
const sortByTitle = (items) =>
  [...items].sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

// Utility function for alphabetical sorting by name
const sortByName = (items) =>
  [...items].sort((a, b) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

// API Layer
const LibraryAPI = {
  getLibrary: ({ title, libraryName }) => {
    const url = `/search?title=${encodeURIComponent(title)}&libraryName=${encodeURIComponent(libraryName)}`;
    return fetch(url, { timeout: 30000 }).then((response) => {
      if (!response.ok) {
        throw new Error("검색에 실패했어요.");
      }
      return response.json();
    });
  },
  getLibraryNames: () =>
    fetch("/libraryList").then((response) => response.json()),
};

// BookItem Component
const BookItem = ({ book }) => {
  const isAvailable = book.exist === true;
  const icon = isAvailable ? "\u2705" : "\u274C";
  const textClass = isAvailable
    ? "text-sm sm:text-base break-words"
    : "text-sm sm:text-base text-gray-500 break-words";
  const linkClass = isAvailable
    ? "ml-1 text-blue-500 hover:text-blue-700"
    : "ml-1 text-gray-400 hover:text-gray-600";

  return (
    <li className="px-3 py-2 sm:px-4 sm:py-3 hover:bg-gray-50">
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0">{icon}</span>
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
const BookList = ({ books, isLoading }) => {
  const availableCount = books.filter((book) => book.exist === true).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-100 px-3 py-2 sm:px-4 sm:py-3 border-b border-gray-200">
        {isLoading ? (
          <h2 className="font-medium text-sm sm:text-base text-gray-700">
            찾고 있어요...
          </h2>
        ) : (
          <h2 className="font-medium text-sm sm:text-base text-gray-700">
            지금 도서관에서 빌릴 수 있는 책이에요.{" "}
            {books.length > 0 && (
              <span className="text-gray-500">
                ({books.length}권 중{" "}
                <span className="text-blue-500">{availableCount}권 대출가능</span>
                )
              </span>
            )}
          </h2>
        )}
      </div>
      <ul className="divide-y divide-gray-200">
        {books.map((book, index) => (
          <BookItem
            key={`${book.title}-${book.libraryName}-${index}`}
            book={book}
          />
        ))}
      </ul>
    </div>
  );
};

// LibrarySelector Component
const LibrarySelector = ({
  libraryNames,
  onLibraryChange,
  filterText,
  onFilterChange,
}) => {
  const filteredLibraries = filterText?.trim()
    ? libraryNames.filter(
        (lib) =>
          lib.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1
      )
    : libraryNames;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full">
      <input
        type="text"
        className="w-full sm:w-48 border border-gray-300 rounded px-3 py-3 sm:py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="도서관 이름 검색..."
        value={filterText}
        onChange={(e) => onFilterChange(e.target.value)}
      />
      <select
        className="w-full sm:w-auto border border-gray-300 rounded px-3 py-3 sm:py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url(&quot;data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E&quot;)] bg-[length:1.5rem_1.5rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
        onChange={(e) => onLibraryChange(e.target.value)}
      >
        <option value="도서관을 선택하세요.">도서관을 선택하세요.</option>
        {filteredLibraries.map((lib) => (
          <option key={lib.id} value={lib.name}>
            {lib.name}
          </option>
        ))}
      </select>
      <span className="text-xs sm:text-sm text-gray-500">
        {filteredLibraries.length}개 도서관
      </span>
    </div>
  );
};

// SearchBar Component
const SearchBar = ({ searchText, onSearchTextChange, onSearch, isLoading }) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-0">
      <input
        type="text"
        value={searchText}
        onChange={(e) => onSearchTextChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow px-4 py-3 sm:py-2 border border-gray-300 rounded sm:rounded-l sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        placeholder="책 이름을 입력하세요."
      />
      <div
        onClick={() => !isLoading && onSearch()}
        className={`px-4 py-3 sm:py-2 bg-blue-500 text-white rounded sm:rounded-r sm:rounded-l-none hover:bg-blue-600 cursor-pointer text-center font-medium${
          isLoading ? " opacity-50 cursor-wait" : ""
        }`}
      >
        검색
      </div>
    </div>
  );
};

// Header Component
const Header = () => (
  <div className="mb-4 sm:mb-6">
    <section className="bg-blue-500 text-white rounded-lg">
      <div className="py-6 px-4 sm:py-10 sm:px-6 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">
            책을 빌릴 수 있는지 확인해요
          </h1>
        </div>
      </div>
    </section>
  </div>
);

// Main App Component
const App = () => {
  const [searchText, setSearchText] = useState("");
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [libraryName, setLibraryName] = useState("도서관을 선택하세요.");
  const [libraryNames, setLibraryNames] = useState([]);
  const [filterText, setFilterText] = useState("");

  // Fetch library names on mount
  useEffect(() => {
    LibraryAPI.getLibraryNames()
      .then((list) => {
        const libraries = list.map((name, index) => ({ id: index, name }));
        setLibraryNames(sortByName(libraries));
      })
      .catch((error) => {
        console.error("Failed to load library names:", error);
      });
  }, []);

  const updateBookList = (title, libName) =>
    LibraryAPI.getLibrary({ title, libraryName: libName })
      .then((list) => list?.[0]?.booklist ?? [])
      .catch((error) => {
        console.error("Search failed:", error);
        return [];
      });

  const handleSearch = () => {
    if (!searchText?.length) {
      console.log("검색할 책 이름을 입력해주세요.");
      return;
    }

    setBooks([]);
    setIsLoading(true);

    if (libraryName === "도서관을 선택하세요.") {
      // Search all libraries in parallel
      Promise.all(
        libraryNames.map((library) => updateBookList(searchText, library.name))
      )
        .then((results) => {
          const allBooks = results.flat();
          setBooks(sortByTitle(allBooks));
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    } else {
      // Search single library
      updateBookList(searchText, libraryName)
        .then((bookList) => {
          setBooks(sortByTitle(bookList));
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <Header />
      <div className="mb-4">
        <SearchBar
          searchText={searchText}
          onSearchTextChange={setSearchText}
          onSearch={handleSearch}
          isLoading={isLoading}
        />
      </div>
      <div className="mb-4">
        <LibrarySelector
          libraryNames={libraryNames}
          onLibraryChange={setLibraryName}
          filterText={filterText}
          onFilterChange={setFilterText}
        />
      </div>
      <div className="mb-6">
        <BookList books={books} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default App;
