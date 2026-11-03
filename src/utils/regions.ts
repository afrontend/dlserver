import libraryRegions from "../data/libraryRegions.json";

/** 시도 → 시군구 → 도서관 이름. 시군구를 정하지 못한 도서관은 "" 아래에 있다 */
export type LibraryRegions = Record<string, Record<string, string[]>>;

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

/** 시군구가 비어 있으면 시도 전체 */
export const getRegionLibraryNames = (
  sido: string,
  sigungu: string,
  regions: LibraryRegions = LIBRARY_REGIONS,
): Set<string> => {
  const sigungus = regions[sido];
  if (!sigungus) return new Set();
  if (sigungu) return new Set(sigungus[sigungu] ?? []);
  return new Set(Object.values(sigungus).flat());
};
