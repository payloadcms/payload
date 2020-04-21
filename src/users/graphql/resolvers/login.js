/* eslint-disable no-param-reassign */
const { login } = require('../../operations');

const loginResolver = ({ Model, config }) => async (_, args, context) => {
  const usernameField = config.auth.useAsUsername;
  const options = {
    Model,
    config,
    data: {
      [usernameField]: args[usernameField],
      password: args.password,
    },
    api: 'GraphQL',
    req: context,
  };

  const token = await login(options);

  return token;
};

module.exports = loginResolver;
