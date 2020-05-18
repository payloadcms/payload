const passport = require('passport');

module.exports = (config) => {
  const methods = config.collections.reduce((enabledMethods, collection) => {
    if (collection.auth) {
      return [
        `${collection.slug}-api-key`,
        `${collection.slug}-jwt`,
        ...enabledMethods,
      ];
    }

    return enabledMethods;
  }, ['anonymous']);

  return passport.authenticate(methods, { session: false });
};
