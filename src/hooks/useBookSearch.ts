import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { LibraryAPI } from "../api/library";
import { sortByTitle } from "../utils/sorting";
import type { Book, Library, LibrarySearchState, SearchProgress } from "../types";
import { DEFAULT_LIBRARY } from "../constants";
import { trackSearchCancel, trackSearchComplete } from "../analytics";

const MAX_CONCURRENT_SEARCHES = 3;
/** 서버에서 접속할 수 없는 도서관의 오류 코드 (librarySearch.ts 의 UNREACHABLE_CODE) */
const UNREACHABLE_CODE = "UNREACHABLE";

// 측정용: 진행 중인 검색의 시작 시각과 완료된 도서관 수
interface SearchRun {
  startedAt: number;
  libraryCount: number;
  completedCount: number;
}

const countAvailable = (books: Book[]): number =>
  books.filter((book) => book.exist).length;

const getDoneBooks = (states: Map<string, LibrarySearchState>): Book[] =>
  Array.from(states.values())
    .filter((s) => s.status === "done")
    .flatMap((s) => s.books);

export const useBookSearch = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [librarySearchStates, setLibrarySearchStates] = useState<Map<string, LibrarySearchState>>(
    new Map(),
  );

  const [failedLibrary, setFailedLibrary] = useState<{ name: string; unreachable: boolean } | null>(
    null,
  );

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchRunRef = useRef<SearchRun | null>(null);
  const lastSearchRef = useRef<{ title: string; libName: string; libraries: Library[] } | null>(null);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const searchProgress: SearchProgress = useMemo(() => {
    const states = Array.from(librarySearchStates.values());
    const completedLibraries = states.filter(
      (s) => s.status === "done" || s.status === "error",
    ).length;
    const searchingLibraries = states
      .filter((s) => s.status === "searching")
      .map((s) => s.libraryName);

    return {
      totalLibraries: states.length,
      completedLibraries,
      searchingLibraries,
      isSearchingAll,
    };
  }, [librarySearchStates, isSearchingAll]);

  // 검색하지 못한 도서관. 서버에서 접속할 수 없는 도서관(unreachable)은 따로 모은다
  const [failedLibraries, unreachableLibraries] = useMemo((): [string[], string[]] => {
    const failures = isSearchingAll
      ? Array.from(librarySearchStates.values())
          .filter((s) => s.status === "error")
          .map((s) => ({ name: s.libraryName, unreachable: !!s.unreachable }))
      : failedLibrary
        ? [failedLibrary]
        : [];
    return [
      failures.filter((f) => !f.unreachable).map((f) => f.name),
      failures.filter((f) => f.unreachable).map((f) => f.name),
    ];
  }, [librarySearchStates, isSearchingAll, failedLibrary]);

  const aggregatedBooks: Book[] = useMemo(() => {
    if (!isSearchingAll) return books;
    return sortByTitle(getDoneBooks(librarySearchStates));
  }, [librarySearchStates, isSearchingAll, books]);

  // 모듈을 알면 서버가 그 모듈로 바로 검색한다. 책의 도서관 이름은 목록의 표시 이름으로 바꿔
  // 이름이 같은 도서관의 결과가 섞이지 않게 한다.
  const updateBookList = useCallback(
    (title: string, library: Library, signal?: AbortSignal, fresh = false): Promise<Book[]> =>
      LibraryAPI.getLibrary({
        title,
        libraryName: library.libraryName ?? library.name,
        module: library.module,
        signal,
        fresh,
      })
        .then((list) => {
          const result = list?.[0];
          if (result?.error) {
            throw Object.assign(new Error(result.error.msg), {
              unreachable: result.error.code === UNREACHABLE_CODE,
            });
          }
          return (result?.booklist ?? []).map((book) => ({
            ...book,
            libraryName: library.name,
            checkedAt: result?.checkedAt,
          }));
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Search failed:", library.name, error);
          }
          throw error;
        }),
    [],
  );

  const cancelSearch = useCallback(() => {
    const run = searchRunRef.current;
    if (run) {
      trackSearchCancel({
        libraryCount: run.libraryCount,
        completedCount: run.completedCount,
        durationMs: Date.now() - run.startedAt,
      });
      searchRunRef.current = null;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (isSearchingAll) {
      setBooks(sortByTitle(getDoneBooks(librarySearchStates)));
    }

    setIsLoading(false);
    setIsSearchingAll(false);
    setLibrarySearchStates(new Map());
    setFailedLibrary(null);
  }, [isSearchingAll, librarySearchStates]);

  const performSearch = useCallback(
    (title: string, libName: string, libraries: Library[], { fresh = false } = {}) => {
      if (!title?.length) return;
      lastSearchRef.current = { title, libName, libraries };

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      const { signal } = controller;

      setBooks([]);
      setFailedLibrary(null);
      setIsLoading(true);

      const run: SearchRun = {
        startedAt: Date.now(),
        libraryCount: libName === DEFAULT_LIBRARY ? libraries.length : 1,
        completedCount: 0,
      };
      searchRunRef.current = run;
      const finishRun = (failedCount: number, books: Book[]) => {
        if (searchRunRef.current !== run) return;
        searchRunRef.current = null;
        trackSearchComplete({
          libraryCount: run.libraryCount,
          failedCount,
          resultCount: books.length,
          availableCount: countAvailable(books),
          durationMs: Date.now() - run.startedAt,
        });
      };

      if (libName === DEFAULT_LIBRARY) {
        setIsSearchingAll(true);

        const initialStates = new Map<string, LibrarySearchState>();
        libraries.forEach((library) => {
          initialStates.set(library.name, {
            libraryName: library.name,
            status: "pending",
            books: [],
          });
        });
        setLibrarySearchStates(initialStates);

        let completedCount = 0;
        let failedCount = 0;
        const foundBooks: Book[] = [];
        const totalCount = libraries.length;
        const queue = [...libraries];
        let activeCount = 0;

        const processNext = () => {
          while (activeCount < MAX_CONCURRENT_SEARCHES && queue.length > 0) {
            if (signal.aborted) return;

            const library = queue.shift()!;
            activeCount++;

            setLibrarySearchStates((prev) => {
              const next = new Map(prev);
              next.set(library.name, {
                libraryName: library.name,
                status: "searching",
                books: [],
              });
              return next;
            });

            updateBookList(title, library, signal, fresh)
              .then((bookList) => {
                if (signal.aborted) return;
                foundBooks.push(...bookList);

                setLibrarySearchStates((prev) => {
                  const next = new Map(prev);
                  next.set(library.name, {
                    libraryName: library.name,
                    status: "done",
                    books: bookList,
                  });
                  return next;
                });
              })
              .catch((error) => {
                if (signal.aborted) return;
                failedCount++;

                setLibrarySearchStates((prev) => {
                  const next = new Map(prev);
                  next.set(library.name, {
                    libraryName: library.name,
                    status: "error",
                    books: [],
                    unreachable: !!error?.unreachable,
                  });
                  return next;
                });
              })
              .finally(() => {
                activeCount--;
                completedCount++;
                run.completedCount = completedCount;
                if (completedCount === totalCount) {
                  finishRun(failedCount, foundBooks);
                  setIsLoading(false);
                } else {
                  processNext();
                }
              });
          }
        };

        processNext();
      } else {
        setIsSearchingAll(false);
        setLibrarySearchStates(new Map());

        // 목록에 없는 이름(예전 URL·내 도서관)은 모듈 없이 이름으로 검색한다
        const library = libraries.find((lib) => lib.name === libName) ?? { id: -1, name: libName };
        updateBookList(title, library, signal, fresh)
          .then((bookList) => {
            if (signal.aborted) return;
            run.completedCount = 1;
            finishRun(0, bookList);
            setBooks(sortByTitle(bookList));
            setIsLoading(false);
          })
          .catch((error) => {
            if (error.name !== "AbortError" && !signal.aborted) {
              run.completedCount = 1;
              finishRun(1, []);
              setFailedLibrary({ name: libName, unreachable: !!error.unreachable });
              setIsLoading(false);
            }
          });
      }
    },
    [updateBookList],
  );

  // 마지막 검색을 서버 캐시 없이 다시 한다
  const refreshSearch = useCallback(() => {
    const last = lastSearchRef.current;
    if (last) performSearch(last.title, last.libName, last.libraries, { fresh: true });
  }, [performSearch]);

  const clearResults = useCallback(() => {
    setBooks([]);
    setIsSearchingAll(false);
    setLibrarySearchStates(new Map());
    setFailedLibrary(null);
  }, []);

  return {
    isLoading,
    searchProgress,
    aggregatedBooks,
    failedLibraries,
    unreachableLibraries,
    performSearch,
    refreshSearch,
    cancelSearch,
    clearResults,
  };
};
