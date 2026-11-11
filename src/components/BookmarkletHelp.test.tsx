import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookmarkletHelp } from "./BookmarkletHelp";

describe("BookmarkletHelp", () => {
  it("도서관 없이 ref=bm 으로 여는 javascript: 링크를 만든다", () => {
    render(<BookmarkletHelp />);

    const href = decodeURIComponent(screen.getByTestId("bookmarklet-link").getAttribute("href") ?? "");
    expect(href.startsWith("javascript:")).toBe(true);
    expect(href).toContain('"ref","bm"');
    expect(href).not.toContain('"library"');
  });

  it("북마크 이름이 될 링크 글자는 이모지를 붙인 짧은 제목이다", () => {
    render(<BookmarkletHelp />);

    expect(screen.getByTestId("bookmarklet-link")).toHaveTextContent("📚 동네 도서관");
  });

  it("페이지에서 누르면 끌어다 놓으라고 안내한다", async () => {
    render(<BookmarkletHelp />);

    await userEvent.click(screen.getByTestId("bookmarklet-link"));

    expect(screen.getByTestId("bookmarklet-help")).toHaveTextContent("북마크바로 끌어다 놓으세요");
  });
});
