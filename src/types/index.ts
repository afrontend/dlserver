export interface Book {
  title: string;
  exist: boolean;
  bookUrl?: string;
  libraryName?: string;
}

export interface Library {
  id: number;
  name: string;
}

export interface LibrarySearchResult {
  booklist: Book[];
  /** 도서관 사이트에 접속하지 못했거나 응답을 읽지 못하면 채워진다 (booklist 는 빈 배열) */
  error?: { msg: string };
}

export type LibrarySearchParams = {
  title: string;
  libraryName: string;
  signal?: AbortSignal;
};

export interface ModuleInfo {
  name: string;
  libraries: string[];
}

export type LibrarySearchStatus = "pending" | "searching" | "done" | "error";

export interface LibrarySearchState {
  libraryName: string;
  status: LibrarySearchStatus;
  books: Book[];
}

export interface SearchProgress {
  totalLibraries: number;
  completedLibraries: number;
  searchingLibraries: string[];
  isSearchingAll: boolean;
}
