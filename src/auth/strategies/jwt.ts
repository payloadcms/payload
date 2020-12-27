import passportJwt, { StrategyOptions } from 'passport-jwt';
import { Strategy as PassportStrategy } from 'passport-strategy';
import getExtractJWT from '../getExtractJWT';

const JwtStrategy = passportJwt.Strategy;

export default ({ secret, config, collections, operations }): PassportStrategy => {
  const opts: StrategyOptions = {
    passReqToCallback: true,
    jwtFromRequest: getExtractJWT(config),
    secretOrKey: secret,
  };

  return new JwtStrategy(opts, async (req, token, done) => {
    try {
      const collection = collections[token.collection];

      const where: { [key: string]: any } = {};
      if (collection.config.auth.verify) {
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
        depth: collection.config.auth.depth,
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
