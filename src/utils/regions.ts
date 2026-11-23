import libraryRegions from "../data/libraryRegions.json";
import type { Library } from "../types";

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

/** 도서관이 있는 시도·시군구. 시군구를 정하지 못했으면 sigungu 는 "" */
export interface LibraryRegion {
  sido: string;
  sigungu: string;
}

/** "모듈\u0000도서관 실제 이름" → 지역 */
export type RegionIndex = Map<string, LibraryRegion>;

const regionKey = (module: string, name: string) => `${module}\u0000${name}`;

/** 모듈과 도서관 이름으로 지역을 찾는 역색인. 같은 도서관이 두 지역에 있으면 먼저 나온 쪽을 쓴다 */
export const buildRegionIndex = (regions: LibraryRegions = LIBRARY_REGIONS): RegionIndex => {
  const index: RegionIndex = new Map();
  for (const [sido, sigungus] of Object.entries(regions)) {
    for (const [sigungu, modules] of Object.entries(sigungus)) {
      for (const [module, names] of Object.entries(modules)) {
        names.forEach((name) => {
          const key = regionKey(module, name);
          if (!index.has(key)) index.set(key, { sido, sigungu });
        });
      }
    }
  }
  return index;
};

export const REGION_INDEX: RegionIndex = buildRegionIndex();

export const findLibraryRegion = (
  library: Library,
  index: RegionIndex = REGION_INDEX,
): LibraryRegion | undefined =>
  library.module ? index.get(regionKey(library.module, library.libraryName ?? library.name)) : undefined;

/** 시도 › 시군구 › 모듈 › 도서관. 모르는 단계는 뺀다 */
export const getLibraryPath = (library: Library, index: RegionIndex = REGION_INDEX): string[] => {
  const region = findLibraryRegion(library, index);
  return [region?.sido, region?.sigungu, library.module, library.libraryName ?? library.name].filter(
    (part): part is string => !!part,
  );
};
