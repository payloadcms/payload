/* eslint-disable no-param-reassign */
const { forgotPassword } = require('../../operations');

const forgotPasswordResolver = (config, Model, email) => async (_, args, context) => {
  const options = {
    config,
    Model,
    data: args,
    email,
    req: context,
  };

  await forgotPassword(options);

  return true;
};

module.exports = forgotPasswordResolver;
