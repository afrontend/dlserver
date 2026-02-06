import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LibraryTagFilter } from "./LibraryTagFilter";
import type { Book } from "../types";

describe("LibraryTagFilter", () => {
  const mockBooks: Book[] = [
    { title: "책1", exist: true, libraryName: "판교" },
    { title: "책2", exist: false, libraryName: "판교" },
    { title: "책3", exist: true, libraryName: "동탄" },
    { title: "책4", exist: true, libraryName: "성남" },
    { title: "책5", exist: false, libraryName: "성남" },
  ];

  it("renders nothing when books array is empty", () => {
    const { container } = render(
      <LibraryTagFilter
        books={[]}
        selectedLibraries={new Set()}
        onSelectionChange={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when only one library", () => {
    const singleLibraryBooks: Book[] = [
      { title: "책1", exist: true, libraryName: "판교" },
      { title: "책2", exist: false, libraryName: "판교" },
    ];
    const { container } = render(
      <LibraryTagFilter
        books={singleLibraryBooks}
        selectedLibraries={new Set()}
        onSelectionChange={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders tag buttons for each library with counts", () => {
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set()}
        onSelectionChange={() => {}}
      />,
    );

    expect(screen.getByTestId("tag-all")).toBeInTheDocument();
    expect(screen.getByTestId("tag-판교")).toHaveTextContent("판교");
    expect(screen.getByTestId("tag-판교")).toHaveTextContent("(1/2)");
    expect(screen.getByTestId("tag-동탄")).toHaveTextContent("동탄");
    expect(screen.getByTestId("tag-동탄")).toHaveTextContent("(1/1)");
    expect(screen.getByTestId("tag-성남")).toHaveTextContent("성남");
    expect(screen.getByTestId("tag-성남")).toHaveTextContent("(1/2)");
  });

  it("highlights '전체' button when no libraries are selected", () => {
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set()}
        onSelectionChange={() => {}}
      />,
    );

    const allButton = screen.getByTestId("tag-all");
    expect(allButton).toHaveClass("bg-blue-500");
  });

  it("highlights selected library tags", () => {
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set(["판교", "동탄"])}
        onSelectionChange={() => {}}
      />,
    );

    const allButton = screen.getByTestId("tag-all");
    const pangyo = screen.getByTestId("tag-판교");
    const dongtan = screen.getByTestId("tag-동탄");
    const seongnam = screen.getByTestId("tag-성남");

    expect(allButton).not.toHaveClass("bg-blue-500");
    expect(pangyo).toHaveClass("bg-blue-500");
    expect(dongtan).toHaveClass("bg-blue-500");
    expect(seongnam).not.toHaveClass("bg-blue-500");
  });

  it("calls onSelectionChange with library added when clicking unselected tag", () => {
    const onSelectionChange = vi.fn();
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set()}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByTestId("tag-판교"));

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const newSelection = onSelectionChange.mock.calls[0][0];
    expect(newSelection.has("판교")).toBe(true);
    expect(newSelection.size).toBe(1);
  });

  it("calls onSelectionChange with library removed when clicking selected tag", () => {
    const onSelectionChange = vi.fn();
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set(["판교", "동탄"])}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByTestId("tag-판교"));

    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    const newSelection = onSelectionChange.mock.calls[0][0];
    expect(newSelection.has("판교")).toBe(false);
    expect(newSelection.has("동탄")).toBe(true);
    expect(newSelection.size).toBe(1);
  });

  it("calls onSelectionChange with empty set when clicking '전체'", () => {
    const onSelectionChange = vi.fn();
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set(["판교"])}
        onSelectionChange={onSelectionChange}
      />,
    );

    fireEvent.click(screen.getByTestId("tag-all"));

    expect(onSelectionChange).toHaveBeenCalledWith(new Set());
  });

  it("disables buttons when disabled prop is true", () => {
    const onSelectionChange = vi.fn();
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set()}
        onSelectionChange={onSelectionChange}
        disabled={true}
      />,
    );

    const allButton = screen.getByTestId("tag-all");
    const pangyoButton = screen.getByTestId("tag-판교");

    expect(allButton).toBeDisabled();
    expect(pangyoButton).toBeDisabled();

    fireEvent.click(pangyoButton);
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("sorts library tags alphabetically by Korean name", () => {
    render(
      <LibraryTagFilter
        books={mockBooks}
        selectedLibraries={new Set()}
        onSelectionChange={() => {}}
      />,
    );

    const container = screen.getByTestId("library-tag-filter");
    const buttons = container.querySelectorAll("button");

    // First button is "전체", then sorted libraries
    expect(buttons[1]).toHaveTextContent("동탄");
    expect(buttons[2]).toHaveTextContent("성남");
    expect(buttons[3]).toHaveTextContent("판교");
  });
});
