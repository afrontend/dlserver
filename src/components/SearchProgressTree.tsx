import { useMemo, useState } from "react";
import { buildSearchTree, nodeStatus, type LeafStatus, type StatusCounts, type TreeNode } from "../utils/searchTree";
import type { Library, LibrarySearchState } from "../types";

/** 색만으로 구분하지 않도록 상태마다 기호와 글자를 함께 둔다 */
const STATUS_STYLE: Record<LeafStatus, { mark: string; className: string; label: string }> = {
  pending: { mark: "○", className: "text-gray-400", label: "대기" },
  searching: { mark: "", className: "text-blue-600", label: "검색 중" },
  available: { mark: "●", className: "text-green-600", label: "대출 가능" },
  owned: { mark: "●", className: "text-amber-500", label: "모두 대출 중" },
  none: { mark: "–", className: "text-gray-400", label: "없음" },
  unreachable: { mark: "⊘", className: "text-gray-500", label: "접속 불가" },
  failed: { mark: "!", className: "text-red-600", label: "검색 실패" },
};

const StatusMark = ({ status }: { status: LeafStatus }) =>
  status === "searching" ? (
    <span
      className="inline-block w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
      aria-hidden="true"
    />
  ) : (
    <span className={`w-3 text-center transition-colors duration-150 ${STATUS_STYLE[status].className}`} aria-hidden="true">
      {STATUS_STYLE[status].mark}
    </span>
  );

const leafText = (library: NonNullable<TreeNode["library"]>): string => {
  switch (library.status) {
    case "available":
      return `대출 가능 ${library.availableCount} · ${library.bookCount}권`;
    case "owned":
      return `${library.bookCount}권 · 모두 대출 중`;
    default:
      return STATUS_STYLE[library.status].label;
  }
};

const countText = (counts: StatusCounts): string => {
  const done = counts.total - counts.pending - counts.searching;
  return counts.available > 0
    ? `${done}/${counts.total}곳 · 대출 가능 ${counts.available}곳`
    : `${done}/${counts.total}곳`;
};

/** 이보다 도서관이 많은 갈래는 찾은 곳이 있어도 저절로 펼치지 않는다 (전체 검색이면 시도가 모두 펼쳐진다) */
const AUTO_OPEN_MAX_LIBRARIES = 40;

/**
 * 찾은 곳(대출 가능·소장)이 있는 작은 갈래만 저절로 펼친다.
 * 검색 중인 곳으로 펼치면 진행하는 동안 갈래가 열렸다 닫혔다 한다.
 */
const openByDefault = (node: TreeNode) =>
  node.counts.available + node.counts.owned > 0 && node.counts.total <= AUTO_OPEN_MAX_LIBRARIES;

interface TreeItemProps {
  node: TreeNode;
  expanded: Map<string, boolean>;
  onToggle: (id: string, open: boolean) => void;
  selectedLibraries: Set<string>;
  onSelectLibrary: (name: string) => void;
}

const TreeItem = ({ node, expanded, onToggle, selectedLibraries, onSelectLibrary }: TreeItemProps) => {
  const { library } = node;

  if (library) {
    const selected = selectedLibraries.has(library.name);
    const hasBooks = library.bookCount > 0;
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelectLibrary(library.name)}
          disabled={!hasBooks}
          aria-pressed={hasBooks ? selected : undefined}
          className={`flex w-full min-h-11 items-center gap-2 rounded px-2 text-left text-sm ${
            selected ? "bg-blue-100 font-medium" : hasBooks ? "hover:bg-gray-100" : ""
          }`}
          data-testid="tree-library"
        >
          <StatusMark status={library.status} />
          <span className="truncate">{node.label}</span>
          <span className="ml-auto shrink-0 text-xs text-gray-600">{leafText(library)}</span>
        </button>
      </li>
    );
  }

  const open = expanded.get(node.id) ?? openByDefault(node);
  return (
    <li>
      <button
        type="button"
        onClick={() => onToggle(node.id, !open)}
        aria-expanded={open}
        className="flex w-full min-h-11 items-center gap-2 rounded px-2 text-left text-sm hover:bg-gray-100"
      >
        <span className="w-3 text-gray-500" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        <StatusMark status={nodeStatus(node.counts)} />
        <span className="truncate font-medium">{node.label}</span>
        <span className="ml-auto shrink-0 text-xs text-gray-600">{countText(node.counts)}</span>
      </button>
      {open && (
        <ul className="pl-4">
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              selectedLibraries={selectedLibraries}
              onSelectLibrary={onSelectLibrary}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

interface SearchProgressTreeProps {
  states: Map<string, LibrarySearchState>;
  libraries: Library[];
  selectedLibraries: Set<string>;
  onSelectLibrary: (name: string) => void;
}

/** 여러 도서관 검색의 진행과 결과를 지역 트리로 보여 준다 */
export const SearchProgressTree = ({
  states,
  libraries,
  selectedLibraries,
  onSelectLibrary,
}: SearchProgressTreeProps) => {
  const tree = useMemo(() => buildSearchTree(states, libraries), [states, libraries]);
  // 사용자가 직접 펼치거나 접은 노드. 새 검색이면 부모가 key 를 바꿔 초기화한다
  const [expanded, setExpanded] = useState<Map<string, boolean>>(new Map());
  const [open, setOpen] = useState(true);

  if (tree.length === 0) return null;

  const total = tree.reduce((sum, node) => sum + node.counts.total, 0);
  const available = tree.reduce((sum, node) => sum + node.counts.available, 0);
  const running = tree.some((node) => node.counts.pending + node.counts.searching > 0);

  const handleToggle = (id: string, value: boolean) =>
    setExpanded((prev) => new Map(prev).set(id, value));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-2 mb-4" data-testid="search-progress-tree">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full min-h-11 items-center gap-2 px-2 text-left text-sm text-gray-700"
      >
        <span className="w-3 text-gray-500" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
        <span className="font-medium">지역별 진행</span>
        <span className="ml-auto text-xs text-gray-600">
          {total}곳{available > 0 && ` · 대출 가능 ${available}곳`}
        </span>
      </button>
      <p className="sr-only" aria-live="polite">
        {running ? "" : `검색 완료. ${total}곳 중 대출 가능 ${available}곳`}
      </p>
      {open && (
        <ul>
          {tree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              expanded={expanded}
              onToggle={handleToggle}
              selectedLibraries={selectedLibraries}
              onSelectLibrary={onSelectLibrary}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

interface SearchPathProps {
  path: string[];
  status: LeafStatus;
  bookCount: number;
  availableCount: number;
}

/** 도서관 하나를 검색했을 때 그 도서관의 지역 경로와 결과 한 줄 */
export const SearchPath = ({ path, status, bookCount, availableCount }: SearchPathProps) => (
  <div
    className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-gray-200 bg-white px-3 py-2 mb-4 text-sm"
    data-testid="search-path"
  >
    <StatusMark status={status} />
    <span className="text-gray-700">{path.join(" › ")}</span>
    <span className="text-xs text-gray-600">
      — {leafText({ name: "", status, bookCount, availableCount })}
    </span>
  </div>
);
