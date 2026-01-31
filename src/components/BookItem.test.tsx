import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Import BookItem from App.tsx - we'll extract it later
// For now, we'll create a simple test component inline
interface Book {
  title: string;
  exist: boolean;
  bookUrl?: string;
  libraryName?: string;
}

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
    <li
      className="px-4 py-3 sm:py-3 hover:bg-gray-50 active:bg-gray-100 min-h-[48px] flex items-center"
      data-testid="book-item"
    >
      <div className="flex items-start gap-3 w-full">
        <span className="flex-shrink-0 text-lg" data-testid="availability-icon">
          {icon}
        </span>
        <span className={textClass}>
          {book.title}, {book.libraryName}
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

describe("BookItem", () => {
  it("renders available book with green checkmark", () => {
    const book: Book = {
      title: "테스트 책",
      exist: true,
      libraryName: "판교",
    };

    render(<BookItem book={book} />);

    expect(screen.getByTestId("availability-icon")).toHaveTextContent("✅");
    expect(screen.getByText(/테스트 책/)).toBeInTheDocument();
    expect(screen.getByText(/판교/)).toBeInTheDocument();
  });

  it("renders unavailable book with red X", () => {
    const book: Book = {
      title: "대출중인 책",
      exist: false,
      libraryName: "동탄",
    };

    render(<BookItem book={book} />);

    expect(screen.getByTestId("availability-icon")).toHaveTextContent("❌");
    expect(screen.getByText(/대출중인 책/)).toBeInTheDocument();
  });

  it("renders book URL link when provided", () => {
    const book: Book = {
      title: "링크 있는 책",
      exist: true,
      libraryName: "성남",
      bookUrl: "https://example.com/book",
    };

    render(<BookItem book={book} />);

    const link = screen.getByTestId("book-link");
    expect(link).toHaveAttribute("href", "https://example.com/book");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("does not render link when bookUrl is not provided", () => {
    const book: Book = {
      title: "링크 없는 책",
      exist: true,
      libraryName: "판교",
    };

    render(<BookItem book={book} />);

    expect(screen.queryByTestId("book-link")).not.toBeInTheDocument();
  });
});
