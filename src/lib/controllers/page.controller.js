const page = require('../../models/page.model');

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

    const newPage = new page(req.body);

    newPage.save((err, page, next) => {
      if (err) {
        return next(err);
      }
      return res.json(page);
    });
  },

};

module.exports = pageController;
