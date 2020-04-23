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
      ...args,
      query: await args.Model.buildQuery(queryToBuild, args.locale),
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
      depth,
      Model,
      req: {
        locale,
        fallbackLocale,
        payloadAPI,
      },
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
    if (payloadAPI === 'REST') {
      if (depth && depth !== '0') {
        optionsToExecute.options.autopopulate = {
          maxDepth: parseInt(depth, 10),
        };
      } else {
        optionsToExecute.options.autopopulate = false;
      }
    }

    let result = await Model.paginate(query, optionsToExecute);

    // /////////////////////////////////////
    // 4. Execute field-level afterRead hooks
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(result.docs.map(async (doc) => {
        if (locale && doc.setLocale) {
          doc.setLocale(locale, fallbackLocale);
        }
        const hookedDoc = await executeFieldHooks(args.config.fields, doc, 'afterRead');
        return hookedDoc;
      })),
    };

    // /////////////////////////////////////
    // 5. Execute afterRead collection hook
    // /////////////////////////////////////

    const { afterRead } = args.config.hooks;

    if (typeof afterRead === 'function') {
      result = await afterRead(options, result);
    }

    // /////////////////////////////////////
    // 6. Return results
    // /////////////////////////////////////

    result = {
      ...result,
      docs: await Promise.all(result.docs.map(async doc => doc.toJSON({ virtuals: true }))),
    };

    return result;
  } catch (err) {
    throw err;
  }
};

module.exports = find;
