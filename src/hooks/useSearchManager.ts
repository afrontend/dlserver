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
  /** "내 도서관" 이름. 북마클릿·확장이 도서관 없이 열면 이 도서관들을 검색한다 */
  myLibraries?: string[];
}) => {
  const {
    libraryNames,
    filteredLibraries,
    performSearch,
    clearResults,
    resetFilters,
    addToHistory,
    addToMyLibraries,
    myLibraries = [],
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
      const { title, library, ref } = getUrlParams();
      if (title) {
        initialSearchFiredRef.current = true;
        if (ref && library === DEFAULT_LIBRARY) {
          // 북마클릿·확장은 도서관을 모른다. 전체(1,342곳) 대신 내 도서관을 검색하고,
          // 내 도서관이 없으면 제목만 채워 두고 도서관을 고르게 한다.
          const mine = libraryNames.filter((lib) => myLibraries.includes(lib.name));
          if (mine.length > 0) performSearch(title, DEFAULT_LIBRARY, mine);
          return;
        }
        performSearch(title, library, libraryNames);
      }
    }
  }, [libraryNames, performSearch, myLibraries]);

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
