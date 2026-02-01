import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibrarySelector } from "./LibrarySelector";

describe("LibrarySelector", () => {
  const defaultProps = {
    libraryNames: [
      { id: 1, name: "판교" },
      { id: 2, name: "동탄" },
      { id: 3, name: "성남" },
    ],
    selectedLibrary: "도서관을 선택하세요.",
    onLibraryChange: vi.fn(),
    filterText: "",
    onFilterChange: vi.fn(),
    isLoading: false,
  };

  it("renders filter input and select when not loading", () => {
    render(<LibrarySelector {...defaultProps} />);

    expect(screen.getByTestId("library-filter-input")).toBeInTheDocument();
    expect(screen.getByTestId("library-select")).toBeInTheDocument();
  });

  it("filter input is not disabled when not loading", () => {
    render(<LibrarySelector {...defaultProps} />);

    const filterInput = screen.getByTestId("library-filter-input");
    expect(filterInput).not.toBeDisabled();
  });

  it("select is not disabled when not loading", () => {
    render(<LibrarySelector {...defaultProps} />);

    const select = screen.getByTestId("library-select");
    expect(select).not.toBeDisabled();
  });

  it("filter input is disabled when loading", () => {
    render(<LibrarySelector {...defaultProps} isLoading={true} />);

    const filterInput = screen.getByTestId("library-filter-input");
    expect(filterInput).toBeDisabled();
  });

  it("select is disabled when loading", () => {
    render(<LibrarySelector {...defaultProps} isLoading={true} />);

    const select = screen.getByTestId("library-select");
    expect(select).toBeDisabled();
  });

  it("shows clear button when library is selected and not loading", () => {
    render(
      <LibrarySelector {...defaultProps} selectedLibrary="판교" />
    );

    expect(screen.getByTestId("library-clear-button")).toBeInTheDocument();
  });

  it("hides clear button when no library is selected", () => {
    render(<LibrarySelector {...defaultProps} />);

    expect(
      screen.queryByTestId("library-clear-button")
    ).not.toBeInTheDocument();
  });

  it("hides clear button when loading", () => {
    render(
      <LibrarySelector
        {...defaultProps}
        selectedLibrary="판교"
        isLoading={true}
      />
    );

    expect(
      screen.queryByTestId("library-clear-button")
    ).not.toBeInTheDocument();
  });

  it("calls onFilterChange when typing in filter input", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LibrarySelector {...defaultProps} onFilterChange={onFilterChange} />
    );

    const filterInput = screen.getByTestId("library-filter-input");
    await user.type(filterInput, "판교");

    expect(onFilterChange).toHaveBeenCalled();
  });

  it("calls onLibraryChange when selecting a library", async () => {
    const onLibraryChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LibrarySelector {...defaultProps} onLibraryChange={onLibraryChange} />
    );

    const select = screen.getByTestId("library-select");
    await user.selectOptions(select, "판교");

    expect(onLibraryChange).toHaveBeenCalledWith("판교");
  });

  it("calls onLibraryChange with default when clear button is clicked", async () => {
    const onLibraryChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LibrarySelector
        {...defaultProps}
        selectedLibrary="판교"
        onLibraryChange={onLibraryChange}
      />
    );

    const clearButton = screen.getByTestId("library-clear-button");
    await user.click(clearButton);

    expect(onLibraryChange).toHaveBeenCalledWith("도서관을 선택하세요.");
  });

  it("shows correct library count", () => {
    render(<LibrarySelector {...defaultProps} />);

    expect(screen.getByText("3개 도서관")).toBeInTheDocument();
  });

  it("filters libraries based on filter text", () => {
    render(<LibrarySelector {...defaultProps} filterText="판교" />);

    expect(screen.getByText("1개 도서관")).toBeInTheDocument();
  });
});
