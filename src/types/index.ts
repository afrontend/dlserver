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
}

export type LibrarySearchParams = {
  title: string;
  libraryName: string;
  signal?: AbortSignal;
};

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
