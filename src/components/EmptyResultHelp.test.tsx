import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EmptyResultHelp } from "./EmptyResultHelp";

describe("EmptyResultHelp", () => {
  it("always suggests trying a shorter title", () => {
    render(<EmptyResultHelp />);

    expect(screen.getByTestId("empty-result-help")).toHaveTextContent("제목을 짧게 줄이거나");
    expect(screen.queryByTestId("widen-search")).toBeNull();
    expect(screen.queryByTestId("library-site-link")).toBeNull();
  });

  it("links to the library site and widens the search to the module", async () => {
    const onWiden = vi.fn();
    render(
      <EmptyResultHelp
        libraryName="판교도서관"
        homeUrl="https://lib.example"
        widenModule="성남시도서관"
        onWiden={onWiden}
      />,
    );

    const link = screen.getByTestId("library-site-link");
    expect(link).toHaveTextContent("판교도서관 사이트에서 직접 확인하기");
    expect(link).toHaveAttribute("href", "https://lib.example");
    expect(link).toHaveAttribute("target", "_blank");

    await userEvent.click(screen.getByTestId("widen-search"));
    expect(screen.getByTestId("widen-search")).toHaveTextContent("성남시도서관 전체에서 찾기");
    expect(onWiden).toHaveBeenCalledOnce();
  });
});
