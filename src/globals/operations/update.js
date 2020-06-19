const deepmerge = require('deepmerge');
const combineMerge = require('../../utilities/combineMerge');
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
    // 2. Retrieve document
    // /////////////////////////////////////

    const {
      Model,
      slug,
      req: {
        locale,
        fallbackLocale,
      },
    } = options;

    let global = await Model.findOne({ globalType: slug });

    if (!global) {
      global = new Model();
    }

    if (locale && global.setLocale) {
      global.setLocale(locale, fallbackLocale);
    }

    const globalJSON = global.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 2. Execute before global hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 3. Merge updates into existing data
    // /////////////////////////////////////

    options.data = deepmerge(globalJSON, options.data, { arrayMerge: combineMerge });

    // /////////////////////////////////////
    // 4. Execute field-level hooks, policies, and validation
    // /////////////////////////////////////

    options.data = await performFieldOperations(args.config, { ...options, hook: 'beforeUpdate', operationName: 'update' });

    // /////////////////////////////////////
    // 4. Perform database operation
    // /////////////////////////////////////

    Object.assign(global, { ...options.data, globalType: slug });

    global.save();

    global = global.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 5. Execute field-level hooks and policies
    // /////////////////////////////////////

    global = performFieldOperations(args.config, {
      ...options, data: global, hook: 'afterRead', operationName: 'read',
    });

    // /////////////////////////////////////
    // 6. Execute after global hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      global = await afterUpdate(options, global);
    }

    // /////////////////////////////////////
    // 7. Return global
    // /////////////////////////////////////

    return global;
  } catch (error) {
    throw error;
  }
};

module.exports = update;
