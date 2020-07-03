/* eslint-disable no-param-reassign */
const { refresh } = require('../../operations');

const refreshResolver = (config, collection) => async (_, __, context) => {
  const options = {
    config,
    collection,
    authorization: context.headers.authorization,
    req: context,
  };

  const result = await refresh(options);

  return result;
};

module.exports = refreshResolver;
