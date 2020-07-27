const passport = require('passport');
const AnonymousStrategy = require('passport-anonymous');
const jwtStrategy = require('./strategies/jwt');

function initAuth() {
  passport.use(new AnonymousStrategy.Strategy());
  passport.use('jwt', jwtStrategy(this));
}

module.exports = initAuth;
