import type { LibrarySearchResult, LibrarySearchParams, ModuleInfo } from "../types";

export const LibraryAPI = {
  getLibrary: async ({
    title,
    libraryName,
    module,
    signal,
  }: LibrarySearchParams): Promise<LibrarySearchResult[]> => {
    const params = new URLSearchParams({ title, libraryName });
    if (module) params.set("module", module);
    return fetch(`/search?${params}`, { signal }).then((response) => {
      if (!response.ok) {
        throw new Error("검색에 실패했어요.");
      }
      return response.json();
    });
  },
  getModuleList: (): Promise<ModuleInfo[]> =>
    fetch("/moduleList").then((response) => response.json()),
};
