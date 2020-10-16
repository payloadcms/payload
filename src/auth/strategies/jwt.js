const passportJwt = require('passport-jwt');
const getExtractJWT = require('../getExtractJWT');

const JwtStrategy = passportJwt.Strategy;

module.exports = ({ config, collections, operations }) => {
  const opts = {
    session: false,
    passReqToCallback: true,
  };

  const extractJWT = getExtractJWT(config);

  opts.jwtFromRequest = extractJWT;
  opts.secretOrKey = config.secret;

  return new JwtStrategy(opts, async (req, token, done) => {
    try {
      const collection = collections[token.collection];

      const where = {};
      if (collection.config.auth.emailVerification) {
        where.and = [
          {
            email: {
              equals: token.email,
            },
          },
          {
            _verified: {
              not_equals: false,
            },
          },
        ];
      } else {
        where.email = {
          equals: token.email,
        };
      }
      const userQuery = await operations.collections.find({
        where,
        collection,
        req,
        overrideAccess: true,
      });

      if (userQuery.docs && userQuery.docs.length > 0) {
        const user = userQuery.docs[0];
        user.collection = collection.config.slug;

        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(null, false);
    }
  });
};
