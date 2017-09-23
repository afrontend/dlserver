const express = require('express');
const app = express();
const dl = require('dongnelibrary');


function makeBookDescription(book) {
  var mark = book.exist ? '✓ ' : '✖ ';
  return " "+mark+" " + book.title + "<br>";
}

app.get('/:title/:libraryName', function (req, res, next) {
  var title = '';
  var libraryName = '';

  if (req.params.title) {
    title = req.params.title
  }

  if (req.params.libraryName) {
    libraryName = req.params.libraryName
  }

  dl.search({
    title: title,
    libraryName: libraryName
  }, null, function (err, books) {
    if(err) {
      res.json({
        message: err.msg
      });
    } else {
      res.send(books[0].booklist.reduce(function (memo, book) {
        return memo + makeBookDescription(book);
      }, ''));
    }
  });
})

app.get('/', function (req, res, next) {
  var title = '';
  var libraryName = '';

  if (req.query.title) {
    title = req.query.title
  }

  if (req.query.libraryName) {
    libraryName = req.query.libraryName
  }

  if (title === '' && libraryName === '') {
    var libs = dl.getLibraryNames();
    res.send(libs.join("<br>"));
  } else {
    dl.search({
      title: title,
      libraryName: libraryName
    }, null, function (err, books) {
      if(err) {
        res.json({
          message: err.msg
        });
      } else {
        res.json(books);
      }
    });
  }
})

app.get('/libraryList', function (req, res, next) {
  var libs = dl.getLibraryNames();
  res.json(libs);
})

app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.json({
    message: 'Server Error'
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log('dlserver listening on port 3000!')
})
