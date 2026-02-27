import { useCallback, useEffect, useRef } from "react";
import { getUrlParams, updateUrl } from "../utils/url";
import type { Library } from "../types";

export const useSearchCoordinator = (params: {
  searchText: string;
  libraryName: string;
  libraryNames: Library[];
  performSearch: (title: string, libName: string, libraries: Library[]) => void;
  resetFilters: () => void;
  addToHistory: (query: string) => void;
}) => {
  const { searchText, libraryName, libraryNames, performSearch, resetFilters, addToHistory } =
    params;

  const initialSearchFiredRef = useRef(false);

  useEffect(() => {
    if (libraryNames.length > 0 && !initialSearchFiredRef.current) {
      const { title, library } = getUrlParams();
      if (title) {
        initialSearchFiredRef.current = true;
        performSearch(title, library, libraryNames);
      }
    }
  }, [libraryNames, performSearch]);

  const handleSearch = useCallback(() => {
    if (!searchText?.length) {
      console.log("검색할 책 이름을 입력해주세요.");
      return;
    }

    resetFilters();
    addToHistory(searchText);
    updateUrl(searchText, libraryName);
    performSearch(searchText, libraryName, libraryNames);
  }, [searchText, libraryName, libraryNames, performSearch, resetFilters, addToHistory]);

  return { handleSearch };
};
