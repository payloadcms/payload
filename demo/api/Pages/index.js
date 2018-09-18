const app = require('../../server');
const mongoose = require('mongoose');
const Page = mongoose.model('Page');

// TODO: Authentication
app.get('/pages', (req, res) => {
  // TODO: Filter, Sort
  Page.find((err, pages, next) => {
    if (err) { return next(err); }
    return res.json(pages);
  });
});

// TODO: Authentication
app.post('/pages', (req, res) => {
  const newPage = new Page(req.body);

  // TODO: Permissions
  // TODO: Validate
  newPage.save((err, page, next) => {
    if (err) { return next(err); }
    return res.json(page);
  });
});

// TODO: DELETE route
