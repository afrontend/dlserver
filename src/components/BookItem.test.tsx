import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BookItem } from "./BookItem";
import type { Book } from "../types";

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
