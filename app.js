const express = require('express');
const app = express();
const dl = require('dongnelibrary');

app.get('/search', function (req, res, next) {
  var title = '';
  var libraryName = '';

  if (req.query.title) {
    title = req.query.title
  }

  if (req.query.libraryName) {
    libraryName = req.query.libraryName
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
      res.json(books);
    }
  });
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

app.listen(3000, function () {
  console.log('dlserver listening on port 3000!')
})
