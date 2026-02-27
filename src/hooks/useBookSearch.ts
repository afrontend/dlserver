import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { LibraryAPI } from "../api/library";
import { sortByTitle } from "../utils/sorting";
import type { Book, Library, LibrarySearchState, SearchProgress } from "../types";

export const useBookSearch = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchingAll, setIsSearchingAll] = useState(false);
  const [librarySearchStates, setLibrarySearchStates] = useState<Map<string, LibrarySearchState>>(
    new Map(),
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  // Abort search on page unload
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

  const aggregatedBooks: Book[] = useMemo(() => {
    if (!isSearchingAll) return books;

    const allBooks = Array.from(librarySearchStates.values())
      .filter((s) => s.status === "done")
      .flatMap((s) => s.books);

    return sortByTitle(allBooks);
  }, [librarySearchStates, isSearchingAll, books]);

  const updateBookList = useCallback(
    (title: string, libName: string, signal?: AbortSignal): Promise<Book[]> =>
      LibraryAPI.getLibrary({ title, libraryName: libName, signal })
        .then((list) => list?.[0]?.booklist ?? [])
        .catch((error) => {
          if (error.name !== "AbortError") {
            console.error("Search failed:", error);
          }
          return [];
        }),
    [],
  );

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (isSearchingAll) {
      const foundBooks = Array.from(librarySearchStates.values())
        .filter((s) => s.status === "done")
        .flatMap((s) => s.books);
      setBooks(sortByTitle(foundBooks));
    }

    setIsLoading(false);
    setIsSearchingAll(false);
    setLibrarySearchStates(new Map());
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
      setIsLoading(true);

      if (libName === "도서관을 선택하세요.") {
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
        const totalCount = libraries.length;

        libraries.forEach((library) => {
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

              setLibrarySearchStates((prev) => {
                const next = new Map(prev);
                next.set(library.name, {
                  libraryName: library.name,
                  status: "done",
                  books: bookList,
                });
                return next;
              });

              completedCount++;
              if (completedCount === totalCount) {
                setIsLoading(false);
              }
            })
            .catch(() => {
              if (signal.aborted) return;

              setLibrarySearchStates((prev) => {
                const next = new Map(prev);
                next.set(library.name, {
                  libraryName: library.name,
                  status: "error",
                  books: [],
                });
                return next;
              });

              completedCount++;
              if (completedCount === totalCount) {
                setIsLoading(false);
              }
            });
        });
      } else {
        setIsSearchingAll(false);
        setLibrarySearchStates(new Map());

        updateBookList(title, libName, signal)
          .then((bookList) => {
            if (signal.aborted) return;
            setBooks(sortByTitle(bookList));
            setIsLoading(false);
          })
          .catch((error) => {
            if (error.name !== "AbortError") {
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
  }, []);

  return {
    isLoading,
    searchProgress,
    aggregatedBooks,
    performSearch,
    cancelSearch,
    clearResults,
  };
};
