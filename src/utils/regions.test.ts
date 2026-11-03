import { describe, it, expect } from "vitest";
import { getRegionLibraryNames, getRegionList, LIBRARY_REGIONS } from "./regions";

const regions = {
  서울특별시: { 마포구: ["마포중앙도서관"], 광진구: ["광진정보도서관"] },
  경기도: { "": ["경기교육도서관"], 성남시: ["판교도서관", "분당도서관"] },
};

describe("regions", () => {
  it("시도·시군구를 가나다순으로 나열하고 시군구 미상은 뺀다", () => {
    expect(getRegionList(regions)).toEqual([
      { sido: "경기도", sigungus: ["성남시"] },
      { sido: "서울특별시", sigungus: ["광진구", "마포구"] },
    ]);
  });

  it("시군구를 고르면 그 시군구의 도서관만 돌려준다", () => {
    expect(getRegionLibraryNames("경기도", "성남시", regions)).toEqual(new Set(["판교도서관", "분당도서관"]));
  });

  it("시군구가 비어 있으면 시군구 미상까지 시도 전체를 돌려준다", () => {
    expect(getRegionLibraryNames("경기도", "", regions)).toEqual(
      new Set(["경기교육도서관", "판교도서관", "분당도서관"]),
    );
  });

  it("없는 시도면 빈 집합", () => {
    expect(getRegionLibraryNames("제주특별자치도", "", regions).size).toBe(0);
  });

  it("생성된 매핑에 시도가 들어 있다", () => {
    expect(Object.keys(LIBRARY_REGIONS)).toContain("서울특별시");
    expect(getRegionLibraryNames("서울특별시", "").size).toBeGreaterThan(0);
  });
});
