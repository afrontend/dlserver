import * as dl from "dongnelibrary";
import type { SearchResult, Book, LibraryModule } from "dongnelibrary";

export const LIBRARY_MODULES: readonly LibraryModule[] = dl.getLibraryModules();

/** 모듈에서 직접 검색한 결과에는 모듈명을 붙인다. 이름이 같은 도서관을 구분할 때 쓴다 */
export type LibrarySearchResult = SearchResult & {
  moduleName?: string;
  /** 도서관 사이트에서 결과를 받은 시각 (ISO). 캐시된 결과면 처음 받은 시각이다 */
  checkedAt?: string;
};

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

const searchUncached = async (
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

// 같은 (책, 도서관) 검색은 잠시 서버 메모리의 결과를 돌려준다. 재검색·공유 링크가 바로 뜨고
// 도서관 사이트에 같은 요청을 반복하지 않는다. 실패가 섞인 결과는 남기지 않는다.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 500;
const searchCache = new Map<string, { expiresAt: number; results: LibrarySearchResult[] }>();

export const clearSearchCache = (): void => searchCache.clear();

/**
 * 이름이 정확히 같은 도서관이 있으면 그 모듈로 바로 검색한다. 여러 모듈에 있으면 모두 검색하고,
 * module 을 주면 그 모듈의 도서관만 검색한다.
 * 그런 도서관이 없으면(빈 이름·모듈명·이름 일부 등) dongnelibrary 로 이름 검색한다.
 * fresh 면 캐시를 읽지 않고 도서관 사이트에서 다시 받는다 (받은 결과는 캐시에 남긴다).
 */
export const searchBooks = async (
  title: string,
  libraryName: string,
  signal?: AbortSignal,
  moduleName?: string,
  { fresh = false }: { fresh?: boolean } = {},
): Promise<LibrarySearchResult[]> => {
  const key = JSON.stringify([title, libraryName, moduleName ?? ""]);
  const cached = searchCache.get(key);
  if (cached && !fresh && cached.expiresAt > Date.now()) return cached.results;
  searchCache.delete(key);

  const checkedAt = new Date().toISOString();
  const results = (await searchUncached(title, libraryName, signal, moduleName)).map((r) => ({
    ...r,
    checkedAt,
  }));
  if (!signal?.aborted && results.length > 0 && results.every((r) => !r.error)) {
    searchCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, results });
    if (searchCache.size > CACHE_MAX_ENTRIES) {
      searchCache.delete(searchCache.keys().next().value!);
    }
  }
  return results;
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
