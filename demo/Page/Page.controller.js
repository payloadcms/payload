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

  put: (req, res) => {
    // TODO: discuss if we want the update to work like this where the ID is sent in params.id or something else?
    req.body.id = req.params.id;
    Page.findOneAndUpdate(req.params.id, req.body, (err, doc) => {
      if (err) {
        return res.send(500, {error: err});
      }
      return res.json(doc);
    });
  },

  delete: (req, res) => {
    Page.findOneAndRemove(req.params.id, (err) => {
      if (err) {
        return res.send(500, {error: err});
      }
      return res.send();
    });
  },
};

module.exports = pageController;
