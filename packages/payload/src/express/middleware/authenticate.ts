import type { NextFunction, Request, Response } from 'express'

import passport from 'passport'

import type { SanitizedConfig } from '../../config/types'

export type PayloadAuthenticate = (req: Request, res: Response, next: NextFunction) => NextFunction

export default (config: SanitizedConfig): PayloadAuthenticate => {
  const defaultMethods = ['jwt', 'anonymous']

  const methods = config.collections.reduce((enabledMethods, collection) => {
    if (typeof collection.auth === 'object') {
      const collectionMethods = [...enabledMethods]

      if (Array.isArray(collection.auth.strategies)) {
        collection.auth.strategies.forEach(({ name, strategy }) => {
          collectionMethods.unshift(`${collection.slug}-${name ?? strategy.name}`)
        })
      }

      if (collection.auth.useAPIKey) {
        collectionMethods.unshift(`${collection.slug}-api-key`)
      }

      return collectionMethods
    }

    return enabledMethods
  }, defaultMethods)

  const authenticate = passport.authenticate(methods, { session: false })
  return authenticate
}
