const { Forbidden } = require('../errors');

const executePolicy = async (user, policy) => {
  if (policy) {
    const result = await policy(user);

    if (!result) {
      throw new Forbidden();
    }

    return true;
  }

  if (user) {
    return true;
  }

  throw new Forbidden();
};

module.exports = executePolicy;
