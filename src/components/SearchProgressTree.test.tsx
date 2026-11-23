import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SearchPath, SearchProgressTree } from "./SearchProgressTree";
import type { Book, Library, LibrarySearchState } from "../types";

// 실제 지역 매핑(libraryRegions.json)에 있는 도서관을 쓴다
const libraries: Library[] = [
  { id: 0, name: "화성동탄중앙도서관", libraryName: "화성동탄중앙도서관", module: "화성시립도서관" },
  { id: 1, name: "병점도서관", libraryName: "병점도서관", module: "화성시립도서관" },
  { id: 2, name: "옛 도서관" },
];

const book = (exist: boolean): Book => ({ title: "책", exist });

const statesOf = (...list: LibrarySearchState[]) => new Map(list.map((s) => [s.libraryName, s]));

const renderTree = (states: Map<string, LibrarySearchState>, onSelectLibrary = vi.fn()) =>
  render(
    <SearchProgressTree
      states={states}
      libraries={libraries}
      selectedLibraries={new Set()}
      onSelectLibrary={onSelectLibrary}
    />,
  );

describe("SearchProgressTree", () => {
  it("찾은 곳이 있는 갈래는 펼치고 없는 갈래는 접는다", () => {
    renderTree(
      statesOf(
        { libraryName: "화성동탄중앙도서관", status: "done", books: [book(true)] },
        { libraryName: "병점도서관", status: "done", books: [] },
        { libraryName: "옛 도서관", status: "done", books: [] },
      ),
    );

    expect(screen.getByText("화성동탄중앙도서관")).toBeInTheDocument();
    expect(screen.getByText("대출 가능 1 · 1권")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /지역 미상/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("옛 도서관")).not.toBeInTheDocument();
  });

  it("사용자가 펼친 갈래는 상태가 바뀌어도 펼친 채로 둔다", () => {
    const { rerender } = renderTree(statesOf({ libraryName: "옛 도서관", status: "done", books: [] }));

    fireEvent.click(screen.getByRole("button", { name: /지역 미상/ }));
    expect(screen.getByText("옛 도서관")).toBeInTheDocument();

    rerender(
      <SearchProgressTree
        states={statesOf({ libraryName: "옛 도서관", status: "error", books: [] })}
        libraries={libraries}
        selectedLibraries={new Set()}
        onSelectLibrary={vi.fn()}
      />,
    );
    expect(screen.getByText("검색 실패")).toBeInTheDocument();
  });

  it("책이 있는 도서관을 누르면 그 도서관을 알리고, 책이 없으면 누를 수 없다", () => {
    const onSelect = vi.fn();
    renderTree(
      statesOf(
        { libraryName: "화성동탄중앙도서관", status: "done", books: [book(false)] },
        { libraryName: "병점도서관", status: "searching", books: [] },
      ),
      onSelect,
    );

    const [byeongjeom, dongtan] = screen.getAllByTestId("tree-library");
    fireEvent.click(dongtan);
    expect(onSelect).toHaveBeenCalledWith("화성동탄중앙도서관");
    expect(dongtan).toHaveTextContent("1권 · 모두 대출 중");
    expect(byeongjeom).toBeDisabled();
  });

  it("전체 트리를 한 줄로 접을 수 있다", () => {
    renderTree(statesOf({ libraryName: "화성동탄중앙도서관", status: "done", books: [book(true)] }));

    fireEvent.click(screen.getByRole("button", { name: /지역별 진행/ }));
    expect(screen.queryByText("화성동탄중앙도서관")).not.toBeInTheDocument();
  });

  it("검색 중이거나 도서관이 40곳을 넘는 갈래는 저절로 펼치지 않는다", () => {
    const many = Array.from({ length: 41 }, (_, i): LibrarySearchState => ({
      libraryName: `작은도서관 ${i}`,
      status: "done",
      books: i === 0 ? [book(true)] : [],
    }));
    renderTree(statesOf(...many, { libraryName: "병점도서관", status: "searching", books: [] }));

    expect(screen.getByRole("button", { name: /지역 미상/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /경기도/ })).toHaveAttribute("aria-expanded", "false");
  });
});

describe("SearchPath", () => {
  it("도서관 하나의 지역 경로와 결과를 한 줄로 보여 준다", () => {
    render(
      <SearchPath
        path={["경기도", "화성시", "화성시립도서관", "화성동탄중앙도서관"]}
        status="available"
        bookCount={3}
        availableCount={2}
      />,
    );
    expect(screen.getByTestId("search-path")).toHaveTextContent(
      "경기도 › 화성시 › 화성시립도서관 › 화성동탄중앙도서관— 대출 가능 2 · 3권",
    );
  });
});
