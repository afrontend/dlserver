import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

const mockGetLibraryNames = vi.fn();
const mockGetLibrary = vi.fn();
const mockGetModuleList = vi.fn();

vi.mock("./api/library", () => ({
  LibraryAPI: {
    getLibraryNames: () => mockGetLibraryNames(),
    getLibrary: (params: { title: string; libraryName: string }) =>
      mockGetLibrary(params),
    getModuleList: () => mockGetModuleList(),
  },
}));

// Mock URL utils to prevent auto-search from URL params
vi.mock("./utils/url", () => ({
  getUrlParams: () => ({ title: "", library: "도서관을 선택하세요." }),
  updateUrl: vi.fn(),
}));

// Helper: navigate through wizard steps to start a search
async function navigateToSearch(user: ReturnType<typeof userEvent.setup>, searchText: string) {
  // Step 1: Enter book name
  const searchInput = screen.getByTestId("search-input");
  await user.type(searchInput, searchText);
  fireEvent.keyDown(searchInput, { key: "Enter" });

  // Step 2: Skip library selection (search all)
  await user.click(screen.getByTestId("step-2-skip"));

  // Step 3: Click search
  await user.click(screen.getByTestId("search-submit-button"));
}

describe("App - Cancel Search", () => {
  const libraries = [
    { id: 1, name: "판교" },
    { id: 2, name: "동탄" },
    { id: 3, name: "성남" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLibrary.mockReset();
    mockGetLibraryNames.mockReset();
    mockGetModuleList.mockReset();
    mockGetLibraryNames.mockResolvedValue(libraries.map((l) => l.name));
    mockGetModuleList.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
  });

  it("should preserve partial results when cancelling multi-library search", async () => {
    const user = userEvent.setup();

    // Create a delayed promise for one library that won't resolve
    let resolveFirstLibrary: (value: unknown) => void;
    const firstLibraryPromise = new Promise((resolve) => {
      resolveFirstLibrary = resolve;
    });

    // Mock getLibrary to return results for some libraries but delay others
    mockGetLibrary.mockImplementation(({ libraryName }) => {
      if (libraryName === "판교") {
        return firstLibraryPromise.then(() => [
          {
            libraryName: "판교",
            booklist: [
              { title: "Harry Potter", available: true, libraryName: "판교" },
            ],
          },
        ]);
      }
      if (libraryName === "동탄") {
        return Promise.resolve([
          {
            libraryName: "동탄",
            booklist: [
              { title: "Lord of Rings", available: true, libraryName: "동탄" },
            ],
          },
        ]);
      }
      // 성남 will never resolve (simulating slow network)
      return new Promise(() => {});
    });

    render(<App />);

    // Wait for library list to load
    await waitFor(() => {
      expect(mockGetLibraryNames).toHaveBeenCalled();
    });

    // Navigate through wizard and start search
    await navigateToSearch(user, "test");

    // Wait for loading state - cancel button in step 3
    await waitFor(() => {
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    // Resolve first library quickly
    resolveFirstLibrary!(undefined);

    // Wait a bit for 동탄 to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Cancel the search
    const cancelButton = screen.getByTestId("cancel-button");
    await user.click(cancelButton);

    // Verify that partial results are preserved
    await waitFor(() => {
      const bookItems = screen.getAllByTestId("book-item");
      expect(bookItems.length).toBe(2);
    });

    // Verify loading is stopped
    expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
  });

  it("should show empty results when cancelling before any library completes", async () => {
    const user = userEvent.setup();

    // All libraries will never resolve
    mockGetLibrary.mockImplementation(() => new Promise(() => {}));

    render(<App />);

    // Wait for library list to load
    await waitFor(() => {
      expect(mockGetLibraryNames).toHaveBeenCalled();
    });

    // Navigate through wizard and start search
    await navigateToSearch(user, "empty");

    // Wait for cancel button to appear (loading state)
    await waitFor(() => {
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    // Cancel immediately (before any library completes)
    await user.click(screen.getByTestId("cancel-button"));

    // Should show empty message
    await waitFor(() => {
      expect(screen.getByTestId("empty-message")).toBeInTheDocument();
    });

    // Verify loading is stopped
    expect(screen.queryByTestId("cancel-button")).not.toBeInTheDocument();
  });
});
