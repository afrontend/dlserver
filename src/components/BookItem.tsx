import type { Book } from "../types";

interface BookItemProps {
  book: Book;
}

export const BookItem = ({ book }: BookItemProps) => {
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
