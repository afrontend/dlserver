declare module "dongnelibrary" {
  export interface Book {
    title: string;
    exist: boolean;
    bookUrl?: string;
    libraryName?: string;
  }

  export interface LibraryResult {
    libraryName: string;
    booklist: Book[];
  }

  export interface SearchOptions {
    title: string;
    libraryName?: string;
  }

  export interface SearchError {
    msg: string;
  }

  export type SearchCallback = (
    err: SearchError | null,
    books: LibraryResult[]
  ) => void;

  export function search(
    options: SearchOptions,
    _unused: null,
    callback: SearchCallback
  ): void;

  export function getLibraryNames(): string[];
}
