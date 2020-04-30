const { NotFound } = require('../../errors');
const executePolicy = require('../../users/executePolicy');

const deleteQuery = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.delete);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before collection hook
    // /////////////////////////////////////

    const { beforeDelete } = args.config.hooks;

    if (typeof beforeDelete === 'function') {
      options = await beforeDelete(options);
    }

    // /////////////////////////////////////
    // 3. Perform database operation
    // /////////////////////////////////////

    const {
      Model,
      id,
      req: {
        locale,
        fallbackLocale,
      },
    } = options;

    let result = await Model.findOneAndDelete({ _id: id });

    if (!result) throw new NotFound();

    result = result.toJSON({ virtuals: true });

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    // /////////////////////////////////////
    // 4. Execute after collection hook
    // /////////////////////////////////////

    const { afterDelete } = args.config.hooks;

    if (typeof afterDelete === 'function') {
      result = await afterDelete(options, result) || result;
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
