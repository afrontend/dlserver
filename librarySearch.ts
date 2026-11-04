import * as dl from "dongnelibrary";
import type { SearchResult, Book } from "dongnelibrary";
import * as ansan from "dongnelibrary/dist/localLibraryModule/ansan";
import * as anyang from "dongnelibrary/dist/localLibraryModule/anyang";
import * as asan from "dongnelibrary/dist/localLibraryModule/asan";
import * as bcl from "dongnelibrary/dist/localLibraryModule/bcl";
import * as bppl from "dongnelibrary/dist/localLibraryModule/bppl";
import * as cbelib from "dongnelibrary/dist/localLibraryModule/cbelib";
import * as changwon from "dongnelibrary/dist/localLibraryModule/changwon";
import * as cheonan from "dongnelibrary/dist/localLibraryModule/cheonan";
import * as cheongju from "dongnelibrary/dist/localLibraryModule/cheongju";
import * as daegu from "dongnelibrary/dist/localLibraryModule/daegu";
import * as djdonggu from "dongnelibrary/dist/localLibraryModule/djdonggu";
import * as gangnam from "dongnelibrary/dist/localLibraryModule/gangnam";
import * as gangseo from "dongnelibrary/dist/localLibraryModule/gangseo";
import * as gbelib from "dongnelibrary/dist/localLibraryModule/gbelib";
import * as geoje from "dongnelibrary/dist/localLibraryModule/geoje";
import * as geumcheon from "dongnelibrary/dist/localLibraryModule/geumcheon";
import * as gg from "dongnelibrary/dist/localLibraryModule/gg";
import * as gimhae from "dongnelibrary/dist/localLibraryModule/gimhae";
import * as gjcity from "dongnelibrary/dist/localLibraryModule/gjcity";
import * as goyanglib from "dongnelibrary/dist/localLibraryModule/goyanglib";
import * as gunpo from "dongnelibrary/dist/localLibraryModule/gunpo";
import * as gunsan from "dongnelibrary/dist/localLibraryModule/gunsan";
import * as guro from "dongnelibrary/dist/localLibraryModule/guro";
import * as gwanak from "dongnelibrary/dist/localLibraryModule/gwanak";
import * as gwangjinsmall from "dongnelibrary/dist/localLibraryModule/gwangjinsmall";
import * as gwe from "dongnelibrary/dist/localLibraryModule/gwe";
import * as hanamlib from "dongnelibrary/dist/localLibraryModule/hanamlib";
import * as hscity from "dongnelibrary/dist/localLibraryModule/hscity";
import * as ice from "dongnelibrary/dist/localLibraryModule/ice";
import * as jbe from "dongnelibrary/dist/localLibraryModule/jbe";
import * as jeju from "dongnelibrary/dist/localLibraryModule/jeju";
import * as jeonju from "dongnelibrary/dist/localLibraryModule/jeonju";
import * as jongno from "dongnelibrary/dist/localLibraryModule/jongno";
import * as junggulib from "dongnelibrary/dist/localLibraryModule/junggulib";
import * as mapo from "dongnelibrary/dist/localLibraryModule/mapo";
import * as michu from "dongnelibrary/dist/localLibraryModule/michu";
import * as mokpolib from "dongnelibrary/dist/localLibraryModule/mokpolib";
import * as namwon from "dongnelibrary/dist/localLibraryModule/namwon";
import * as nowon from "dongnelibrary/dist/localLibraryModule/nowon";
import * as nyj from "dongnelibrary/dist/localLibraryModule/nyj";
import * as osan from "dongnelibrary/dist/localLibraryModule/osan";
import * as paju from "dongnelibrary/dist/localLibraryModule/paju";
import * as pen from "dongnelibrary/dist/localLibraryModule/pen";
import * as pohang from "dongnelibrary/dist/localLibraryModule/pohang";
import * as ptlib from "dongnelibrary/dist/localLibraryModule/ptlib";
import * as saha from "dongnelibrary/dist/localLibraryModule/saha";
import * as sblib from "dongnelibrary/dist/localLibraryModule/sblib";
import * as sdm from "dongnelibrary/dist/localLibraryModule/sdm";
import * as sejong from "dongnelibrary/dist/localLibraryModule/sejong";
import * as siheung from "dongnelibrary/dist/localLibraryModule/siheung";
import * as snlib from "dongnelibrary/dist/localLibraryModule/snlib";
import * as splib from "dongnelibrary/dist/localLibraryModule/splib";
import * as suwon from "dongnelibrary/dist/localLibraryModule/suwon";
import * as uilib from "dongnelibrary/dist/localLibraryModule/uilib";
import * as ulju from "dongnelibrary/dist/localLibraryModule/ulju";
import * as ulsanjunggu from "dongnelibrary/dist/localLibraryModule/ulsanjunggu";
import * as uwlib from "dongnelibrary/dist/localLibraryModule/uwlib";
import * as wanju from "dongnelibrary/dist/localLibraryModule/wanju";
import * as wonju from "dongnelibrary/dist/localLibraryModule/wonju";
import * as yangcheon from "dongnelibrary/dist/localLibraryModule/yangcheon";
import * as ydplib from "dongnelibrary/dist/localLibraryModule/ydplib";
import * as yeonsu from "dongnelibrary/dist/localLibraryModule/yeonsu";
import * as yjlib from "dongnelibrary/dist/localLibraryModule/yjlib";
import * as yongin from "dongnelibrary/dist/localLibraryModule/yongin";
import * as yongsan from "dongnelibrary/dist/localLibraryModule/yongsan";
import * as yplib from "dongnelibrary/dist/localLibraryModule/yplib";
import * as yslib from "dongnelibrary/dist/localLibraryModule/yslib";
import * as yuseong from "dongnelibrary/dist/localLibraryModule/yuseong";

export const LIBRARY_MODULES = [ansan, anyang, asan, bcl, bppl, cbelib, changwon, cheonan, cheongju, daegu, djdonggu, gangnam, gangseo, gbelib, geoje, geumcheon, gg, gimhae, gjcity, goyanglib, gunpo, gunsan, guro, gwanak, gwangjinsmall, gwe, hanamlib, hscity, ice, jbe, jeju, jeonju, jongno, junggulib, mapo, michu, mokpolib, namwon, nowon, nyj, osan, paju, pen, pohang, ptlib, saha, sblib, sdm, sejong, siheung, snlib, splib, suwon, uilib, ulju, ulsanjunggu, uwlib, wanju, wonju, yangcheon, ydplib, yeonsu, yjlib, yongin, yongsan, yplib, yslib, yuseong];

type LibraryModule = (typeof LIBRARY_MODULES)[number];

/** 모듈에서 직접 검색한 결과에는 모듈명을 붙인다. 이름이 같은 도서관을 구분할 때 쓴다 */
export type LibrarySearchResult = SearchResult & { moduleName?: string };

/**
 * 이름이 정확히 같은 도서관이 있는 모듈. module 을 주면 그 모듈만 본다.
 * dongnelibrary 는 이름의 부분 일치·첫 일치로 도서관을 찾아서 같은 이름이나
 * 다른 이름에 포함되는 이름의 도서관을 엉뚱한 곳으로 검색한다.
 */
export const findLibraryModules = (libraryName: string, moduleName?: string): LibraryModule[] =>
  LIBRARY_MODULES.filter(
    (mod) =>
      (!moduleName || mod.moduleName === moduleName) && mod.getLibraryNames().includes(libraryName),
  );

/** 결과 모양은 dongnelibrary 의 search 와 같다 (실패하면 error 와 빈 booklist) */
const searchModuleLibrary = (
  mod: LibraryModule,
  title: string,
  libraryName: string,
  signal?: AbortSignal,
): Promise<LibrarySearchResult | null> =>
  new Promise((resolve) => {
    mod.search({ title, libraryName, signal }, (err, data) => {
      if (signal?.aborted) {
        resolve(null);
        return;
      }
      const base = { title, libraryName, moduleName: mod.moduleName, homeUrl: mod.homeUrl };
      if (err || !data?.booklist) {
        const error = err ? { ...err, libraryName } : { msg: "invalid Data response", libraryName };
        console.error(error);
        resolve({ ...base, totalBookCount: 0, booklist: [], error });
        return;
      }
      const booklist = data.booklist
        .map(({ libraryName, title, exist, bookUrl }: Book) => ({ libraryName, title, exist, bookUrl }))
        .sort((a: Book, b: Book) => (a.exist === b.exist ? 0 : a.exist ? -1 : 1));
      resolve({
        ...base,
        totalBookCount: data.totalBookCount,
        startPage: data.startPage,
        booklist,
      });
    });
  });

const searchByName = (
  title: string,
  libraryName: string,
  signal?: AbortSignal,
): Promise<LibrarySearchResult[]> =>
  new Promise((resolve, reject) => {
    dl.search({ title, libraryName, signal }, undefined, (err, books) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(books ?? []);
      }
    });
  });

/**
 * 이름이 정확히 같은 도서관이 있으면 그 모듈로 바로 검색한다. 여러 모듈에 있으면 모두 검색하고,
 * module 을 주면 그 모듈의 도서관만 검색한다.
 * 그런 도서관이 없으면(빈 이름·모듈명·이름 일부 등) dongnelibrary 로 이름 검색한다.
 */
export const searchBooks = async (
  title: string,
  libraryName: string,
  signal?: AbortSignal,
  moduleName?: string,
): Promise<LibrarySearchResult[]> => {
  const mods = libraryName ? findLibraryModules(libraryName, moduleName) : [];
  if (mods.length === 0) return searchByName(title, libraryName, signal);
  const results = await Promise.all(
    mods.map((mod) => searchModuleLibrary(mod, title, libraryName, signal)),
  );
  return results.filter((r): r is LibrarySearchResult => r !== null);
};

/** 결과의 도서관 이름. 모듈에서 직접 검색했으면 "중앙도서관 (천안시도서관)" */
export const resultLabel = (result: LibrarySearchResult): string =>
  result.moduleName ? `${result.libraryName} (${result.moduleName})` : (result.libraryName ?? "");

/** MCP·에이전트가 고를 수 있게 모듈별 도서관 목록 */
export const libraryListByModule = (): string =>
  [...LIBRARY_MODULES]
    .sort((a, b) => a.moduleName.localeCompare(b.moduleName, "ko"))
    .map((mod) => `${mod.moduleName}: ${mod.getLibraryNames().join(", ")}`)
    .join("\n");
