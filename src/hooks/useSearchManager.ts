import { useState, useEffect, useCallback, useRef } from "react";
import { getUrlParams, updateUrl } from "../utils/url";
import type { Library } from "../types";

export const useSearchManager = (params: {
  libraryNames: Library[];
  performSearch: (title: string, libName: string, libraries: Library[]) => void;
  clearResults: () => void;
  resetFilters: () => void;
  addToHistory: (query: string) => void;
}) => {
  const { libraryNames, performSearch, clearResults, resetFilters, addToHistory } = params;

  const [searchText, setSearchText] = useState(() => getUrlParams().title);
  const [libraryName, setLibraryName] = useState(() => getUrlParams().library);
  const initialSearchFiredRef = useRef(false);

  // popstate handler (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const { title, library } = getUrlParams();
      setSearchText(title);
      setLibraryName(library);
      if (title && libraryNames.length > 0) {
        performSearch(title, library, libraryNames);
      } else {
        clearResults();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [libraryNames, performSearch, clearResults]);

  // initial URL search
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

  return { searchText, setSearchText, libraryName, setLibraryName, handleSearch };
};
