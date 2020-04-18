const { NotFound } = require('../../errors');
const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');

const findByID = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = args.config && args.config.policies && args.config.policies.read;
    await executePolicy(args.user, policy);

    let options = {
      query: { _id: args.id },
      Model: args.Model,
      locale: args.locale,
      fallbackLocale: args.fallbackLocale,
      depth: args.depth,
      config: args.config,
      user: args.user,
      api: args.api,
    };

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
      query,
      locale,
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


    let result = await Model.findOne(query, {}, queryOptionsToExecute);

    if (!result) throw new NotFound();

    if (locale && result.setLocale) {
      result.setLocale(locale, fallbackLocale);
    }

    result = result.toJSON({ virtuals: true });

    // /////////////////////////////////////
    // 4. Execute after collection hook
    // /////////////////////////////////////

    const { afterRead } = args.config.hooks;

    if (typeof afterRead === 'function') {
      result = await afterRead(options, result);
    }

    // /////////////////////////////////////
    // 5. Execute after collection field-level hooks
    // /////////////////////////////////////

    result = await executeFieldHooks(args.config.fields, result, 'afterRead');

    // /////////////////////////////////////
    // 6. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = findByID;
