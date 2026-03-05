import { useState, useEffect, useMemo, useCallback } from "react";
import { LibraryAPI } from "../api/library";
import { sortByName } from "../utils/sorting";
import type { Library, ModuleInfo } from "../types";

export const useLibraries = () => {
  const [libraryNames, setLibraryNames] = useState<Library[]>([]);
  const [filterText, setFilterText] = useState("");
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModule, setSelectedModuleState] = useState("");

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

  // 모듈 선택 여부에 따른 기본 도서관 목록
  const baseLibraries = useMemo(() => {
    if (selectedModule) {
      const mod = modules.find((m) => m.name === selectedModule);
      if (mod) {
        const moduleLibraries = mod.libraries.map((name, index) => ({
          id: index,
          name,
        }));
        return sortByName(moduleLibraries);
      }
    }
    return libraryNames;
  }, [libraryNames, selectedModule, modules]);

  // filterText는 도서관 드롭다운 목록에만 영향
  const filteredLibraries = useMemo(() => {
    if (filterText?.trim()) {
      return baseLibraries.filter(
        (lib) => lib.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1,
      );
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
