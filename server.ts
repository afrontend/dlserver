import express, { Request, Response, NextFunction } from "express";
import * as dl from "dongnelibrary";
import type { LibraryResult, Book } from "dongnelibrary";

const app = express();

app.use("/", express.static(__dirname + "/dist"));

interface SearchParams {
  title: string;
  libraryName: string;
}

// Promisified wrapper for dl.search
const searchBooks = (
  title: string,
  libraryName: string,
): Promise<LibraryResult[]> => {
  return new Promise((resolve, reject) => {
    dl.search({ title, libraryName }, null, (err, books) => {
      if (err) {
        reject(err);
      } else {
        resolve(books);
      }
    });
  });
};

// Extract search params from request params or query
const extractSearchParams = (
  params: Record<string, unknown>,
): SearchParams => ({
  title: (params.title as string) || "",
  libraryName: (params.libraryName as string) || "",
});

const makeBookDescription = (book: Book): string => {
  const mark = book.exist ? "✓ " : "✖ ";
  return " " + mark + " " + book.title + "<br>";
};

app.get("/:title/:libraryName", async (req: Request, res: Response) => {
  const { title, libraryName } = extractSearchParams(req.params);

  try {
    const books = await searchBooks(title, libraryName);
    res.send(
      books[0].booklist.reduce((memo: string, book: Book) => {
        return memo + makeBookDescription(book);
      }, ""),
    );
  } catch (err) {
    const error = err as { msg?: string };
    res.json({ message: error.msg });
  }
});

app.get("/search", async (req: Request, res: Response) => {
  const { title, libraryName } = extractSearchParams(req.query);

  if (title === "" && libraryName === "") {
    const libs = dl.getLibraryNames();
    res.send(libs.join("<br>"));
  } else {
    try {
      const books = await searchBooks(title, libraryName);
      res.json(books);
    } catch (err) {
      const error = err as { msg?: string };
      res.json({ message: error.msg });
    }
  }
});

app.get("/libraryList", (_req: Request, res: Response) => {
  const libs = dl.getLibraryNames();
  res.json(libs);
});

interface HttpError extends Error {
  status?: number;
}

app.use((_req: Request, _res: Response, next: NextFunction) => {
  const err: HttpError = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  res.status(err.status || 500);
  res.json({ message: "Server Error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`dlserver listening on port ${port}!`);
});
