import { useState, useEffect } from "react";
import { getUrlParams } from "../utils/url";
import type { Library } from "../types";

export const useSearchState = (
  libraryNames: Library[],
  performSearch: (title: string, libName: string, libraries: Library[]) => void,
  clearResults: () => void,
) => {
  const [searchText, setSearchText] = useState(() => getUrlParams().title);
  const [libraryName, setLibraryName] = useState(() => getUrlParams().library);

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

  return { searchText, setSearchText, libraryName, setLibraryName };
};
