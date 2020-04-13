const { Forbidden } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const create = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = args.config && args.config.policies && args.config.policies.create;
    const hasPermission = await executePolicy(args.user, policy);

    if (hasPermission) {
      // Await validation here

      let options = {
        Model: args.Model,
        config: args.config,
        locale: args.locale,
        fallbackLocale: args.fallbackLocale,
        user: args.user,
        api: args.api,
        data: args.data,
      };

      // /////////////////////////////////////
      // 2. Execute before collection hook
      // /////////////////////////////////////

      const beforeCreateHook = args.config && args.config.hooks && args.config.hooks.beforeCreate;

      if (typeof beforeCreateHook === 'function') {
        options = await beforeCreateHook(options);
      }

      // /////////////////////////////////////
      // 3. Query database
      // /////////////////////////////////////

      const {
        Model,
        locale,
        fallbackLocale,
        data,
      } = options;

      let result = new Model();

      if (locale && result.setLocale) {
        result.setLocale(locale, fallbackLocale);
      }

      Object.assign(result, data);
      await result.save();

      result = result.toJSON({ virtuals: true });

      // /////////////////////////////////////
      // 4. Execute after collection hook
      // /////////////////////////////////////

      const afterDeleteHook = args.config && args.config.hooks && args.config.hooks.afterDelete;

      if (typeof afterDeleteHook === 'function') {
        result = await afterDeleteHook(options, result);
      }

      // /////////////////////////////////////
      // 5. Return results
      // /////////////////////////////////////

      return result;
    }

    throw new Forbidden();
  } catch (err) {
    throw err;
  }
};

module.exports = create;
