const executePolicy = require('../../users/executePolicy');
const { NotFound } = require('../../errors');
const executeFieldHooks = require('../../fields/executeHooks');

const findOne = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args.user, args.config.policies.read);

    let options = { ...args };

    // /////////////////////////////////////
    // 2. Execute before collection hook
    // /////////////////////////////////////

    const { beforeRead } = args.config.hooks;

    if (typeof beforeRead === 'function') {
      options = await beforeRead(options);
    }

    // /////////////////////////////////////
    // 3. Perform database operation
    // /////////////////////////////////////

    const {
      depth,
      api,
      Model,
      locale,
      slug,
      fallbackLocale,
    } = options;

    const queryOptionsToExecute = {
      options: {},
    };

    // Only allow depth override within REST.
    // If allowed in GraphQL, it would break resolvers
    // as a full object will be returned instead of an ID string
    if (api === 'REST') {
      if (depth && depth !== '0') {
        queryOptionsToExecute.options.autopopulate = {
          maxDepth: parseInt(depth, 10),
        };
      } else {
        queryOptionsToExecute.options.autopopulate = false;
      }
    }

    let result = await Model.findOne({ globalType: slug });

    if (!result) throw new NotFound();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 4. Execute after collection field-level hooks
    // /////////////////////////////////////

    result = await executeFieldHooks(args.config.fields, result, 'afterRead');

    // /////////////////////////////////////
    // 5. Execute after collection hook
    // /////////////////////////////////////

    const { afterRead } = args.config.hooks;

    if (typeof afterRead === 'function') {
      result = await afterRead(options, result);
    }

    // /////////////////////////////////////
    // 6. Return results
    // /////////////////////////////////////

    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = findOne;
