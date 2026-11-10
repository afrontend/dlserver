import { useState, useEffect, type ReactNode } from "react";
import type { Book } from "../types";
import { BookItem } from "./BookItem";

const MINUTE_MS = 60 * 1000;

/** 가장 오래전에 확인한 결과가 몇 분 전인지. 1분이 안 되었거나 시각이 없으면 0 */
const staleMinutes = (books: Book[], now: number): number => {
  const times = books.flatMap((book) => (book.checkedAt ? [Date.parse(book.checkedAt)] : []));
  if (times.length === 0) return 0;
  return Math.floor((now - Math.min(...times)) / MINUTE_MS);
};

interface BookListProps {
  books: Book[];
  totalBooks: number;
  /** 사이트에 접속하지 못해 검색하지 못한 도서관 */
  failedLibraries?: string[];
  /** 서버에서 사이트에 접속할 수 없어 검색하지 않은 도서관 */
  unreachableLibraries?: string[];
  isLoading: boolean;
  hideRented: boolean;
  onHideRentedChange: (value: boolean) => void;
  /** 서버 캐시 없이 마지막 검색을 다시 한다 */
  onRefresh?: () => void;
  /** 검색 결과가 없을 때 안내 아래에 보여 줄 다음 행동 */
  emptyHelp?: ReactNode;
}

export const BookList = ({
  books,
  totalBooks,
  failedLibraries = [],
  unreachableLibraries = [],
  isLoading,
  hideRented,
  onHideRentedChange,
  onRefresh,
  emptyHelp,
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

  const availableCount = filteredBooks.filter((book) => book.exist).length;
  const hiddenCount = totalBooks - books.length;
  const checkedMinutesAgo = isLoading ? 0 : staleMinutes(books, Date.now());

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
            <span className="text-base text-gray-500" data-testid="book-count">
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
                    className="block sm:inline sm:ml-1 text-base text-gray-500 mt-1 sm:mt-0"
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
                      <span className="text-gray-400">
                        {" "}
                        · {hiddenCount}권 숨김
                      </span>
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
                      <div className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${hideRented ? "translate-x-4" : ""}`} />
                    </div>
                    <span className="text-base text-gray-600">대출가능만</span>
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
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
      {failedLibraries.length > 0 && !isLoading && (
        <div
          className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-base text-amber-800"
          data-testid="failed-libraries"
        >
          도서관 사이트에 접속하지 못해 검색하지 못했어요: {failedLibraries.join(", ")}
        </div>
      )}
      {unreachableLibraries.length > 0 && !isLoading && (
        <div
          className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-base text-gray-600"
          data-testid="unreachable-libraries"
        >
          현재 이 서버에서 접속할 수 없는 도서관이라 검색하지 않았어요. 도서관 사이트에서 직접 확인해 주세요:{" "}
          {unreachableLibraries.join(", ")}
        </div>
      )}
      {checkedMinutesAgo > 0 && (
        <div
          className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-base text-gray-600 flex items-center justify-between gap-2"
          data-testid="checked-at"
        >
          <span>{checkedMinutesAgo}분 전에 도서관에서 확인한 결과예요.</span>
          {onRefresh && (
            <button
              type="button"
              data-testid="refresh-search"
              onClick={onRefresh}
              className="shrink-0 text-blue-600 hover:text-blue-800"
            >
              새로 확인
            </button>
          )}
        </div>
      )}
      {books.length === 0 && !isLoading ? (
        <div
          className="px-4 py-8 text-center text-gray-500"
          data-testid="empty-message"
        >
          검색 결과가 없습니다.
          {emptyHelp}
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
              highlight={titleFilter}
            />
          ))}
        </ul>
      )}
    </div>
  );
};
