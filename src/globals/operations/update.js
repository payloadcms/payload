const executePolicy = require('../../auth/executePolicy');
const performFieldOperations = require('../../fields/performFieldOperations');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.update);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before global hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 3. Execute field-level hooks, policies, and validation
    // /////////////////////////////////////

    options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

    // /////////////////////////////////////
    // 4. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      slug,
      data,
      req: {
        locale,
        fallbackLocale,
      },
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
    // 5. Execute field-level hooks and policies
    // /////////////////////////////////////

    result = performFieldOperations(args.config, {
      ...options, data: result, hook: 'afterRead', operationName: 'read',
    });

    // /////////////////////////////////////
    // 6. Execute after global hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      result = await afterUpdate(options, result);
    }

    // /////////////////////////////////////
    // 7. Return results
    // /////////////////////////////////////

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = update;
