/* eslint-disable no-param-reassign */
const { login } = require('../../operations');

const loginResolver = ({ Model, config }) => async (_, args) => {
  const usernameField = config.auth.useAsUsername;
  const options = {
    Model,
    config,
    data: {
      [usernameField]: args[usernameField],
      password: args.password,
    },
    api: 'GraphQL',
  };

  const token = await login(options);

  return token;
};

module.exports = loginResolver;
