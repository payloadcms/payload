const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');

const upsert = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.upsert);

    let options = { ...args };

    // Await validation here

    // /////////////////////////////////////
    // 2. Execute before update field-level hooks
    // /////////////////////////////////////

    options.data = await executeFieldHooks(args.config.fields, args.data, 'beforeUpdate');

    // /////////////////////////////////////
    // 2. Execute before global hook
    // /////////////////////////////////////

    const { beforeUpsert } = args.config.hooks;

    if (typeof beforeUpsert === 'function') {
      options = await beforeUpsert(options);
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

    const { afterUpsert } = args.config.hooks;

    if (typeof afterUpsert === 'function') {
      result = await afterUpsert(options, result);
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
