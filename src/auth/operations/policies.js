const allOperations = ['create', 'read', 'update', 'delete'];

const policies = async (args) => {
  const {
    config,
    req,
    req: { user },
  } = args;

  const results = {};
  const promises = [];

  const isLoggedIn = !!(user);
  const userCollectionConfig = (user && user.collection) ? config.collections.find(collection => collection.slug === user.collection) : null;

  const createPolicyPromise = async (obj, policy, operation) => {
    const updatedObj = obj;
    const result = await policy({ req });

    if (typeof result === 'object') {
      updatedObj[operation] = {
        permission: true,
        where: result,
      };
    } else {
      updatedObj[operation] = {
        permission: !!(result),
      };
    }
  };

  const executeFieldPolicies = (obj, fields, operation) => {
    const updatedObj = obj;

    fields.forEach((field) => {
      if (field.name) {
        if (!updatedObj[field.name]) updatedObj[field.name] = {};

        if (field.policies && typeof field.policies[operation] === 'function') {
          promises.push(createPolicyPromise(updatedObj[field.name], field.policies[operation], operation));
        } else {
          updatedObj[field.name][operation] = {
            permission: isLoggedIn,
          };
        }

        if (field.fields) {
          if (!updatedObj[field.name].fields) updatedObj[field.name].fields = {};
          executeFieldPolicies(updatedObj[field.name].fields, field.fields, operation);
        }
      }
    });
  };

  const executeEntityPolicies = (entity, operations) => {
    results[entity.slug] = {
      fields: {},
    };

    operations.forEach((operation) => {
      executeFieldPolicies(results[entity.slug].fields, entity.fields, operation);

      if (typeof entity.policies[operation] === 'function') {
        promises.push(createPolicyPromise(results[entity.slug], entity.policies[operation], operation));
      } else {
        results[entity.slug][operation] = {
          permission: isLoggedIn,
        };
      }
    });
  };

  try {
    if (userCollectionConfig) {
      results.canAccessAdmin = userCollectionConfig.policies.admin ? userCollectionConfig.policies.admin(args) : isLoggedIn;
    } else {
      results.canAccessAdmin = false;
    }

    config.collections.forEach((collection) => {
      executeEntityPolicies(collection, allOperations);
    });

    config.globals.forEach((global) => {
      executeEntityPolicies(global, ['read', 'update']);
    });

    await Promise.all(promises);

    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = policies;
