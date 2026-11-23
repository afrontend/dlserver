import { describe, it, expect } from "vitest";
import { buildRegionIndex, getLibraryPath } from "./regions";
import { buildSearchTree, leafStatus, nodeStatus, type TreeNode } from "./searchTree";
import type { Book, Library, LibrarySearchState } from "../types";

const regions = {
  경기도: {
    "": { 경기교육통합도서관: ["경기교육도서관"] },
    화성시: { 화성시립도서관: ["동탄중앙도서관", "병점도서관"] },
    안산시: { 안산시도서관: ["중앙도서관"] },
  },
  서울특별시: { 마포구: { 마포구립도서관: ["중앙도서관"] } },
};
const index = buildRegionIndex(regions);

const libraries: Library[] = [
  { id: 0, name: "동탄중앙도서관", libraryName: "동탄중앙도서관", module: "화성시립도서관" },
  { id: 1, name: "병점도서관", libraryName: "병점도서관", module: "화성시립도서관" },
  { id: 2, name: "중앙도서관 (안산시도서관)", libraryName: "중앙도서관", module: "안산시도서관" },
  { id: 3, name: "중앙도서관 (마포구립도서관)", libraryName: "중앙도서관", module: "마포구립도서관" },
  { id: 4, name: "경기교육도서관", libraryName: "경기교육도서관", module: "경기교육통합도서관" },
];

const book = (exist: boolean): Book => ({ title: "책", exist });

const state = (
  libraryName: string,
  status: LibrarySearchState["status"],
  books: Book[] = [],
  unreachable = false,
): LibrarySearchState => ({ libraryName, status, books, ...(unreachable && { unreachable }) });

const statesOf = (...list: LibrarySearchState[]) => new Map(list.map((s) => [s.libraryName, s]));

const labels = (nodes: TreeNode[]): unknown[] =>
  nodes.map((node) => (node.children.length ? [node.label, labels(node.children)] : node.label));

describe("leafStatus", () => {
  it("검색 상태와 책으로 도서관 상태를 정한다", () => {
    expect(leafStatus(state("a", "pending"))).toBe("pending");
    expect(leafStatus(state("a", "searching"))).toBe("searching");
    expect(leafStatus(state("a", "done", [book(false), book(true)]))).toBe("available");
    expect(leafStatus(state("a", "done", [book(false)]))).toBe("owned");
    expect(leafStatus(state("a", "done"))).toBe("none");
    expect(leafStatus(state("a", "error", [], true))).toBe("unreachable");
    expect(leafStatus(state("a", "error"))).toBe("failed");
  });
});

describe("buildSearchTree", () => {
  it("시도 → 시군구 → 모듈 → 도서관으로 묶고 가나다순으로 둔다", () => {
    const tree = buildSearchTree(
      statesOf(
        state("병점도서관", "done"),
        state("동탄중앙도서관", "done"),
        state("중앙도서관 (안산시도서관)", "done"),
        state("중앙도서관 (마포구립도서관)", "done"),
      ),
      libraries,
      index,
    );
    expect(labels(tree)).toEqual([
      [
        "경기도",
        [
          ["안산시 › 안산시도서관", ["중앙도서관"]],
          ["화성시 › 화성시립도서관", ["동탄중앙도서관", "병점도서관"]],
        ],
      ],
      ["서울특별시 › 마포구 › 마포구립도서관", ["중앙도서관"]],
    ]);
  });

  it("이름이 같은 도서관은 표시 이름으로 구분해 각자의 갈래에 둔다", () => {
    const tree = buildSearchTree(
      statesOf(state("중앙도서관 (안산시도서관)", "done"), state("중앙도서관 (마포구립도서관)", "done", [book(true)])),
      libraries,
      index,
    );
    const leaves = tree.flatMap(function walk(node): TreeNode[] {
      return node.library ? [node] : node.children.flatMap(walk);
    });
    expect(leaves.map((leaf) => [leaf.library?.name, leaf.library?.status])).toEqual([
      ["중앙도서관 (안산시도서관)", "none"],
      ["중앙도서관 (마포구립도서관)", "available"],
    ]);
  });

  it("시군구를 모르면 시도 바로 아래에, 매핑에 없으면 지역 미상 아래에 둔다", () => {
    const tree = buildSearchTree(
      statesOf(state("경기교육도서관", "done"), state("동탄중앙도서관", "done"), state("옛 도서관", "done")),
      libraries,
      index,
    );
    expect(labels(tree)).toEqual([
      [
        "경기도",
        [
          ["경기교육통합도서관", ["경기교육도서관"]],
          ["화성시 › 화성시립도서관", ["동탄중앙도서관"]],
        ],
      ],
      ["지역 미상", ["옛 도서관"]],
    ]);
  });

  it("아래 도서관의 상태를 세어 안쪽 노드에 모은다", () => {
    const [gyeonggi] = buildSearchTree(
      statesOf(
        state("동탄중앙도서관", "done", [book(true)]),
        state("병점도서관", "searching"),
        state("중앙도서관 (안산시도서관)", "error", [], true),
      ),
      libraries,
      index,
    );
    expect(gyeonggi.counts).toMatchObject({ total: 3, available: 1, searching: 1, unreachable: 1 });
    expect(nodeStatus(gyeonggi.counts)).toBe("searching");
    expect(gyeonggi.children[1].library).toBeUndefined();
    expect(gyeonggi.children[1].children[0].library).toEqual({
      name: "동탄중앙도서관",
      status: "available",
      bookCount: 1,
      availableCount: 1,
    });
  });
});

describe("getLibraryPath", () => {
  it("시도 › 시군구 › 모듈 › 도서관 이름을 돌려주고 모르는 단계는 뺀다", () => {
    expect(getLibraryPath(libraries[0], index)).toEqual(["경기도", "화성시", "화성시립도서관", "동탄중앙도서관"]);
    expect(getLibraryPath(libraries[4], index)).toEqual(["경기도", "경기교육통합도서관", "경기교육도서관"]);
    expect(getLibraryPath({ id: -1, name: "옛 도서관" }, index)).toEqual(["옛 도서관"]);
  });
});
