import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchHistoryDropdown } from "./SearchHistoryDropdown";

describe("SearchHistoryDropdown", () => {
  const defaultProps = {
    history: ["query1", "query2", "query3"],
    onSelect: vi.fn(),
    onClear: vi.fn(),
  };

  it("renders nothing when history is empty", () => {
    render(<SearchHistoryDropdown {...defaultProps} history={[]} />);

    expect(screen.queryByTestId("search-history-dropdown")).not.toBeInTheDocument();
  });

  it("renders dropdown with history items", () => {
    render(<SearchHistoryDropdown {...defaultProps} />);

    expect(screen.getByTestId("search-history-dropdown")).toBeInTheDocument();
    expect(screen.getByText("query1")).toBeInTheDocument();
    expect(screen.getByText("query2")).toBeInTheDocument();
    expect(screen.getByText("query3")).toBeInTheDocument();
  });

  it("renders header with label", () => {
    render(<SearchHistoryDropdown {...defaultProps} />);

    expect(screen.getByText("최근 검색")).toBeInTheDocument();
  });

  it("renders clear button", () => {
    render(<SearchHistoryDropdown {...defaultProps} />);

    expect(screen.getByTestId("clear-history-button")).toHaveTextContent("전체 삭제");
  });

  it("calls onClear when clear button is clicked", async () => {
    const onClear = vi.fn();
    render(<SearchHistoryDropdown {...defaultProps} onClear={onClear} />);

    await userEvent.click(screen.getByTestId("clear-history-button"));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("calls onSelect with query when history item is clicked", async () => {
    const onSelect = vi.fn();
    render(<SearchHistoryDropdown {...defaultProps} onSelect={onSelect} />);

    await userEvent.click(screen.getByTestId("history-item-1"));

    expect(onSelect).toHaveBeenCalledWith("query2");
  });

  it("renders history icon for each item", () => {
    render(<SearchHistoryDropdown {...defaultProps} />);

    const icons = screen.getByTestId("history-list").querySelectorAll(".fa-history");
    expect(icons).toHaveLength(3);
  });
});
