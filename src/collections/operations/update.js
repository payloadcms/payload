const executePolicy = require('../../users/executePolicy');
const { NotFound } = require('../../errors');

const update = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args.user, args.config.policies.update);

    // Await validation here

    let options = {
      Model: args.Model,
      locale: args.locale,
      fallbackLocale: args.fallbackLocale,
      id: args.id,
      data: args.data,
    };

    // /////////////////////////////////////
    // 2. Execute before collection hook
    // /////////////////////////////////////

    const { beforeUpdate } = args.config.hooks;

    if (typeof beforeUpdate === 'function') {
      options = await beforeUpdate(options);
    }

    // /////////////////////////////////////
    // 3. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      id,
      locale,
      fallbackLocale,
      data,
    } = options;

    let result = await Model.findOne({ _id: id });

    if (!result) throw new NotFound();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    Object.assign(result, data);
    await result.save();

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 4. Execute after collection hook
    // /////////////////////////////////////

    const { afterUpdate } = args.config.hooks;

    if (typeof afterUpdate === 'function') {
      result = await afterUpdate(options, result);
    }

    // /////////////////////////////////////
    // 5. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = update;
