/* eslint-disable no-param-reassign */
const { refresh } = require('../../operations');

const refreshResolver = ({ Model, config }) => async (_, __, context) => {
  const options = {
    config,
    Model,
    authorization: context.headers.authorization,
    api: 'GraphQL',
    req: context,
  };

  const refreshedToken = await refresh(options);

  return refreshedToken;
};

module.exports = refreshResolver;
