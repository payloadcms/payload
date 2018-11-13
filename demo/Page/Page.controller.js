const Page = require('./Page.model');

const pageController = {
  get: (req, res) => {
    Page.apiQuery(req.query, (err, pages) => {
      return res.json(pages);
    });
  },

  post: (req, res) => {
    const newPage = new Page(req.body);
    newPage.save((err, page, next) => {
      if (err) {
        return next(err);
      }
      return res.json(page);
    });
  },
};

module.exports = pageController;
