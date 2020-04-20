const passportJwt = require('passport-jwt');

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

module.exports = ({ Model, config }) => {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
  opts.secretOrKey = config.auth.secretKey;

  return new JwtStrategy(opts, async (token, done) => {
    try {
      const user = await Model.findByUsername(token.email);
      return done(null, user);
    } catch (err) {
      return done(null, false);
    }
  });
};
