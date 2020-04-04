const passportJwt = require('passport-jwt');

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

module.exports = (User, config) => {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
  opts.secretOrKey = config.user.auth.secretKey;

  return new JwtStrategy(opts, (token, done) => {
    User.findByUsername(token.email, (err, user) => {
      if (err || !user) done(null, false);
      return done(null, user);
    });
  });
};
