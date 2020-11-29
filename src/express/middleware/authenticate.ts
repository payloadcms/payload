import passport from 'passport';
import { Request, Response, NextFunction } from 'express';
import { Config } from '../../config/types';

export type PayloadAuthenticate = (req: Request, res: Response, next: NextFunction) => NextFunction;

export default (config: Config): PayloadAuthenticate => {
  const methods = config.collections.reduce((enabledMethods, collection) => {
    if (typeof collection.auth === 'object' && collection.auth.useAPIKey) {
      const collectionMethods = [...enabledMethods];
      collectionMethods.unshift(`${collection.slug}-api-key`);
      return collectionMethods;
    }

    return enabledMethods;
  }, ['jwt', 'anonymous']);

  const authenticate = passport.authenticate(methods, { session: false });
  return authenticate;
};
