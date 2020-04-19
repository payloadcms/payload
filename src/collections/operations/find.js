const executePolicy = require('../../users/executePolicy');
const executeFieldHooks = require('../../fields/executeHooks');

const find = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    await executePolicy(args, args.config.policies.read);

    const queryToBuild = {};
    if (args.where) queryToBuild.where = args.where;

    let options = {
      query: await args.Model.buildQuery(queryToBuild, args.locale),
      Model: args.Model,
      locale: args.locale,
      fallbackLocale: args.fallbackLocale,
      page: args.page,
      limit: args.limit,
      sort: args.sort,
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
      query,
      page,
      limit,
      sort,
      api,
      depth,
      Model,
      locale,
      fallbackLocale,
    } = options;

    const optionsToExecute = {
      page: page || 1,
      limit: limit || 10,
      sort,
      options: {},
    };

    // Only allow depth override within REST.
    // If allowed in GraphQL, it would break resolvers
    // as a full object will be returned instead of an ID string
    if (api === 'REST') {
      if (depth && depth !== '0') {
        optionsToExecute.options.autopopulate = {
          maxDepth: parseInt(depth, 10),
        };
      } else {
        optionsToExecute.options.autopopulate = false;
      }
    }

    let result = await Model.paginate(query, optionsToExecute);

    result = {
      ...result,
      docs: await Promise.all(result.docs.map(async (doc) => {
        if (locale && doc.setLocale) {
          doc.setLocale(locale, fallbackLocale);
        }

        let virtualizedDoc = doc.toJSON({ virtuals: true });

        virtualizedDoc = await executeFieldHooks(args.config.fields, virtualizedDoc, 'afterRead');

        return virtualizedDoc;
      })),
    };

    // /////////////////////////////////////
    // 4. Execute after collection hook
    // /////////////////////////////////////

    const { afterRead } = args.config.hooks;

    if (typeof afterRead === 'function') {
      result = await afterRead(options, result);
    }

    // /////////////////////////////////////
    // 5. Return results
    // /////////////////////////////////////

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = find;
