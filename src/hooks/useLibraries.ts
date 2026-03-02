import { useState, useEffect, useMemo } from "react";
import { LibraryAPI } from "../api/library";
import { sortByName } from "../utils/sorting";
import type { Library } from "../types";

export const useLibraries = () => {
  const [libraryNames, setLibraryNames] = useState<Library[]>([]);
  const [filterText, setFilterText] = useState("");

  useEffect(() => {
    LibraryAPI.getLibraryNames()
      .then((list) => {
        const libraries = list.map((name, index) => ({ id: index, name }));
        const sortedLibraries = sortByName(libraries);
        setLibraryNames(sortedLibraries);
      })
      .catch((error) => {
        console.error("Failed to load library names:", error);
      });
  }, []);

  const filteredLibraries = useMemo(() => {
    if (!filterText?.trim()) return libraryNames;
    return libraryNames.filter(
      (lib) => lib.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1,
    );
  }, [libraryNames, filterText]);

  return { libraryNames, filteredLibraries, filterText, setFilterText };
};
