import { useState, useEffect, useMemo, useCallback } from "react";
import { LibraryAPI } from "../api/library";
import { sortByName } from "../utils/sorting";
import { getRegionLibraryNames } from "../utils/regions";
import type { Library, ModuleInfo } from "../types";

const namesToLibraries = (names: string[]): Library[] =>
  names.map((name, index) => ({ id: index, name }));

export const useLibraries = () => {
  const [libraryNames, setLibraryNames] = useState<Library[]>([]);
  const [filterText, setFilterText] = useState("");
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModule, setSelectedModuleState] = useState("");
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState("");

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

  // 모듈과 지역은 둘 중 하나로만 좁힌다
  const setSelectedModule = useCallback((moduleName: string) => {
    setSelectedModuleState(moduleName);
    setSelectedSido("");
    setSelectedSigungu("");
    setFilterText("");
  }, []);

  /** 시군구가 비어 있으면 시도 전체 */
  const setSelectedRegion = useCallback((sido: string, sigungu = "") => {
    setSelectedSido(sido);
    setSelectedSigungu(sido ? sigungu : "");
    setSelectedModuleState("");
    setFilterText("");
  }, []);

  const baseLibraries = useMemo(() => {
    if (selectedModule) {
      const mod = modules.find((m) => m.name === selectedModule);
      if (mod) {
        return sortByName(namesToLibraries(mod.libraries));
      }
    }
    if (selectedSido) {
      const names = getRegionLibraryNames(selectedSido, selectedSigungu);
      return libraryNames.filter((lib) => names.has(lib.name));
    }
    return libraryNames;
  }, [libraryNames, selectedModule, modules, selectedSido, selectedSigungu]);

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
    selectedSido,
    selectedSigungu,
    setSelectedRegion,
  };
};
