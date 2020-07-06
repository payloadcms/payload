const passportJwt = require('passport-jwt');
const getExtractJWT = require('../getExtractJWT');

const JwtStrategy = passportJwt.Strategy;

module.exports = (config, collections) => {
  const opts = {
    session: false,
  };

  const extractJWT = getExtractJWT(config);

  opts.jwtFromRequest = extractJWT;
  opts.secretOrKey = config.secret;

  return new JwtStrategy(opts, async (token, done) => {
    try {
      const collection = collections[token.collection];

      const user = await collection.Model.findByUsername(token.email);

      const json = user.toJSON({ virtuals: true });
      json.collection = collection.config.slug;

      done(null, json);
    } catch (err) {
      done(null, false);
    }
  });
};
