/* eslint-disable no-param-reassign */
const { init } = require('../../operations');

const initResolver = User => async () => {
  const options = {
    Model: User,
    api: 'GraphQL',
  };

  const result = await init(options);

  return result;
};

module.exports = initResolver;
