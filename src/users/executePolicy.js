const { Forbidden } = require('../errors');

const executePolicy = async (operation, policy) => {
  if (policy) {
    const result = await policy(operation);

    if (!result) {
      throw new Forbidden();
    }

    return policy;
  }

  if (operation.req.user) {
    return true;
  }

  throw new Forbidden();
};

module.exports = executePolicy;
