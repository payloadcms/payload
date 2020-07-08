const { Forbidden } = require('../errors');

const executeAccess = async (operation, access) => {
  if (access) {
    const result = await access(operation);

    if (!result) {
      throw new Forbidden();
    }

    return result;
  }

  if (operation.req.user) {
    return true;
  }

  throw new Forbidden();
};

module.exports = executeAccess;
