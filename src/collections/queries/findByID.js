const { Forbidden, NotFound } = require('../../errors');
const executePolicy = require('../../auth/executePolicy');

const findByID = async (options) => {
  try {
    const {
      depth,
      locale,
      fallbackLocale,
      model,
      config,
      id,
      user,
    } = options;

    // /////////////////////////////////////
    // 1. Retrieve and execute policy
    // /////////////////////////////////////

    const policy = config && config.policies && config.policies.read;
    const hasPermission = await executePolicy(user, policy);

    if (hasPermission) {
      let mongooseQuery = { _id: id };
      let mongooseOptions = { options: {} };

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

      let result = await model.findOne(mongooseQuery, {}, mongooseOptions);

      if (!result) throw new NotFound();

      if (locale && result.setLocale) {
        result.setLocale(locale, fallbackLocale);
      }

      result = result.toJSON({ virtuals: true });

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

module.exports = findByID;
