/* eslint-disable no-param-reassign */
const { refresh } = require('../../operations');

const refreshResolver = (User, config) => async (_, __, context) => {
  const options = {
    config,
    Model: User,
    authorization: context.headers.authorization,
    api: 'GraphQL',
  };

  const refreshedToken = await refresh(options);

  return refreshedToken;
};

module.exports = refreshResolver;
