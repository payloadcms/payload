/* eslint-disable no-param-reassign */
const { refresh } = require('../../operations');

const refreshResolver = (config, collection) => async (_, __, context) => {
  const options = {
    config,
    collection,
    authorization: context.headers.authorization,
    req: context,
  };

  const refreshedToken = await refresh(options);

  return refreshedToken;
};

module.exports = refreshResolver;
