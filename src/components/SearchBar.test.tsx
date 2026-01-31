import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChangeEvent, KeyboardEvent } from "react";

// SearchBar component extracted from App.tsx
interface SearchBarProps {
  searchText: string;
  onSearchTextChange: (text: string) => void;
  onSearch: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const SearchBar = ({
  searchText,
  onSearchTextChange,
  onSearch,
  onCancel,
  isLoading,
}: SearchBarProps) => {
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-0">
      <div className="relative flex-grow">
        <input
          type="text"
          value={searchText}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onSearchTextChange(e.target.value)
          }
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg sm:rounded-l-lg sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
          placeholder="책 이름을 입력하세요."
          data-testid="search-input"
        />
        {searchText && (
          <button
            type="button"
            onClick={() => onSearchTextChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search"
            data-testid="clear-button"
          >
            <i className="fa fa-times" />
          </button>
        )}
      </div>
      {isLoading ? (
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-red-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-red-600 active:bg-red-700 text-center font-medium min-h-[48px] min-w-[80px] transition-colors"
          data-testid="cancel-button"
        >
          취소
        </button>
      ) : (
        <button
          type="button"
          onClick={onSearch}
          className="px-6 py-3 bg-blue-500 text-white rounded-lg sm:rounded-r-lg sm:rounded-l-none hover:bg-blue-600 active:bg-blue-700 text-center font-medium min-h-[48px] min-w-[80px] transition-colors"
          data-testid="search-button"
        >
          검색
        </button>
      )}
    </div>
  );
};

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
      <SearchBar {...defaultProps} onSearchTextChange={onSearchTextChange} />
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
      />
    );

    await userEvent.click(screen.getByTestId("clear-button"));

    expect(onSearchTextChange).toHaveBeenCalledWith("");
  });
});
