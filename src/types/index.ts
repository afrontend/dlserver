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
