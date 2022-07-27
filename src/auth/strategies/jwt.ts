import passportJwt, { StrategyOptions } from 'passport-jwt';
import { Strategy as PassportStrategy } from 'passport-strategy';
import { Payload } from '../..';
import findByID from '../../collections/operations/findByID';
import getExtractJWT from '../getExtractJWT';

const JwtStrategy = passportJwt.Strategy;

export default ({ secret, config, collections }: Payload): PassportStrategy => {
  const opts: StrategyOptions = {
    passReqToCallback: true,
    jwtFromRequest: getExtractJWT(config),
    secretOrKey: secret,
  };

  return new JwtStrategy(opts, async (req, token, done) => {
    if (req.user) {
      done(null, req.user);
    }

    try {
      const collection = collections[token.collection];

      const isGraphQL = (req.url || '').replace(/\/$/, '') === config.routes.graphQL.replace(/\/$/, '');

      const user = await findByID({
        id: token.id,
        collection,
        req,
        overrideAccess: true,
        depth: isGraphQL ? 0 : collection.config.auth.depth,
      });

      if (user && (!collection.config.auth.verify || user._verified)) {
        user.collection = collection.config.slug;
        user._strategy = 'local-jwt';
        done(null, user);
      } else {
        done(null, false);
      }
    } catch (err) {
      done(null, false);
    }
  });
};
