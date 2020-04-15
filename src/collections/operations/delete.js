const { NotFound } = require('../../errors');
const executePolicy = require('../../users/executePolicy');

const deleteQuery = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = args.config && args.config.policies && args.config.policies.delete;

    await executePolicy(args.user, policy);

    let options = {
      query: { _id: args.id },
      Model: args.Model,
      config: args.config,
      locale: args.locale,
      fallbackLocale: args.fallbackLocale,
      user: args.user,
      api: args.api,
    };

    // /////////////////////////////////////
    // 2. Execute before collection hook
    // /////////////////////////////////////

    const beforeDeleteHook = args.config && args.config.hooks && args.config.hooks.beforeDelete;

    if (typeof beforeDeleteHook === 'function') {
      options = await beforeDeleteHook(options);
    }

    // /////////////////////////////////////
    // 3. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      query,
      locale,
      fallbackLocale,
    } = options;

    let result = await Model.findOneAndDelete(query);

    if (!result) throw new NotFound();

    result = result.toJSON({ virtuals: true });

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

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
  } catch (err) {
    throw err;
  }
};

module.exports = deleteQuery;
