const passport = require('passport');

const initPassport = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
};

module.exports = initPassport;
