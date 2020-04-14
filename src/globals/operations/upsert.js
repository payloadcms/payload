const executePolicy = require('../../auth/executePolicy');

const upsert = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = args.config && args.config.policies && args.config.policies.upsert;
    await executePolicy(args.user, policy);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before global hook
    // /////////////////////////////////////

    const beforeUpsertHook = args.config && args.config.hooks && args.config.hooks.beforeUpsert;

    if (typeof beforeUpsertHook === 'function') {
      options = await beforeUpsertHook(options);
    }

    // /////////////////////////////////////
    // 3. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      locale,
      slug,
      fallbackLocale,
      data,
    } = options;


    let result = await Model.findOne({ globalType: slug });

    if (!result) {
      result = new Model();
    }

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    Object.assign(result, { ...data, globalType: slug });

    result.save();

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 4. Execute after global hook
    // /////////////////////////////////////

    const afterUpsertHook = args.config && args.config.hooks && args.config.hooks.afterUpsert;

    if (typeof afterUpsertHook === 'function') {
      result = await afterUpsertHook(options, result);
    }

    // /////////////////////////////////////
    // 5. Return results
    // /////////////////////////////////////

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = upsert;
