import routes from './routes/index.route';
import passport from 'passport';
import User from './models/user.model';

// class Payload {
export function init(app, mongoose, options) {
  // baseURL = options.baseURL;

  // configure passport for Auth
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  app.use(routes);
}
