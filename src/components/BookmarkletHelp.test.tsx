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

  it("페이지에서 누르면 끌어다 놓으라고 안내한다", async () => {
    render(<BookmarkletHelp />);

    await userEvent.click(screen.getByTestId("bookmarklet-link"));

    expect(screen.getByTestId("bookmarklet-help")).toHaveTextContent("북마크바로 끌어다 놓으세요");
  });
});
