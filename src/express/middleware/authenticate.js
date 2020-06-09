const passport = require('passport');

module.exports = (config) => {
  const methods = config.collections.reduce((enabledMethods, collection) => {
    if (collection.auth) {
      const collectionMethods = [
        `${collection.slug}-jwt`,
        ...enabledMethods,
      ];

      if (collection.auth.enableAPIKey) {
        collectionMethods.unshift(`${collection.slug}-api-key`);
      }

      return collectionMethods;
    }

    return enabledMethods;
  }, ['anonymous']);

  return passport.authenticate(methods, { session: false });
};
