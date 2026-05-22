import express, { Request, Response, NextFunction } from "express";
import * as dl from "dongnelibrary";
import type { SearchResult, Book } from "dongnelibrary";
import * as ansan from "dongnelibrary/dist/localLibraryModule/ansan";
import * as asan from "dongnelibrary/dist/localLibraryModule/asan";
import * as bcl from "dongnelibrary/dist/localLibraryModule/bcl";
import * as cbelib from "dongnelibrary/dist/localLibraryModule/cbelib";
import * as daegu from "dongnelibrary/dist/localLibraryModule/daegu";
import * as gangnam from "dongnelibrary/dist/localLibraryModule/gangnam";
import * as gangseo from "dongnelibrary/dist/localLibraryModule/gangseo";
import * as gbelib from "dongnelibrary/dist/localLibraryModule/gbelib";
import * as geoje from "dongnelibrary/dist/localLibraryModule/geoje";
import * as gg from "dongnelibrary/dist/localLibraryModule/gg";
import * as gimhae from "dongnelibrary/dist/localLibraryModule/gimhae";
import * as gjcity from "dongnelibrary/dist/localLibraryModule/gjcity";
import * as gunpo from "dongnelibrary/dist/localLibraryModule/gunpo";
import * as gunsan from "dongnelibrary/dist/localLibraryModule/gunsan";
import * as gwanak from "dongnelibrary/dist/localLibraryModule/gwanak";
import * as gwe from "dongnelibrary/dist/localLibraryModule/gwe";
import * as hanamlib from "dongnelibrary/dist/localLibraryModule/hanamlib";
import * as hscity from "dongnelibrary/dist/localLibraryModule/hscity";
import * as ice from "dongnelibrary/dist/localLibraryModule/ice";
import * as jeju from "dongnelibrary/dist/localLibraryModule/jeju";
import * as nowon from "dongnelibrary/dist/localLibraryModule/nowon";
import * as osan from "dongnelibrary/dist/localLibraryModule/osan";
import * as pohang from "dongnelibrary/dist/localLibraryModule/pohang";
import * as ptlib from "dongnelibrary/dist/localLibraryModule/ptlib";
import * as siheung from "dongnelibrary/dist/localLibraryModule/siheung";
import * as snlib from "dongnelibrary/dist/localLibraryModule/snlib";
import * as suwon from "dongnelibrary/dist/localLibraryModule/suwon";
import * as uwlib from "dongnelibrary/dist/localLibraryModule/uwlib";
import * as wonju from "dongnelibrary/dist/localLibraryModule/wonju";
import * as yangcheon from "dongnelibrary/dist/localLibraryModule/yangcheon";
import * as ydplib from "dongnelibrary/dist/localLibraryModule/ydplib";
import * as yjlib from "dongnelibrary/dist/localLibraryModule/yjlib";
import * as yongin from "dongnelibrary/dist/localLibraryModule/yongin";
import * as yplib from "dongnelibrary/dist/localLibraryModule/yplib";
import * as yslib from "dongnelibrary/dist/localLibraryModule/yslib";

const LIBRARY_MODULES = [ansan, asan, bcl, cbelib, daegu, gangnam, gangseo, gbelib, geoje, gg, gimhae, gjcity, gunpo, gunsan, gwanak, gwe, hanamlib, hscity, ice, jeju, nowon, osan, pohang, ptlib, siheung, snlib, suwon, uwlib, wonju, yangcheon, ydplib, yjlib, yongin, yplib, yslib];

const app = express();

app.use("/", express.static(import.meta.dirname + "/dist"));

interface SearchParams {
  title: string;
  libraryName: string;
}

const searchBooks = (
  title: string,
  libraryName: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> => {
  return new Promise((resolve, reject) => {
    dl.search({ title, libraryName, signal }, undefined, (err, books) => {
      if (err) {
        console.error(err);
        reject(err);
      } else {
        resolve(books ?? []);
      }
    });
  });
};

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

app.get("/search", async (req: Request, res: Response) => {
  const controller = new AbortController();

  req.on("close", () => {
    controller.abort();
  });

  const { title, libraryName } = extractSearchParams(req.query);

  try {
    const books = await searchBooks(title, libraryName, controller.signal);

    if (res.writableEnded) return;
    res.json(books);
  } catch (err) {
    if (res.writableEnded) return;

    const error = err as { msg?: string };
    res.json({ message: error.msg });
  }
});

app.get("/libraryList", (_req: Request, res: Response) => {
  const libs = dl.getAllLibraryNames();
  res.json(libs);
});

app.get("/moduleList", (_req: Request, res: Response) => {
  const modules = LIBRARY_MODULES.map((mod) => ({
    name: mod.moduleName,
    libraries: mod.getLibraryNames(),
  }));
  res.json(modules);
});

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

export { app };

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`dlserver listening on port ${port}!`);
  });
}
