import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { SanitizedConfig } from '../../config/types';

export type PayloadAuthenticate = (req: Request, res: Response, next: NextFunction) => NextFunction;

export default (config: SanitizedConfig): PayloadAuthenticate => {
  const defaultMethods = ['anonymous'];

  const methods = config.collections.reduce((enabledMethods, collection) => {
    if (typeof collection.auth === 'object') {
      const collectionMethods = [...enabledMethods];

      if (Array.isArray(collection.auth.strategies)) {
        collection.auth.strategies.forEach(({ name }) => {
          collectionMethods.push(name);
        });
      }

      if (collection.auth.useAPIKey) {
        collectionMethods.push(`${collection.slug}-api-key`);
      }

      if (!collection.auth.disableLocalStrategy) {
        defaultMethods.push('jwt');
      }

      return collectionMethods;
    }

    return enabledMethods;
  }, defaultMethods);

  const authenticate = passport.authenticate(methods, { session: false });
  return authenticate;
};
