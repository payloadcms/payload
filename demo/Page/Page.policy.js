const Page = require('./Page.model');

const pagePolicy = {

  all: (req, res, next) => {
    // TODO: change to actual check of some super user role
    let admin = 1;
    if (admin === 1) {
      next();
    } else {
      res.send(401, 'You are not authorized to view this resource');
    }
  },

  get: (req, res, next) => {
    // res.send(401);
    next();
  },

  post: (req, res, next) => {
    next();
  },

  getById: (req, res, next) => {
    next();
  },
};

module.exports = pagePolicy;
