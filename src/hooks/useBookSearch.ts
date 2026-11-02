import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { LibraryAPI } from "../api/library";
import { sortByTitle } from "../utils/sorting";
import type { Book, Library, LibrarySearchState, SearchProgress } from "../types";
import { DEFAULT_LIBRARY } from "../constants";
import { trackSearchCancel, trackSearchComplete } from "../analytics";

const MAX_CONCURRENT_SEARCHES = 3;

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

  const [failedLibrary, setFailedLibrary] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const searchRunRef = useRef<SearchRun | null>(null);

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

  const failedLibraries: string[] = useMemo(() => {
    if (!isSearchingAll) return failedLibrary ? [failedLibrary] : [];
    return Array.from(librarySearchStates.values())
      .filter((s) => s.status === "error")
      .map((s) => s.libraryName);
  }, [librarySearchStates, isSearchingAll, failedLibrary]);

  const aggregatedBooks: Book[] = useMemo(() => {
    if (!isSearchingAll) return books;
    return sortByTitle(getDoneBooks(librarySearchStates));
  }, [librarySearchStates, isSearchingAll, books]);

  const updateBookList = useCallback(
    (title: string, libName: string, signal?: AbortSignal): Promise<Book[]> =>
      LibraryAPI.getLibrary({ title, libraryName: libName, signal })
        .then((list) => {
          const result = list?.[0];
          if (result?.error) throw new Error(result.error.msg);
          return result?.booklist ?? [];
        })
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Search failed:", libName, error);
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
    (title: string, libName: string, libraries: Library[]) => {
      if (!title?.length) return;

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

            updateBookList(title, library.name, signal)
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
              .catch(() => {
                if (signal.aborted) return;
                failedCount++;

                setLibrarySearchStates((prev) => {
                  const next = new Map(prev);
                  next.set(library.name, {
                    libraryName: library.name,
                    status: "error",
                    books: [],
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

        updateBookList(title, libName, signal)
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
              setFailedLibrary(libName);
              setIsLoading(false);
            }
          });
      }
    },
    [updateBookList],
  );

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
    performSearch,
    cancelSearch,
    clearResults,
  };
};
