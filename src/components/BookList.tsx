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
  const availableCount = books.filter((book) => book.exist === true).length;
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
              <label
                className="flex items-center gap-2 cursor-pointer shrink-0"
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
      ) : (
        <ul className="divide-y divide-gray-200" data-testid="book-items">
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
