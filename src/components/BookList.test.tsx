import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookList } from "./BookList";
import type { Book } from "../types";

const defaultProps = {
  books: [] as Book[],
  totalBooks: 0,
  isLoading: false,
  hideRented: false,
  onHideRentedChange: vi.fn(),
};

describe("BookList", () => {
  it("shows loading indicator when isLoading is true", () => {
    render(<BookList {...defaultProps} books={[]} isLoading={true} />);

    expect(screen.getByTestId("loading-indicator")).toHaveTextContent(
      "찾고 있어요...",
    );
  });

  it("shows empty message when no books and not loading", () => {
    render(<BookList {...defaultProps} books={[]} isLoading={false} />);

    expect(screen.getByTestId("empty-message")).toHaveTextContent(
      "검색 결과가 없습니다.",
    );
  });

  it("renders book items when books are provided", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
      { title: "책 2", exist: false, libraryName: "동탄" },
    ];

    render(<BookList {...defaultProps} books={books} totalBooks={2} />);

    const items = screen.getAllByTestId("book-item");
    expect(items).toHaveLength(2);
  });

  it("shows correct book count", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
      { title: "책 2", exist: false, libraryName: "동탄" },
      { title: "책 3", exist: true, libraryName: "성남" },
    ];

    render(<BookList {...defaultProps} books={books} totalBooks={3} />);

    expect(screen.getByTestId("book-count")).toHaveTextContent("3권 중");
    expect(screen.getByTestId("available-count")).toHaveTextContent(
      "2권 대출가능",
    );
  });

  it("does not show count when books array is empty", () => {
    render(<BookList {...defaultProps} books={[]} totalBooks={0} />);

    expect(screen.queryByTestId("book-count")).not.toBeInTheDocument();
  });

  it("shows progressive loading state with partial results", () => {
    const books: Book[] = [{ title: "책 1", exist: true, libraryName: "판교" }];

    render(<BookList {...defaultProps} books={books} totalBooks={1} isLoading={true} />);

    // Progressive loading shows book count with "검색 중..." and the book items
    expect(screen.getByTestId("book-count")).toHaveTextContent("현재 1권");
    expect(screen.getByTestId("book-items")).toBeInTheDocument();
  });

  it("shows hide rented toggle when there are books", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
      { title: "책 2", exist: false, libraryName: "동탄" },
    ];

    render(<BookList {...defaultProps} books={books} totalBooks={2} />);

    expect(screen.getByTestId("hide-rented-toggle")).toBeInTheDocument();
    expect(screen.getByText("대출가능만")).toBeInTheDocument();
  });

  it("does not show hide rented toggle when no books", () => {
    render(<BookList {...defaultProps} books={[]} totalBooks={0} />);

    expect(screen.queryByTestId("hide-rented-toggle")).not.toBeInTheDocument();
  });

  it("calls onHideRentedChange when toggle is clicked", async () => {
    const onHideRentedChange = vi.fn();
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
    ];

    render(
      <BookList
        {...defaultProps}
        books={books}
        totalBooks={1}
        hideRented={false}
        onHideRentedChange={onHideRentedChange}
      />,
    );

    const toggle = screen.getByTestId("hide-rented-toggle").querySelector("input");
    await userEvent.click(toggle!);

    expect(onHideRentedChange).toHaveBeenCalledWith(true);
  });

  it("shows hidden count when books are filtered", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교" },
    ];

    render(
      <BookList
        {...defaultProps}
        books={books}
        totalBooks={3}
        hideRented={true}
      />,
    );

    expect(screen.getByTestId("book-count")).toHaveTextContent("2권 숨김");
  });
});
