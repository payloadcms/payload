const executePolicy = require('../../auth/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');
const validate = require('../../validation/validateUpdate');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.update);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute field-level policies
    // /////////////////////////////////////

    // Field-level policies here

    // /////////////////////////////////////
    // 3. Validate incoming data
    // /////////////////////////////////////

    await validate(args.data, args.config.fields);

    // /////////////////////////////////////
    // 4. Execute before update field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(options, args.config.fields, args.data, 'beforeUpdate', args.data);

    // /////////////////////////////////////
    // 5. Execute before global hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 6. Perform database operation
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
    // 7. Execute after global hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      result = await afterUpdate(options, result);
    }

    // /////////////////////////////////////
    // 8. Return results
    // /////////////////////////////////////

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = update;
