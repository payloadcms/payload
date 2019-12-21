import passport from 'passport';

const initPassport = (app) => {
  app.use(passport.initialize());
  app.use(passport.session());
}

export default initPassport;
