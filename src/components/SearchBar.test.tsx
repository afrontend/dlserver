import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchBar } from "./SearchBar";

describe("SearchBar", () => {
  const defaultProps = {
    searchText: "",
    onSearchTextChange: vi.fn(),
    onSearch: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    searchHistory: [] as string[],
    onHistorySelect: vi.fn(),
    onHistoryClear: vi.fn(),
  };

  it("renders search input with placeholder", () => {
    render(<SearchBar {...defaultProps} />);

    const input = screen.getByTestId("search-input");
    expect(input).toHaveAttribute("placeholder", "책 이름을 입력하세요.");
  });

  it("renders search icon button when not loading", () => {
    render(<SearchBar {...defaultProps} />);

    const searchButton = screen.getByTestId("search-button");
    expect(searchButton).toBeInTheDocument();
    expect(searchButton.querySelector(".fa-search")).toBeTruthy();
    expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
  });

  it("renders cancel spinner icon when loading", () => {
    render(<SearchBar {...defaultProps} isLoading={true} />);

    const cancelButton = screen.getByTestId("cancel-button");
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton.querySelector(".fa-spinner")).toBeTruthy();
    // Search icon is still present when loading
    expect(screen.getByTestId("search-button")).toBeInTheDocument();
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

  describe("search history", () => {
    it("shows dropdown on focus when history exists", () => {
      render(
        <SearchBar
          {...defaultProps}
          searchHistory={["query1", "query2"]}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);

      expect(screen.getByTestId("search-history-dropdown")).toBeInTheDocument();
    });

    it("does not show dropdown on focus when history is empty", () => {
      render(<SearchBar {...defaultProps} searchHistory={[]} />);

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);

      expect(screen.queryByTestId("search-history-dropdown")).not.toBeInTheDocument();
    });

    it("hides dropdown on blur", () => {
      vi.useFakeTimers();
      render(
        <SearchBar
          {...defaultProps}
          searchHistory={["query1", "query2"]}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);
      expect(screen.getByTestId("search-history-dropdown")).toBeInTheDocument();

      fireEvent.blur(input);
      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(screen.queryByTestId("search-history-dropdown")).not.toBeInTheDocument();
      vi.useRealTimers();
    });

    it("calls onHistorySelect and updates text when item clicked", () => {
      const onHistorySelect = vi.fn();
      const onSearchTextChange = vi.fn();
      render(
        <SearchBar
          {...defaultProps}
          searchHistory={["query1", "query2"]}
          onHistorySelect={onHistorySelect}
          onSearchTextChange={onSearchTextChange}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);
      fireEvent.click(screen.getByTestId("history-item-0"));

      expect(onSearchTextChange).toHaveBeenCalledWith("query1");
      expect(onHistorySelect).toHaveBeenCalledWith("query1");
    });

    it("hides dropdown on Escape key", () => {
      render(
        <SearchBar
          {...defaultProps}
          searchHistory={["query1", "query2"]}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);
      expect(screen.getByTestId("search-history-dropdown")).toBeInTheDocument();

      fireEvent.keyDown(input, { key: "Escape", code: "Escape" });

      expect(screen.queryByTestId("search-history-dropdown")).not.toBeInTheDocument();
    });

    it("hides dropdown on Enter key", () => {
      render(
        <SearchBar
          {...defaultProps}
          searchHistory={["query1", "query2"]}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);
      expect(screen.getByTestId("search-history-dropdown")).toBeInTheDocument();

      fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

      expect(screen.queryByTestId("search-history-dropdown")).not.toBeInTheDocument();
    });

    it("calls onHistoryClear when clear button is clicked", () => {
      const onHistoryClear = vi.fn();
      render(
        <SearchBar
          {...defaultProps}
          searchHistory={["query1", "query2"]}
          onHistoryClear={onHistoryClear}
        />,
      );

      const input = screen.getByTestId("search-input");
      fireEvent.focus(input);
      fireEvent.click(screen.getByTestId("clear-history-button"));

      expect(onHistoryClear).toHaveBeenCalledTimes(1);
    });
  });
});
