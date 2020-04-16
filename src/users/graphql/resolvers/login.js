/* eslint-disable no-param-reassign */
const { login } = require('../../operations');

const loginResolver = (User, config) => async (_, args) => {
  const usernameField = config.auth.useAsUsername;
  const options = {
    config,
    Model: User,
    data: {
      [usernameField]: args[usernameField],
      password: args.password,
    },
    api: 'GraphQL',
  };

  const result = await login(options);

  return result;
};

module.exports = loginResolver;
