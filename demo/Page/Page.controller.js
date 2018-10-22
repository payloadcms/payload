const Page = require('./Page.model');

const pageController = {
  get: (req, res, next) => {
    page.find((err, pages, next) => {
      if (err) {
        return next(err);
      }
      return res.json(pages);
    });
  },

  post: (req, res, next) => {

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
