import { useState, useMemo } from "react";
import type { Book } from "../types";

export const useBookFilters = (aggregatedBooks: Book[]) => {
  const [hideRented, setHideRented] = useState(false);
  const [selectedLibraryTags, setSelectedLibraryTags] = useState<Set<string>>(new Set());

  const displayedBooks: Book[] = useMemo(() => {
    let filtered = aggregatedBooks;

    if (selectedLibraryTags.size > 0) {
      filtered = filtered.filter(
        (book) => book.libraryName && selectedLibraryTags.has(book.libraryName),
      );
    }

    if (hideRented) {
      filtered = filtered.filter((book) => book.exist === true);
    }

    return filtered;
  }, [aggregatedBooks, selectedLibraryTags, hideRented]);

  const resetFilters = () => {
    setSelectedLibraryTags(new Set());
  };

  return {
    displayedBooks,
    hideRented,
    setHideRented,
    selectedLibraryTags,
    setSelectedLibraryTags,
    resetFilters,
  };
};
