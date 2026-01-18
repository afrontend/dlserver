const express = require("express");
const app = express();
const dl = require("dongnelibrary");

app.use("/", express.static(__dirname + "/public"));

// Promisified wrapper for dl.search
const searchBooks = (title, libraryName) => {
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
const extractSearchParams = (params) => ({
  title: params.title || "",
  libraryName: params.libraryName || "",
});

const makeBookDescription = (book) => {
  const mark = book.exist ? "✓ " : "✖ ";
  return " " + mark + " " + book.title + "<br>";
};

app.get("/:title/:libraryName", async (req, res) => {
  const { title, libraryName } = extractSearchParams(req.params);

  try {
    const books = await searchBooks(title, libraryName);
    res.send(
      books[0].booklist.reduce((memo, book) => {
        return memo + makeBookDescription(book);
      }, ""),
    );
  } catch (err) {
    res.json({ message: err.msg });
  }
});

app.get("/search", async (req, res) => {
  const { title, libraryName } = extractSearchParams(req.query);

  if (title === "" && libraryName === "") {
    const libs = dl.getLibraryNames();
    res.send(libs.join("<br>"));
  } else {
    try {
      const books = await searchBooks(title, libraryName);
      res.json(books);
    } catch (err) {
      res.json({ message: err.msg });
    }
  }
});

app.get("/libraryList", (req, res) => {
  const libs = dl.getLibraryNames();
  res.json(libs);
});

app.use((req, res, next) => {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.json({ message: "Server Error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`dlserver listening on port ${port}!`);
});
