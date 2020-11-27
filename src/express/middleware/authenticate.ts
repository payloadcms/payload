import passport from 'passport';
import { PayloadConfig } from '../../config/types';

export default (config: PayloadConfig) => {
  const methods = config.collections.reduce((enabledMethods, collection) => {
    if (collection.auth && collection.auth.useAPIKey) {
      const collectionMethods = [...enabledMethods];
      collectionMethods.unshift(`${collection.slug}-api-key`);
      return collectionMethods;
    }

    return enabledMethods;
  }, ['jwt', 'anonymous']);

  return passport.authenticate(methods, { session: false });
};
