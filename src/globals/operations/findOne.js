const executePolicy = require('../../auth/executePolicy');
const { NotFound } = require('../../errors');
const performFieldOperations = require('../../fields/performFieldOperations');

const findOne = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.read);

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
      Model,
      slug,
      req: {
        payloadAPI,
        locale,
        fallbackLocale,
      },
    } = options;

    const queryOptionsToExecute = {
      options: {},
    };

    // Only allow depth override within REST.
    // If allowed in GraphQL, it would break resolvers
    // as a full object will be returned instead of an ID string
    if (payloadAPI === 'REST') {
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

    let data = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 4. Execute field-level hooks and policies
    // /////////////////////////////////////

    result = performFieldOperations(args.config, {
      ...options, data, hook: 'afterRead', operationName: 'read',
    });

    // /////////////////////////////////////
    // 5. Execute after collection hook
    // /////////////////////////////////////

    const { afterRead } = args.config.hooks;

    if (typeof afterRead === 'function') {
      data = await afterRead(options, result, data) || data;
    }

    // /////////////////////////////////////
    // 6. Return results
    // /////////////////////////////////////

    return data;
  } catch (error) {
    throw error;
  }
};

module.exports = findOne;
