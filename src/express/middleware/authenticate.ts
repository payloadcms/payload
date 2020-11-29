import passport from 'passport';
import { Payload } from '../../index';

export default (config: Payload) => {
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
