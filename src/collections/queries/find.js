const { Forbidden } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const find = async (args) => {
  try {
    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = args.config && args.config.policies && args.config.policies.read;
    const hasPermission = await executePolicy(args.user, policy);

    if (hasPermission) {
      let options = {
        query: await args.Model.buildQuery({ where: args.where }, args.locale),
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

      const beforeReadHook = args.config && args.config.hooks && args.config.hooks.beforeRead;

      if (typeof beforeReadHook === 'function') {
        options = await beforeReadHook(options);
      }

      // /////////////////////////////////////
      // 3. Query database
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
        page,
        limit,
        sort,
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
        docs: result.docs.map((doc) => {
          if (locale && doc.setLocale) {
            doc.setLocale(locale, fallbackLocale);
          }

          return doc.toJSON({ virtuals: true });
        }),
      };

      // /////////////////////////////////////
      // 4. Execute after collection hook
      // /////////////////////////////////////

      const afterReadHook = args.config && args.config.hooks && args.config.hooks.afterRead;

      if (typeof afterReadHook === 'function') {
        result = await afterReadHook(options, result);
      }

      // /////////////////////////////////////
      // 5. Return results
      // /////////////////////////////////////

      return result;
    }
    throw new Forbidden();
  } catch (err) {
    throw err;
  }
};

module.exports = find;
