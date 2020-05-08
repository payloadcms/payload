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

      const baseOperations = ['create', 'read', 'update', 'delete'];

      baseOperations.forEach(async (operation) => {
        if (typeof collection.policies[operation] === 'function') {
          policyResults[collection.slug][operation] = await collection.policies[operation]({ req });
        } else {
          policyResults[collection.slug][operation] = isLoggedIn;
        }
      });
    });

    return policyResults;
  } catch (error) {
    throw error;
  }
};

module.exports = policies;
