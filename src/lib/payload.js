import routes from './routes/index.route';
import passport from 'passport';
import User from './models/user.model';

export function init(app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use(routes);
}
