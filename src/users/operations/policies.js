const policies = async (args) => {
  try {
    const {
      config,
      req,
      req: { user },
    } = args;

    const isLoggedIn = !!(user);

    const policyResults = {
      canAccessAdmin: config.User.policies && config.User.policies.admin ? config.User.policies.admin(args) : isLoggedIn,
    };

    config.collections.forEach((collection) => {
      policyResults[collection.slug] = {};

      const operations = ['create', 'read', 'update', 'delete'];

      operations.forEach(async (operation) => {
        policyResults[collection.slug][operation] = {};

        if (typeof collection.policies[operation] === 'function') {
          const result = await collection.policies[operation]({ req });

          if (typeof result === 'object') {
            policyResults[collection.slug][operation].permission = true;
            policyResults[collection.slug][operation].where = result;
          } else {
            policyResults[collection.slug][operation].permission = !!(result);
          }
        } else {
          policyResults[collection.slug][operation].permission = isLoggedIn;
        }
      });
    });

    return policyResults;
  } catch (error) {
    throw error;
  }
};

module.exports = policies;
