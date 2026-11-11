import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkletHelp } from "./BookmarkletHelp";

describe("BookmarkletHelp", () => {
  it("도서관을 고르지 않으면 북마클릿을 만들지 않는다", () => {
    render(<BookmarkletHelp />);

    expect(screen.queryByTestId("bookmarklet-link")).toBeNull();
    expect(screen.getByTestId("bookmarklet-help")).toHaveTextContent("도서관을 하나 고르면");
  });

  it("고른 도서관을 넣은 javascript: 링크를 만든다", () => {
    render(<BookmarkletHelp libraryName="판교도서관" />);

    const href = screen.getByTestId("bookmarklet-link").getAttribute("href") ?? "";
    expect(href.startsWith("javascript:")).toBe(true);
    expect(decodeURIComponent(href)).toContain('"판교도서관"');
    expect(decodeURIComponent(href)).toContain('"ref","bm"');
  });

  it("페이지에서 누르면 끌어다 놓으라고 안내한다", async () => {
    render(<BookmarkletHelp libraryName="판교도서관" />);

    await userEvent.click(screen.getByTestId("bookmarklet-link"));

    expect(screen.getByTestId("bookmarklet-help")).toHaveTextContent("북마크바로 끌어다 놓으세요");
  });
});
