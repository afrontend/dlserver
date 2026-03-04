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
    if (moduleName) {
      setFilterText("");
    }
  }, []);

  const setFilterTextWithClear = useCallback((text: string) => {
    setFilterText(text);
    if (text) {
      setSelectedModuleState("");
    }
  }, []);

  const filteredLibraries = useMemo(() => {
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

    if (filterText?.trim()) {
      return libraryNames.filter(
        (lib) => lib.name.toLowerCase().indexOf(filterText.toLowerCase()) !== -1,
      );
    }

    return libraryNames;
  }, [libraryNames, filterText, selectedModule, modules]);

  return {
    libraryNames,
    filteredLibraries,
    filterText,
    setFilterText: setFilterTextWithClear,
    modules,
    selectedModule,
    setSelectedModule,
  };
};
