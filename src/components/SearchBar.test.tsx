import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  const defaultProps = {
    searchText: "",
    onSearchTextChange: vi.fn(),
    onSearch: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
  };

  it("renders search input with placeholder", () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByTestId("search-input");
    expect(input).toHaveAttribute("placeholder", "책 이름을 입력하세요.");
  });

  it("renders search button when not loading", () => {
    render(<SearchBar {...defaultProps} />);

    expect(screen.getByTestId("search-button")).toHaveTextContent("검색");
    expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
  });

  it("renders cancel button when loading", () => {
    render(<SearchBar {...defaultProps} isLoading={true} />);

    expect(screen.getByTestId("cancel-button")).toHaveTextContent("취소");
    expect(screen.queryByTestId("search-button")).not.toBeInTheDocument();
  });

  it("calls onSearchTextChange when typing", async () => {
    const onSearchTextChange = vi.fn();
    render(
      <SearchBar {...defaultProps} onSearchTextChange={onSearchTextChange} />,
    );

    const input = screen.getByTestId("search-input");
    await userEvent.type(input, "해리포터");

    expect(onSearchTextChange).toHaveBeenCalled();
  });

  it("calls onSearch when search button is clicked", async () => {
    const onSearch = vi.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    await userEvent.click(screen.getByTestId("search-button"));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onSearch when Enter key is pressed", () => {
    const onSearch = vi.fn();
    render(<SearchBar {...defaultProps} onSearch={onSearch} />);

    const input = screen.getByTestId("search-input");
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(onSearch).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const onCancel = vi.fn();
    render(<SearchBar {...defaultProps} isLoading={true} onCancel={onCancel} />);

    await userEvent.click(screen.getByTestId("cancel-button"));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows clear button when searchText has value", () => {
    render(<SearchBar {...defaultProps} searchText="테스트" />);

    expect(screen.getByTestId("clear-button")).toBeInTheDocument();
  });

  it("hides clear button when searchText is empty", () => {
    render(<SearchBar {...defaultProps} searchText="" />);

    expect(screen.queryByTestId("clear-button")).not.toBeInTheDocument();
  });

  it("clears text when clear button is clicked", async () => {
    const onSearchTextChange = vi.fn();
    render(
      <SearchBar
        {...defaultProps}
        searchText="테스트"
        onSearchTextChange={onSearchTextChange}
      />,
    );

    await userEvent.click(screen.getByTestId("clear-button"));

    expect(onSearchTextChange).toHaveBeenCalledWith("");
  });
});
