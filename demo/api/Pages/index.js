const app = require('../../server');
const mongoose = require('mongoose');
const Page = mongoose.model('Page');

app.get('/pages', (req, res) => {
  Page.find((err, pages, next) => {
    if (err) { return next(err); }
    return res.json(pages);
  });
});

app.post('/pages', (req, res) => {
  const newPage = new Page(req.body);
  newPage.save((err, page, next) => {
    if (err) { return next(err); }
    return res.json(page);
  });
});
