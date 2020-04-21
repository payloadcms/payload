/* eslint-disable no-param-reassign */
const { init } = require('../../operations');

const initResolver = ({ Model }) => async (_, __, context) => {
  const options = {
    Model,
    api: 'GraphQL',
    user: context.user,
    req: context,
  };

  const result = await init(options);

  return result;
};

module.exports = initResolver;
