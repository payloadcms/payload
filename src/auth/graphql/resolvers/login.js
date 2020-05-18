/* eslint-disable no-param-reassign */
const { login } = require('../../operations');

const loginResolver = (config, collection) => async (_, args, context) => {
  const options = {
    collection,
    config,
    data: {
      email: args.email,
      password: args.password,
    },
    req: context,
  };

  const token = await login(options);

  return token;
};

module.exports = loginResolver;
