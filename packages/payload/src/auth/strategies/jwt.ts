import url from 'url';
import passportJwt, { StrategyOptions } from 'passport-jwt';
import { Strategy as PassportStrategy } from 'passport-strategy';
import { Payload } from '../../payload';
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

      const parsedURL = url.parse(req.url);
      const isGraphQL = parsedURL.pathname === config.routes.graphQL;

      const user = await req.payload.findByID({
        id: token.id,
        collection: token.collection,
        req,
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
