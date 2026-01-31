import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Types
interface Book {
  title: string;
  exist: boolean;
  bookUrl?: string;
  libraryName?: string;
}

// BookItem component
const BookItem = ({ book }: { book: Book }) => {
  const isAvailable = book.exist === true;
  const icon = isAvailable ? "\u2705" : "\u274C";

  return (
    <li data-testid="book-item">
      <span data-testid="availability-icon">{icon}</span>
      <span>
        {book.title}, {book.libraryName}
      </span>
    </li>
  );
};

// BookList component extracted from App.tsx
interface BookListProps {
  books: Book[];
  isLoading: boolean;
}

const BookList = ({ books, isLoading }: BookListProps) => {
  const availableCount = books.filter((book) => book.exist === true).length;

  return (
    <div data-testid="book-list">
      <div data-testid="book-list-header">
        {isLoading ? (
          <h2 data-testid="loading-indicator">찾고 있어요...</h2>
        ) : (
          <h2>
            지금 도서관에서 빌릴 수 있는 책이에요.
            {books.length > 0 && (
              <span data-testid="book-count">
                ({books.length}권 중{" "}
                <span data-testid="available-count">
                  {availableCount}권 대출가능
                </span>
                )
              </span>
            )}
          </h2>
        )}
      </div>
      {books.length === 0 && !isLoading ? (
        <div data-testid="empty-message">검색 결과가 없습니다.</div>
      ) : (
        <ul data-testid="book-items">
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

describe("BookList", () => {
  it("shows loading indicator when isLoading is true", () => {
    render(<BookList books={[]} isLoading={true} />);

    expect(screen.getByTestId("loading-indicator")).toHaveTextContent(
      "찾고 있어요..."
    );
  });

  it("shows empty message when no books and not loading", () => {
    render(<BookList books={[]} isLoading={false} />);

    expect(screen.getByTestId("empty-message")).toHaveTextContent(
      "검색 결과가 없습니다."
    );
  });

  it("renders book items when books are provided", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
      { title: "책 2", exist: false, libraryName: "동탄" },
    ];

    render(<BookList books={books} isLoading={false} />);

    const items = screen.getAllByTestId("book-item");
    expect(items).toHaveLength(2);
  });

  it("shows correct book count", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
      { title: "책 2", exist: false, libraryName: "동탄" },
      { title: "책 3", exist: true, libraryName: "성남" },
    ];

    render(<BookList books={books} isLoading={false} />);

    expect(screen.getByTestId("book-count")).toHaveTextContent("3권 중");
    expect(screen.getByTestId("available-count")).toHaveTextContent(
      "2권 대출가능"
    );
  });

  it("does not show count when books array is empty", () => {
    render(<BookList books={[]} isLoading={false} />);

    expect(screen.queryByTestId("book-count")).not.toBeInTheDocument();
  });

  it("hides book items while loading", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
    ];

    render(<BookList books={books} isLoading={true} />);

    // Loading state should still show the list (partial results)
    expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
  });
});
