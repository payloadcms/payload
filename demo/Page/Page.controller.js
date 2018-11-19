const Page = require('./Page.model');

const pageController = {
  get: (req, res) => {
    Page.apiQuery(req.query, (err, pages) => {
      return res.json(pages);
    });
  },

  findById: (req, res) => {
    Page.findById(req.params.id, (err, pages) => {
      if (err) {
        return res.send(404);
      }
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
