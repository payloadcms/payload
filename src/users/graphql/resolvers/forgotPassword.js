/* eslint-disable no-param-reassign */
const { forgotPassword } = require('../../operations');

const forgotPasswordResolver = (config, email) => async (_, args, context) => {
  const options = {
    config,
    data: args,
    email,
    req: context,
  };

  const result = await forgotPassword(options);

  return result;
};

module.exports = forgotPasswordResolver;
