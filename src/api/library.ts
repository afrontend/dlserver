import type { LibrarySearchResult, LibrarySearchParams } from "../types";

export const LibraryAPI = {
  getLibrary: async ({
    title,
    libraryName,
    signal,
  }: LibrarySearchParams): Promise<LibrarySearchResult[]> => {
    const params = new URLSearchParams({ title, libraryName });
    return fetch(`/search?${params}`, { signal }).then((response) => {
      if (!response.ok) {
        throw new Error("검색에 실패했어요.");
      }
      return response.json();
    });
  },
  getLibraryNames: (): Promise<string[]> =>
    fetch("/libraryList").then((response) => response.json()),
};
