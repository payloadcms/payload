const { Forbidden } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const find = async (options) => {
  try {
    const {
      model,
      query = {},
      locale,
      fallbackLocale,
      paginate = {},
      depth,
      config,
      user,
    } = options;

    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = config && config.policies && config.policies.read;
    const hasPermission = await executePolicy(user, policy);

    if (hasPermission) {
      let mongooseQuery = await model.buildQuery(query, locale);
      let mongooseOptions = {};

      if (paginate.page) mongooseOptions.page = paginate.page;
      if (paginate.limit) mongooseOptions.limit = paginate.limit;
      if (paginate.sort) mongooseOptions.sort = paginate.sort;

      if (depth && depth !== '0') {
        mongooseOptions.options.autopopulate = {
          maxDepth: parseInt(depth, 10),
        };
      } else {
        mongooseOptions.options.autopopulate = false;
      }

      // /////////////////////////////////////
      // 2. Execute before collection hook
      // /////////////////////////////////////

      const beforeReadHook = config && config.hooks && config.hooks.beforeRead;

      if (typeof beforeReadHook === 'function') {
        [mongooseQuery, mongooseOptions] = await beforeReadHook(mongooseQuery, mongooseOptions);
      }

      // /////////////////////////////////////
      // 3. Query database
      // /////////////////////////////////////

      let result = await model.paginate(mongooseQuery, mongooseOptions);

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

      const afterReadHook = config && config.hooks && config.hooks.afterRead;

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
