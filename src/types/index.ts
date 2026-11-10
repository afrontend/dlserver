export interface Book {
  title: string;
  exist: boolean;
  bookUrl?: string;
  libraryName?: string;
  /** 서버가 도서관 사이트에서 이 결과를 받은 시각 (ISO). 캐시된 결과면 처음 받은 시각 */
  checkedAt?: string;
}

export interface Library {
  id: number;
  /** 화면에 보이는 이름이자 식별자. 이름이 같은 도서관이 있으면 "이름 (모듈명)" */
  name: string;
  /** 도서관 사이트에서 쓰는 실제 이름. 없으면 name 과 같다 */
  libraryName?: string;
  /** 이 도서관을 검색하는 dongnelibrary 모듈 */
  module?: string;
}

export interface LibrarySearchResult {
  booklist: Book[];
  checkedAt?: string;
  /** 도서관 사이트에 접속하지 못했거나 응답을 읽지 못하면 채워진다 (booklist 는 빈 배열) */
  error?: { msg: string };
}

export type LibrarySearchParams = {
  title: string;
  libraryName: string;
  module?: string;
  signal?: AbortSignal;
  /** 서버 캐시를 건너뛰고 도서관 사이트에서 다시 받는다 */
  fresh?: boolean;
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
