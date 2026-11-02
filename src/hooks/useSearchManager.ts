import { useState, useEffect, useCallback, useRef } from "react";
import { trackSearch, type SearchScope } from "../analytics";
import { DEFAULT_LIBRARY } from "../constants";
import { getUrlParams, updateUrl } from "../utils/url";
import type { Library } from "../types";

export const useSearchManager = (params: {
  libraryNames: Library[];
  filteredLibraries: Library[];
  performSearch: (title: string, libName: string, libraries: Library[]) => void;
  clearResults: () => void;
  resetFilters: () => void;
  addToHistory: (query: string) => void;
  /** 도서관 하나를 골라 검색했을 때 그 도서관을 "내 도서관"에 남긴다 */
  addToMyLibraries?: (libraryName: string) => void;
}) => {
  const {
    libraryNames,
    filteredLibraries,
    performSearch,
    clearResults,
    resetFilters,
    addToHistory,
    addToMyLibraries,
  } = params;

  const initialParams = getUrlParams();
  const [searchText, setSearchText] = useState(initialParams.title);
  const [libraryName, setLibraryName] = useState(initialParams.library);
  const initialSearchFiredRef = useRef(false);

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
    if (!searchText?.length) return;

    resetFilters();
    addToHistory(searchText);
    updateUrl(searchText, libraryName);
    const scope: SearchScope =
      libraryName !== DEFAULT_LIBRARY
        ? "single"
        : filteredLibraries.length === libraryNames.length
          ? "all"
          : "group";
    if (scope === "single") {
      addToMyLibraries?.(libraryName);
    }
    trackSearch(
      searchText,
      libraryName,
      scope,
      scope === "single" ? 1 : filteredLibraries.length,
    );

    performSearch(searchText, libraryName, filteredLibraries);
  }, [
    searchText,
    libraryName,
    libraryNames,
    filteredLibraries,
    performSearch,
    resetFilters,
    addToHistory,
    addToMyLibraries,
  ]);

  return {
    searchText,
    setSearchText,
    libraryName,
    setLibraryName,
    handleSearch,
  };
};
