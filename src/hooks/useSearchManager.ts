import { useState, useEffect, useCallback, useRef } from "react";
import { trackSearch } from "../analytics";
import { getUrlParams, updateUrl } from "../utils/url";
import type { Library } from "../types";

export const useSearchManager = (params: {
  libraryNames: Library[];
  filteredLibraries: Library[];
  performSearch: (title: string, libName: string, libraries: Library[]) => void;
  clearResults: () => void;
  resetFilters: () => void;
  addToHistory: (query: string) => void;
}) => {
  const {
    libraryNames,
    filteredLibraries,
    performSearch,
    clearResults,
    resetFilters,
    addToHistory,
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
    trackSearch(searchText, libraryName);

    performSearch(searchText, libraryName, filteredLibraries);
  }, [
    searchText,
    libraryName,
    filteredLibraries,
    performSearch,
    resetFilters,
    addToHistory,
  ]);

  return {
    searchText,
    setSearchText,
    libraryName,
    setLibraryName,
    handleSearch,
  };
};
