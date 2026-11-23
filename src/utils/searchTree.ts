import { findLibraryRegion, REGION_INDEX, type RegionIndex } from "./regions";
import type { Library, LibrarySearchState } from "../types";

/** 도서관 하나의 검색 결과 상태 */
export type LeafStatus =
  | "pending"
  | "searching"
  | "available"
  | "owned"
  | "none"
  | "unreachable"
  | "failed";

export type StatusCounts = Record<LeafStatus, number> & { total: number };

export interface TreeLibrary {
  /** 표시 이름. 결과 목록의 book.libraryName 과 같아 거르기에 쓴다 */
  name: string;
  status: LeafStatus;
  bookCount: number;
  availableCount: number;
}

export interface TreeNode {
  /** 펼침 상태 키. "경기도/화성시/화성시립도서관" */
  id: string;
  /** 한 갈래를 줄였으면 "경기도 › 화성시" */
  label: string;
  kind: "region" | "module" | "library";
  counts: StatusCounts;
  children: TreeNode[];
  library?: TreeLibrary;
}

export const UNKNOWN_REGION = "지역 미상";

/** 안쪽 노드의 대표 상태를 고르는 순서. 앞에 있을수록 먼저 보인다 */
const NODE_STATUS_ORDER: LeafStatus[] = [
  "searching",
  "available",
  "owned",
  "pending",
  "failed",
  "unreachable",
  "none",
];

export const leafStatus = (state: LibrarySearchState): LeafStatus => {
  switch (state.status) {
    case "pending":
    case "searching":
      return state.status;
    case "error":
      return state.unreachable ? "unreachable" : "failed";
    case "done":
      if (state.books.some((book) => book.exist)) return "available";
      return state.books.length > 0 ? "owned" : "none";
  }
};

export const nodeStatus = (counts: StatusCounts): LeafStatus =>
  NODE_STATUS_ORDER.find((status) => counts[status] > 0) ?? "none";

const emptyCounts = (): StatusCounts => ({
  total: 0,
  pending: 0,
  searching: 0,
  available: 0,
  owned: 0,
  none: 0,
  unreachable: 0,
  failed: 0,
});

const compareLabel = (a: TreeNode, b: TreeNode) => a.label.localeCompare(b.label, "ko");

interface Branch {
  node: TreeNode;
  branches: Map<string, Branch>;
}

const newBranch = (id: string, label: string, kind: TreeNode["kind"]): Branch => ({
  node: { id, label, kind, counts: emptyCounts(), children: [] },
  branches: new Map(),
});

/** 자식이 하나뿐인 안쪽 단계를 한 줄로 합친다 */
const collapse = (node: TreeNode): TreeNode => {
  let current = node;
  while (current.kind !== "library" && current.children.length === 1 && current.children[0].kind !== "library") {
    const child = current.children[0];
    current = { ...child, label: `${current.label} › ${child.label}` };
  }
  return { ...current, children: current.children.map(collapse) };
};

const finish = (branch: Branch): TreeNode => {
  const children = Array.from(branch.branches.values()).map(finish).sort(compareLabel);
  const counts = branch.node.library ? branch.node.counts : emptyCounts();
  children.forEach((child) => {
    (Object.keys(counts) as (keyof StatusCounts)[]).forEach((key) => {
      counts[key] += child.counts[key];
    });
  });
  return { ...branch.node, counts, children };
};

/**
 * 도서관별 검색 상태를 시도 → 시군구 → 모듈 → 도서관 트리로 묶는다.
 * 시군구를 모르면 시도 바로 아래에, 지역 매핑에 없으면 "지역 미상" 아래에 둔다.
 */
export const buildSearchTree = (
  states: Map<string, LibrarySearchState>,
  libraries: Library[],
  index: RegionIndex = REGION_INDEX,
): TreeNode[] => {
  const byName = new Map(libraries.map((lib) => [lib.name, lib]));
  const root = newBranch("", "", "region");

  states.forEach((state, name) => {
    const library = byName.get(name) ?? { id: -1, name };
    const region = findLibraryRegion(library, index);
    const steps: [string, TreeNode["kind"]][] = [
      [region?.sido ?? UNKNOWN_REGION, "region"],
      ...(region?.sigungu ? [[region.sigungu, "region"] as [string, TreeNode["kind"]]] : []),
      ...(library.module ? [[library.module, "module"] as [string, TreeNode["kind"]]] : []),
    ];

    let branch = root;
    for (const [label, kind] of steps) {
      const id = branch.node.id ? `${branch.node.id}/${label}` : label;
      let next = branch.branches.get(label);
      if (!next) {
        next = newBranch(id, label, kind);
        branch.branches.set(label, next);
      }
      branch = next;
    }

    const status = leafStatus(state);
    const leaf = newBranch(`${branch.node.id}/${name}`, library.libraryName ?? name, "library");
    leaf.node.library = {
      name,
      status,
      bookCount: state.books.length,
      availableCount: state.books.filter((book) => book.exist).length,
    };
    leaf.node.counts.total = 1;
    leaf.node.counts[status] = 1;
    branch.branches.set(`\u0000${name}`, leaf);
  });

  return finish(root).children.map(collapse);
};
