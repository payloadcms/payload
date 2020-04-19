const { Forbidden } = require('../errors');

const executePolicy = async (operation, policy) => {
  if (policy) {
    const result = await policy(operation);

    if (!result) {
      throw new Forbidden();
    }

    return true;
  }

  if (operation.user) {
    return true;
  }

  throw new Forbidden();
};

module.exports = executePolicy;
