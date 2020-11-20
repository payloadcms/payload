const { Forbidden } = require('../errors');

const executeAccess = async (operation, access) => {
  if (access) {
    const result = await access(operation);

    if (!result) {
      if (!operation.disableErrors) throw new Forbidden();
    }

    return result;
  }

  if (operation.req.user) {
    return true;
  }

  if (!operation.disableErrors) throw new Forbidden();
  return false;
};

module.exports = executeAccess;
