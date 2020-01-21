const passport = require('passport');
const AnonymousStrategy = require('passport-anonymous');
const jwtStrategy = require('./jwt');
const initRoutes = require('../routes/init');
const authRoutes = require('./routes');

const initUsers = (User, config, router) => {
  passport.use(User.createStrategy());

  const { user: userConfig } = config;

  if (userConfig.auth.strategy === 'jwt') {
    passport.use(jwtStrategy(User));
    passport.serializeUser(User.serializeUser());
    passport.deserializeUser(User.deserializeUser());
  }
  passport.use(new AnonymousStrategy.Strategy());

  router.use('', initRoutes(User));
  router.use('', authRoutes(userConfig, User));
};

module.exports = initUsers;
