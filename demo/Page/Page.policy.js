import Page from './Page.model';

const pagePolicy = {

  query(req, res, next) {
    next();
  },

  create(req, res, next) {
    // TODO: how to get current authenticated user?
    next();
  },

  find(req, res, next) {
    next();
  },

  update(req, res, next) {
    next();
  },

  destroy(req, res, next) {
    next();
  },
};

export default pagePolicy;
