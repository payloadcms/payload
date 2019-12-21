import passport from 'passport';

const registerConfigRoute = ({ router, app, config }) => {
  router.use('/config',
    passport.authenticate('jwt', { session: false }),
    (req, res) => {
      res.json(config);
    });
};

export default registerConfigRoute;
