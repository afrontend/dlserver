import type { Book, Library } from "../types";

// Utility function for alphabetical sorting by title
export const sortByTitle = (items: Book[]): Book[] =>
  [...items].sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

// Utility function for alphabetical sorting by name
export const sortByName = (items: Library[]): Library[] =>
  [...items].sort((a, b) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
