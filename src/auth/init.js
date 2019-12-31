import passport from 'passport';
import AnonymousStrategy from 'passport-anonymous';
import jwtStrategy from './jwt';
import initRoutes from '../routes/init';
import authRoutes from './routes';

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

export default initUsers;
