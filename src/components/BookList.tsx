import { useState, useEffect } from "react";
import type { Book } from "../types";
import { BookItem } from "./BookItem";

interface BookListProps {
  books: Book[];
  totalBooks: number;
  isLoading: boolean;
  hideRented: boolean;
  onHideRentedChange: (value: boolean) => void;
}

export const BookList = ({
  books,
  totalBooks,
  isLoading,
  hideRented,
  onHideRentedChange,
}: BookListProps) => {
  const [titleFilter, setTitleFilter] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setTitleFilter("");
      setShowFilter(false);
    }
  }, [isLoading]);

  const filteredBooks = titleFilter.trim()
    ? books.filter((book) =>
        book.title.toLowerCase().includes(titleFilter.toLowerCase()),
      )
    : books;

  const availableCount = filteredBooks.filter((book) => book.exist === true).length;
  const hiddenCount = totalBooks - books.length;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      data-testid="book-list"
    >
      <div
        className="bg-gray-100 px-4 py-3 border-b border-gray-200"
        data-testid="book-list-header"
      >
        {isLoading && books.length === 0 ? (
          <h2
            className="font-medium text-base text-gray-700 flex items-center gap-2"
            data-testid="loading-indicator"
          >
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            찾고 있어요...
          </h2>
        ) : isLoading && books.length > 0 ? (
          <h2 className="font-medium text-base text-gray-700 flex items-center gap-2">
            <span className="inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            검색 중...
            <span
              className="text-sm text-gray-500"
              data-testid="book-count"
            >
              (현재 {books.length}권,{" "}
              <span
                className="text-blue-600 font-semibold"
                data-testid="available-count"
              >
                {availableCount}권 대출가능
              </span>
              )
            </span>
          </h2>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="font-medium text-base text-gray-700">
                지금 도서관에서 빌릴 수 있는 책이에요.
                {totalBooks > 0 && (
                  <span
                    className="block sm:inline sm:ml-1 text-sm text-gray-500 mt-1 sm:mt-0"
                    data-testid="book-count"
                  >
                    ({totalBooks}권 중{" "}
                    <span
                      className="text-blue-600 font-semibold"
                      data-testid="available-count"
                    >
                      {availableCount}권 대출가능
                    </span>
                    {hiddenCount > 0 && (
                      <span className="text-gray-400"> · {hiddenCount}권 숨김</span>
                    )}
                    )
                  </span>
                )}
              </h2>
              {totalBooks > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-testid="title-filter-toggle"
                    onClick={() => setShowFilter((v) => !v)}
                    className={`p-1.5 rounded transition-colors ${
                      showFilter
                        ? "text-blue-500 bg-blue-50 hover:bg-blue-100"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="제목으로 필터"
                    aria-label="제목 필터 토글"
                  >
                    <i className="fa fa-search" />
                  </button>
                  <label
                    className="flex items-center gap-2 cursor-pointer"
                    data-testid="hide-rented-toggle"
                  >
                    <input
                      type="checkbox"
                      checked={hideRented}
                      onChange={(e) => onHideRentedChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-300 peer-checked:bg-blue-500 rounded-full relative transition-colors">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
                    </div>
                    <span className="text-sm text-gray-600">대출가능만</span>
                  </label>
                </div>
              )}
            </div>
            {showFilter && (
              <div className="relative">
                <input
                  type="text"
                  data-testid="title-filter-input"
                  autoFocus
                  value={titleFilter}
                  onChange={(e) => setTitleFilter(e.target.value)}
                  placeholder="제목 필터..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {titleFilter && (
                  <button
                    type="button"
                    data-testid="title-filter-clear"
                    onClick={() => setTitleFilter("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                    aria-label="필터 지우기"
                  >
                    <i className="fa fa-trash-o" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {books.length === 0 && !isLoading ? (
        <div
          className="px-4 py-8 text-center text-gray-500"
          data-testid="empty-message"
        >
          검색 결과가 없습니다.
        </div>
      ) : books.length === 0 && isLoading ? (
        <div
          className="px-4 py-8 text-center text-gray-400"
          data-testid="loading-message"
        >
          도서관에서 책을 찾고 있어요...
        </div>
      ) : filteredBooks.length === 0 ? (
        <div
          className="px-4 py-8 text-center text-gray-500"
          data-testid="filter-empty-message"
        >
          필터와 일치하는 책이 없습니다.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200" data-testid="book-items">
          {filteredBooks.map((book, index) => (
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
