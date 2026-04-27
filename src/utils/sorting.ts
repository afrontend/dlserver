import type { Book } from "../types";

export const sortByTitle = (items: Book[]): Book[] =>
  [...items].sort((a, b) => {
    const nameA = a.title.toUpperCase();
    const nameB = b.title.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });

export const sortByName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => {
    const nameA = a.name.toUpperCase();
    const nameB = b.name.toUpperCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return 0;
  });
