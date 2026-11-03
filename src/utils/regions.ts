import libraryRegions from "../data/libraryRegions.json";

/**
 * 시도 → 시군구 → 모듈 → 도서관 이름. 시군구를 정하지 못한 도서관은 "" 아래에 있다.
 * 같은 이름의 도서관이 여러 모듈에 있어 모듈까지 나눠 둔다.
 */
export type LibraryRegions = Record<string, Record<string, Record<string, string[]>>>;

export interface RegionInfo {
  sido: string;
  sigungus: string[];
}

/** scripts/build-library-regions.py 가 만든 매핑 */
export const LIBRARY_REGIONS: LibraryRegions = libraryRegions;

export const getRegionList = (regions: LibraryRegions = LIBRARY_REGIONS): RegionInfo[] =>
  Object.keys(regions)
    .sort((a, b) => a.localeCompare(b, "ko"))
    .map((sido) => ({
      sido,
      sigungus: Object.keys(regions[sido])
        .filter((sigungu) => sigungu !== "")
        .sort((a, b) => a.localeCompare(b, "ko")),
    }));

/** 지역에 도서관이 있는 모듈 → 그 지역에 있는 도서관 이름. 시군구가 비어 있으면 시도 전체 */
export const getRegionModules = (
  sido: string,
  sigungu: string,
  regions: LibraryRegions = LIBRARY_REGIONS,
): Map<string, Set<string>> => {
  const sigungus = regions[sido] ?? {};
  const selected = sigungu ? [sigungus[sigungu] ?? {}] : Object.values(sigungus);
  const result = new Map<string, Set<string>>();
  for (const modules of selected) {
    for (const [module, names] of Object.entries(modules)) {
      const set = result.get(module) ?? new Set<string>();
      names.forEach((name) => set.add(name));
      result.set(module, set);
    }
  }
  return result;
};

/** 지역의 도서관 이름 (모듈 구분 없이) */
export const getRegionLibraryNames = (
  sido: string,
  sigungu: string,
  regions: LibraryRegions = LIBRARY_REGIONS,
): Set<string> => {
  const names = new Set<string>();
  getRegionModules(sido, sigungu, regions).forEach((set) => set.forEach((name) => names.add(name)));
  return names;
};
