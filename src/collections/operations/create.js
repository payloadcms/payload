const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');

const create = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args.user, args.config.policies.create);

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
    // 2. Execute before create field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(args.config.fields, args.data, 'beforeCreate');

    // /////////////////////////////////////
    // 3. Execute before collection hook
    // /////////////////////////////////////

    const { beforeCreate } = args.config.hooks;

    if (typeof beforeCreate === 'function') {
      options = await beforeCreate(options);
    }

    // /////////////////////////////////////
    // 4. Perform database operation
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
    // 5. Execute after collection hook
    // /////////////////////////////////////

    const { afterCreate } = args.config.hooks.afterCreate;

    if (typeof afterCreate === 'function') {
      result = await afterCreate(options, result);
    }

    // /////////////////////////////////////
    // 6. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = create;
