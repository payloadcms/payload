const Page = require('./Page.model');

const pagePolicy = {

  query(req, res, next) {
    next();
  },

  post(req, res, next) {
    // TODO: how to get current authenticated user?
    next();
  },

  find(req, res, next) {
    next();
  },

  update(req, res, next) {
    next();
  },

  delete(req, res, next) {
    next();
  },
};

module.exports = pagePolicy;
