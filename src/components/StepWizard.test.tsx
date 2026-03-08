import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StepWizard } from "./StepWizard";
import { DEFAULT_LIBRARY } from "../constants";

const defaultProps = {
  searchText: "",
  onSearchTextChange: vi.fn(),
  searchHistory: [] as string[],
  onHistorySelect: vi.fn(),
  onHistoryClear: vi.fn(),
  filteredLibraries: [{ id: 1, name: "판교" }],
  selectedLibrary: DEFAULT_LIBRARY,
  onLibraryChange: vi.fn(),
  filterText: "",
  onFilterChange: vi.fn(),
  modules: [] as { name: string; libraries: string[] }[],
  selectedModule: "",
  onModuleChange: vi.fn(),
  onSearch: vi.fn(),
  onCancel: vi.fn(),
  isLoading: false,
};

describe("StepWizard", () => {
  it("renders step indicator with 3 steps", () => {
    render(<StepWizard {...defaultProps} />);
    expect(screen.getByTestId("step-indicator-1")).toBeInTheDocument();
    expect(screen.getByTestId("step-indicator-2")).toBeInTheDocument();
    expect(screen.getByTestId("step-indicator-3")).toBeInTheDocument();
  });

  it("shows step 1 content initially", () => {
    render(<StepWizard {...defaultProps} />);
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
    expect(screen.queryByTestId("step-2-content")).not.toBeInTheDocument();
  });

  it("advances to step 2 when Enter is pressed in search input with text", () => {
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("step-1-summary")).toBeInTheDocument();
    expect(screen.getByTestId("step-2-content")).toBeInTheDocument();
  });

  it("shows step 1 summary with book title after completing step 1", () => {
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("step-1-summary")).toHaveTextContent("해리포터");
  });

  it("does not advance to step 2 when Enter pressed with empty text", () => {
    render(<StepWizard {...defaultProps} searchText="" />);
    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
    expect(screen.queryByTestId("step-2-content")).not.toBeInTheDocument();
  });

  it("shows search button in step 3", async () => {
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-skip"));
    expect(screen.getByTestId("search-submit-button")).toBeInTheDocument();
  });

  it("calls onSearch when search button is clicked in step 3", async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" onSearch={onSearch} />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    await user.click(screen.getByTestId("step-2-skip"));
    await user.click(screen.getByTestId("search-submit-button"));
    expect(onSearch).toHaveBeenCalled();
  });

  it("resets to step 1 when edit button is clicked on step 1 summary", async () => {
    const user = userEvent.setup();
    render(<StepWizard {...defaultProps} searchText="해리포터" />);
    fireEvent.keyDown(screen.getByTestId("search-input"), { key: "Enter" });
    expect(screen.getByTestId("step-1-summary")).toBeInTheDocument();
    await user.click(screen.getByTestId("step-1-edit"));
    expect(screen.getByTestId("step-1-content")).toBeInTheDocument();
    expect(screen.queryByTestId("step-1-summary")).not.toBeInTheDocument();
  });
});
