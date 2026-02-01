import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookList } from "./BookList";
import type { Book } from "../types";

describe("BookList", () => {
  it("shows loading indicator when isLoading is true", () => {
    render(<BookList books={[]} isLoading={true} />);

    expect(screen.getByTestId("loading-indicator")).toHaveTextContent(
      "찾고 있어요...",
    );
  });

  it("shows empty message when no books and not loading", () => {
    render(<BookList books={[]} isLoading={false} />);

    expect(screen.getByTestId("empty-message")).toHaveTextContent(
      "검색 결과가 없습니다.",
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
      "2권 대출가능",
    );
  });

  it("does not show count when books array is empty", () => {
    render(<BookList books={[]} isLoading={false} />);

    expect(screen.queryByTestId("book-count")).not.toBeInTheDocument();
  });

  it("shows progressive loading state with partial results", () => {
    const books: Book[] = [{ title: "책 1", exist: true, libraryName: "판교" }];

    render(<BookList books={books} isLoading={true} />);

    // Progressive loading shows book count with "검색 중..." and the book items
    expect(screen.getByTestId("book-count")).toHaveTextContent("현재 1권");
    expect(screen.getByTestId("book-items")).toBeInTheDocument();
  });
});
