const { Forbidden } = require('../../errors');

const withPolicy = (policy, resolver) => (_, args, context) => {
  const { user } = context;

  if (policy) {
    if (!policy(user)) {
      throw new Forbidden();
    }

    return resolver(_, args, context);
  }

  if (user) {
    return resolver(_, args, context);
  }

  throw new Forbidden();
};

module.exports = withPolicy;
