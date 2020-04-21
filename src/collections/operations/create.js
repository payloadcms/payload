const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');
const { validateCreate } = require('../../fields/validateCreate');

const create = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.create);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Validate incoming data
    // /////////////////////////////////////

    await validateCreate(args.data, args.config.fields);

    // /////////////////////////////////////
    // 3. Execute before create field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(args.config.fields, args.data, 'beforeCreate');

    // /////////////////////////////////////
    // 4. Execute before collection hook
    // /////////////////////////////////////

    const { beforeCreate } = args.config.hooks;

    if (typeof beforeCreate === 'function') {
      options = await beforeCreate(options);
    }

    // /////////////////////////////////////
    // 5. Perform database operation
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
    // 6. Execute after collection hook
    // /////////////////////////////////////

    const { afterCreate } = args.config.hooks;

    if (typeof afterCreate === 'function') {
      result = await afterCreate(options, result);
    }

    // /////////////////////////////////////
    // 7. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = create;
