import { useState, useEffect, useMemo, useCallback } from "react";
import { LibraryAPI } from "../api/library";
import { sortByName } from "../utils/sorting";
import type { Library, ModuleInfo } from "../types";

const namesToLibraries = (names: string[]): Library[] =>
  names.map((name, index) => ({ id: index, name }));

export const useLibraries = () => {
  const [libraryNames, setLibraryNames] = useState<Library[]>([]);
  const [filterText, setFilterText] = useState("");
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModule, setSelectedModuleState] = useState("");

  useEffect(() => {
    LibraryAPI.getLibraryNames()
      .then((list) => {
        setLibraryNames(sortByName(namesToLibraries(list)));
      })
      .catch((error) => {
        console.error("Failed to load library names:", error);
      });
  }, []);

  useEffect(() => {
    LibraryAPI.getModuleList()
      .then(setModules)
      .catch((error) => {
        console.error("Failed to load module list:", error);
      });
  }, []);

  const setSelectedModule = useCallback((moduleName: string) => {
    setSelectedModuleState(moduleName);
    setFilterText("");
  }, []);

  const baseLibraries = useMemo(() => {
    if (selectedModule) {
      const mod = modules.find((m) => m.name === selectedModule);
      if (mod) {
        return sortByName(namesToLibraries(mod.libraries));
      }
    }
    return libraryNames;
  }, [libraryNames, selectedModule, modules]);

  // filterText는 도서관 드롭다운 목록에만 영향
  const filteredLibraries = useMemo(() => {
    if (filterText.trim()) {
      const lower = filterText.trim().toLowerCase();
      return baseLibraries.filter((lib) => lib.name.toLowerCase().includes(lower));
    }
    return baseLibraries;
  }, [baseLibraries, filterText]);

  return {
    libraryNames,
    baseLibraries,
    filteredLibraries,
    filterText,
    setFilterText,
    modules,
    selectedModule,
    setSelectedModule,
  };
};
