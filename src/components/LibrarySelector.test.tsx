import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LibrarySelector } from "./LibrarySelector";

describe("LibrarySelector", () => {
  const allLibraries = [
    { id: 1, name: "판교" },
    { id: 2, name: "동탄" },
    { id: 3, name: "성남" },
  ];

  const sampleModules = [
    { name: "성남시", libraries: ["판교", "성남"] },
    { name: "화성시", libraries: ["동탄"] },
  ];

  const defaultProps = {
    filteredLibraries: allLibraries,
    selectedLibrary: "도서관을 선택하세요.",
    onLibraryChange: vi.fn(),
    filterText: "",
    onFilterChange: vi.fn(),
    isLoading: false,
    modules: [] as { name: string; libraries: string[] }[],
    selectedModule: "",
    onModuleChange: vi.fn(),
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
    render(<LibrarySelector {...defaultProps} selectedLibrary="판교" />);

    expect(screen.getByTestId("library-clear-button")).toBeInTheDocument();
  });

  it("hides clear button when no library is selected", () => {
    render(<LibrarySelector {...defaultProps} />);

    expect(
      screen.queryByTestId("library-clear-button"),
    ).not.toBeInTheDocument();
  });

  it("hides clear button when loading", () => {
    render(
      <LibrarySelector
        {...defaultProps}
        selectedLibrary="판교"
        isLoading={true}
      />,
    );

    expect(
      screen.queryByTestId("library-clear-button"),
    ).not.toBeInTheDocument();
  });

  it("calls onFilterChange when typing in filter input", async () => {
    const onFilterChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LibrarySelector {...defaultProps} onFilterChange={onFilterChange} />,
    );

    const filterInput = screen.getByTestId("library-filter-input");
    await user.type(filterInput, "판교");

    expect(onFilterChange).toHaveBeenCalled();
  });

  it("calls onLibraryChange when selecting a library", async () => {
    const onLibraryChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LibrarySelector {...defaultProps} onLibraryChange={onLibraryChange} />,
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
      />,
    );

    const clearButton = screen.getByTestId("library-clear-button");
    await user.click(clearButton);

    expect(onLibraryChange).toHaveBeenCalledWith("도서관을 선택하세요.");
  });

  it("shows correct number of library options", () => {
    render(<LibrarySelector {...defaultProps} />);

    const select = screen.getByTestId("library-select");
    // 3 libraries + 1 default option
    expect(select.querySelectorAll("option")).toHaveLength(4);
  });

  it("shows only filtered libraries when filteredLibraries is provided", () => {
    render(
      <LibrarySelector
        {...defaultProps}
        filterText="판교"
        filteredLibraries={[{ id: 1, name: "판교" }]}
      />,
    );

    const select = screen.getByTestId("library-select");
    // 1 filtered library + 1 default option
    expect(select.querySelectorAll("option")).toHaveLength(2);
  });

  it("renders the module select dropdown", () => {
    render(<LibrarySelector {...defaultProps} modules={sampleModules} />);

    expect(screen.getByTestId("module-select")).toBeInTheDocument();
  });

  it("shows correct number of module options", () => {
    render(<LibrarySelector {...defaultProps} modules={sampleModules} />);

    const moduleSelect = screen.getByTestId("module-select");
    // 2 modules + 1 default option
    expect(moduleSelect.querySelectorAll("option")).toHaveLength(3);
  });

  it("calls onModuleChange when selecting a module", async () => {
    const onModuleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <LibrarySelector
        {...defaultProps}
        modules={sampleModules}
        onModuleChange={onModuleChange}
      />,
    );

    const moduleSelect = screen.getByTestId("module-select");
    await user.selectOptions(moduleSelect, "성남시");

    expect(onModuleChange).toHaveBeenCalledWith("성남시");
  });

  it("shows module clear button when a module is selected", () => {
    render(
      <LibrarySelector
        {...defaultProps}
        modules={sampleModules}
        selectedModule="성남시"
      />,
    );

    expect(screen.getByTestId("module-clear-button")).toBeInTheDocument();
  });

  it("hides module clear button when no module is selected", () => {
    render(<LibrarySelector {...defaultProps} modules={sampleModules} />);

    expect(
      screen.queryByTestId("module-clear-button"),
    ).not.toBeInTheDocument();
  });

  it("disables filter input when a module is selected", () => {
    render(
      <LibrarySelector
        {...defaultProps}
        modules={sampleModules}
        selectedModule="성남시"
      />,
    );

    const filterInput = screen.getByTestId("library-filter-input");
    expect(filterInput).toBeDisabled();
  });
});
