const { Forbidden } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const deleteQuery = async (options) => {
  try {
    const {
      model,
      id,
      user,
      config,
      locale,
      fallbackLocale,
    } = options;

    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = config && config.policies && config.policies.delete;
    const hasPermission = await executePolicy(user, policy);

    if (hasPermission) {
      const mongooseQuery = { _id: id };

      // /////////////////////////////////////
      // 2. Execute before collection hook
      // /////////////////////////////////////

      const beforeDeleteHook = config && config.hooks && config.hooks.beforeDelete;

      if (typeof beforeDeleteHook === 'function') {
        await beforeDeleteHook(options);
      }

      // /////////////////////////////////////
      // 3. Query database
      // /////////////////////////////////////

      let result = await model.findOneAndDelete(mongooseQuery);
      result = result.toJSON({ virtuals: true });

      if (locale && result.setLocale) {
        result.setLocale(locale, fallbackLocale);
      }

      // /////////////////////////////////////
      // 4. Execute after collection hook
      // /////////////////////////////////////

      const afterDeleteHook = config && config.hooks && config.hooks.afterDelete;

      if (typeof afterDeleteHook === 'function') {
        result = await afterDeleteHook(mongooseQuery, result);
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

module.exports = deleteQuery;
