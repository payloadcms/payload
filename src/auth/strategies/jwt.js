const passportJwt = require('passport-jwt');

const JwtStrategy = passportJwt.Strategy;
const { ExtractJwt } = passportJwt;

module.exports = (config, collections) => {
  const opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('JWT');
  opts.secretOrKey = config.secret;

  return new JwtStrategy(opts, async (token, done) => {
    try {
      const collection = collections[token.collection];

      const user = await collection.Model.findByUsername(token.email);

      const json = user.toJSON({ virtuals: true });
      json.collection = collection.config.slug;

      return done(null, json);
    } catch (err) {
      return done(null, false);
    }
  });
};
