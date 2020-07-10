/* eslint-disable no-param-reassign */
const { logout } = require('../../operations');

const logoutResolver = (config, collection) => async (_, __, context) => {
  const options = {
    config,
    collection,
    res: context.res,
  };

  const result = await logout(options);

  return result;
};

module.exports = logoutResolver;
