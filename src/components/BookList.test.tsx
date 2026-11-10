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

  it("lists libraries that could not be searched", () => {
    render(
      <BookList {...defaultProps} failedLibraries={["판교도서관", "동탄도서관"]} />,
    );

    expect(screen.getByTestId("failed-libraries")).toHaveTextContent(
      "판교도서관, 동탄도서관",
    );
  });

  it("lists libraries the server cannot reach separately", () => {
    render(
      <BookList
        {...defaultProps}
        failedLibraries={["판교도서관"]}
        unreachableLibraries={["동탄중앙도서관"]}
      />,
    );

    expect(screen.getByTestId("failed-libraries")).not.toHaveTextContent("동탄중앙도서관");
    expect(screen.getByTestId("unreachable-libraries")).toHaveTextContent(
      "도서관 사이트에서 직접 확인해 주세요: 동탄중앙도서관",
    );
  });

  it("hides the failed-library notice while loading", () => {
    render(
      <BookList {...defaultProps} isLoading={true} failedLibraries={["판교도서관"]} />,
    );

    expect(screen.queryByTestId("failed-libraries")).toBeNull();
  });

  it("shows when old results were checked and refreshes on click", async () => {
    const onRefresh = vi.fn();
    const checkedAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const books: Book[] = [{ title: "책 1", exist: true, libraryName: "판교", checkedAt }];

    render(<BookList {...defaultProps} books={books} totalBooks={1} onRefresh={onRefresh} />);

    expect(screen.getByTestId("checked-at")).toHaveTextContent("3분 전에 도서관에서 확인한 결과예요.");
    await userEvent.click(screen.getByTestId("refresh-search"));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it("hides the checked time for results checked just now", () => {
    const books: Book[] = [
      { title: "책 1", exist: true, libraryName: "판교", checkedAt: new Date().toISOString() },
    ];

    render(<BookList {...defaultProps} books={books} totalBooks={1} onRefresh={vi.fn()} />);

    expect(screen.queryByTestId("checked-at")).toBeNull();
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
