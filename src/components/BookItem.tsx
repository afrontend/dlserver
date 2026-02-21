import type { Book } from "../types";

interface BookItemProps {
  book: Book;
  highlight?: string;
}

function HighlightedText({ text, highlight }: { text: string; highlight?: string }) {
  if (!highlight?.trim()) return <>{text}</>;

  const escaped = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  const lower = highlight.toLowerCase();

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <mark key={i} className="bg-yellow-200 text-inherit rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export const BookItem = ({ book, highlight }: BookItemProps) => {
  const isAvailable = book.exist === true;
  const icon = isAvailable ? "\u2705" : "\u274C";
  const textClass = isAvailable
    ? "text-base break-words"
    : "text-base text-gray-500 break-words";
  const linkClass = isAvailable
    ? "ml-2 text-blue-500 hover:text-blue-700 active:text-blue-800 p-1"
    : "ml-2 text-gray-400 hover:text-gray-600 active:text-gray-700 p-1";

  return (
    <li
      className="px-4 py-3 sm:py-3 hover:bg-gray-50 active:bg-gray-100 min-h-[48px] flex items-center"
      data-testid="book-item"
    >
      <div className="flex items-start gap-3 w-full">
        <span className="flex-shrink-0 text-lg" data-testid="availability-icon">
          {icon}
        </span>
        <span className={textClass}>
          <HighlightedText text={book.title} highlight={highlight} />, {book.libraryName}
          {book.bookUrl && (
            <a
              href={book.bookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={linkClass}
              data-testid="book-link"
            >
              <i className="fa fa-external-link" />
            </a>
          )}
        </span>
      </div>
    </li>
  );
};
