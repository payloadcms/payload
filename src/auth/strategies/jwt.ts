import passportJwt, { StrategyOptions } from 'passport-jwt';
import { Strategy as PassportStrategy } from 'passport-strategy';
import { Payload } from '../..';
import find from '../../collections/operations/find';
import getExtractJWT from '../getExtractJWT';

const JwtStrategy = passportJwt.Strategy;

export default ({ secret, config, collections }: Payload): PassportStrategy => {
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

      const isGraphQL = (req.url || '').replace(/\/$/, '') === config.routes.graphQL.replace(/\/$/, '');

      const userQuery = await find({
        where,
        collection,
        req,
        overrideAccess: true,
        depth: isGraphQL ? 0 : collection.config.auth.depth,
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
