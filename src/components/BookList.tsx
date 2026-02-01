import type { Book } from "../types";
import { BookItem } from "./BookItem";

interface BookListProps {
  books: Book[];
  isLoading: boolean;
}

export const BookList = ({ books, isLoading }: BookListProps) => {
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
