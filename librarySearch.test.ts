import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import * as dl from "dongnelibrary";
import { LIBRARY_MODULES, libraryListByModule } from "./librarySearch";

type LibraryRegions = Record<string, Record<string, Record<string, string[]>>>;

const sorted = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b, "ko"));

describe("LIBRARY_MODULES", () => {
  // dongnelibrary 를 올린 뒤 새 모듈을 librarySearch.ts 에 등록하지 않으면 여기서 실패한다
  it("dongnelibrary 의 모든 모듈이 등록되어 있다", () => {
    const registered: string[] = LIBRARY_MODULES.map((mod) => mod.moduleName);
    const available = dl.getAllModuleNames();
    expect({
      missing: available.filter((name) => !registered.includes(name)),
      stale: registered.filter((name) => !available.includes(name)),
    }).toEqual({ missing: [], stale: [] });
  });

  it("모든 도서관에 지역 매핑이 있다 (없으면 scripts/build-library-regions.py)", () => {
    const regions: LibraryRegions = JSON.parse(readFileSync("src/data/libraryRegions.json", "utf8"));
    const mapped = new Set<string>();
    for (const sigungus of Object.values(regions))
      for (const modules of Object.values(sigungus))
        for (const [moduleName, names] of Object.entries(modules))
          names.forEach((name) => mapped.add(`${moduleName}|${name}`));

    const unmapped = LIBRARY_MODULES.flatMap((mod) =>
      mod.getLibraryNames().filter((name) => !mapped.has(`${mod.moduleName}|${name}`)).map((name) => `${mod.moduleName}: ${name}`),
    );
    expect(unmapped).toEqual([]);
  });
});

describe("libraryListByModule", () => {
  it("모듈 이름순으로 나열한다", () => {
    const names = libraryListByModule()
      .split("\n")
      .map((line) => line.split(":")[0]);
    expect(names).toEqual(sorted(names));
    expect(names).toHaveLength(LIBRARY_MODULES.length);
  });
});
