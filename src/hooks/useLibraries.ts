import { useState, useEffect, useMemo, useCallback } from "react";
import { LibraryAPI } from "../api/library";
import { sortByName } from "../utils/sorting";
import { getRegionModules } from "../utils/regions";
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

  const setSelectedModule = useCallback((moduleName: string) => {
    setSelectedModuleState(moduleName);
    setFilterText("");
  }, []);

  /** 시군구가 비어 있으면 시도 전체. 고른 모듈이 새 지역에 도서관이 없으면 모듈 선택을 푼다 */
  const setSelectedRegion = useCallback(
    (sido: string, sigungu = "") => {
      setSelectedSido(sido);
      setSelectedSigungu(sido ? sigungu : "");
      setFilterText("");
      if (sido && selectedModule && !getRegionModules(sido, sigungu).has(selectedModule)) {
        setSelectedModuleState("");
      }
    },
    [selectedModule],
  );

  const regionModules = useMemo(
    () => (selectedSido ? getRegionModules(selectedSido, selectedSigungu) : null),
    [selectedSido, selectedSigungu],
  );

  // 지역을 고르면 그 지역에 도서관이 있는 모듈만 보여 준다
  const availableModules = useMemo(
    () => (regionModules ? modules.filter((m) => regionModules.has(m.name)) : modules),
    [modules, regionModules],
  );

  // 모듈과 지역을 함께 고르면 그 모듈에서 그 지역에 있는 도서관만 남긴다
  const baseLibraries = useMemo(() => {
    const mod = selectedModule ? modules.find((m) => m.name === selectedModule) : undefined;
    if (regionModules) {
      const names = new Set<string>();
      regionModules.forEach((set, module) => {
        if (!mod || module === mod.name) set.forEach((name) => names.add(name));
      });
      const libraries = mod ? sortByName(namesToLibraries(mod.libraries)) : libraryNames;
      return libraries.filter((lib) => names.has(lib.name));
    }
    if (mod) {
      return sortByName(namesToLibraries(mod.libraries));
    }
    return libraryNames;
  }, [libraryNames, selectedModule, modules, regionModules]);

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
    availableModules,
    selectedModule,
    setSelectedModule,
    selectedSido,
    selectedSigungu,
    setSelectedRegion,
  };
};
