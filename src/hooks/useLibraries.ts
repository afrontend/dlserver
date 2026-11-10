import { useState, useEffect, useMemo, useCallback } from "react";
import { LibraryAPI } from "../api/library";
import { sortByName } from "../utils/sorting";
import { getRegionModules } from "../utils/regions";
import type { Library, ModuleInfo } from "../types";

/**
 * 모듈 목록을 도서관 목록으로 편다. 여러 모듈에 같은 이름의 도서관이 있으면
 * "중앙도서관 (안산시도서관)"처럼 모듈명을 붙여 구분한다.
 */
export const modulesToLibraries = (modules: ModuleInfo[]): Library[] => {
  const counts = new Map<string, number>();
  modules.forEach((m) => m.libraries.forEach((name) => counts.set(name, (counts.get(name) ?? 0) + 1)));
  let id = 0;
  return sortByName(
    modules.flatMap((m) =>
      m.libraries.map((name) => ({
        id: id++,
        name: (counts.get(name) ?? 0) > 1 ? `${name} (${m.name})` : name,
        libraryName: name,
        module: m.name,
        homeUrl: m.homeUrl,
        ...(m.unreachable && { unreachable: true }),
      })),
    ),
  );
};

export const useLibraries = () => {
  const [filterText, setFilterText] = useState("");
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const [selectedModule, setSelectedModuleState] = useState("");
  const [selectedSido, setSelectedSido] = useState("");
  const [selectedSigungu, setSelectedSigungu] = useState("");

  useEffect(() => {
    LibraryAPI.getModuleList()
      .then(setModules)
      .catch((error) => {
        console.error("Failed to load module list:", error);
      });
  }, []);

  const libraryNames = useMemo(() => modulesToLibraries(modules), [modules]);

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
    if (!selectedModule && !regionModules) return libraryNames;
    return libraryNames.filter(
      (lib) =>
        (!selectedModule || lib.module === selectedModule) &&
        (!regionModules || regionModules.get(lib.module ?? "")?.has(lib.libraryName ?? lib.name)),
    );
  }, [libraryNames, selectedModule, regionModules]);

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
