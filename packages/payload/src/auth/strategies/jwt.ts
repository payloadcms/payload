import type { StrategyOptions } from 'passport-jwt'
import type { Strategy as PassportStrategy } from 'passport-strategy'

import passportJwt from 'passport-jwt'
import url from 'url'

import type { Payload } from '../../payload'

import getExtractJWT from '../getExtractJWT'

const JwtStrategy = passportJwt.Strategy

export default ({ collections, config, secret }: Payload): PassportStrategy => {
  const opts: StrategyOptions = {
    jwtFromRequest: getExtractJWT(config),
    passReqToCallback: true,
    secretOrKey: secret,
  }

  return new JwtStrategy(opts, async (req, token, done) => {
    if (req.user) {
      done(null, req.user)
    }

    try {
      const collection = collections[token.collection]

      const parsedURL = url.parse(req.originalUrl)
      const isGraphQL = parsedURL.pathname === `/api${req.payload.config.routes.graphQL}`

      const user = await req.payload.findByID({
        id: token.id,
        collection: token.collection,
        depth: isGraphQL ? 0 : collection.config.auth.depth,
        req,
      })

      if (user && (!collection.config.auth.verify || user._verified)) {
        user.collection = collection.config.slug
        user._strategy = 'local-jwt'
        done(null, user)
      } else {
        done(null, false)
      }
    } catch (err) {
      done(null, false)
    }
  })
}
