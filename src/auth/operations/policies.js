const allOperations = ['create', 'read', 'update', 'delete'];

const policies = async (args) => {
  try {
    const {
      config,
      collection: {
        config: collectionConfig,
      },
      req,
      req: { user },
    } = args;

    const isLoggedIn = !!(user);

    const returnPolicyResults = (entity, operations) => {
      const results = {};

      operations.forEach(async (operation) => {
        results[operation] = {};

        if (typeof entity.policies[operation] === 'function') {
          const result = await entity.policies[operation]({ req });

          if (typeof result === 'object') {
            results[operation].permission = true;
            results[operation].where = result;
          } else {
            results[operation].permission = !!(result);
          }
        } else {
          results[operation].permission = isLoggedIn;
        }
      });

      return results;
    };

    const policyResults = {
      canAccessAdmin: collectionConfig.policies.admin ? collectionConfig.policies.admin(args) : isLoggedIn,
    };

    config.collections.forEach((collection) => {
      policyResults[collection.slug] = returnPolicyResults(collection, allOperations);
    });

    config.globals.forEach((global) => {
      policyResults[global.slug] = returnPolicyResults(global, ['read', 'update']);
    });

    policyResults[config.User.slug] = returnPolicyResults(config.User, allOperations);

    return policyResults;
  } catch (error) {
    throw error;
  }
};

module.exports = policies;
