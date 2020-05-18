/* eslint-disable no-param-reassign */
const { forgotPassword } = require('../../operations');

const forgotPasswordResolver = (config, collection, email) => async (_, args, context) => {
  const options = {
    config,
    collection,
    data: args,
    email,
    req: context,
  };

  await forgotPassword(options);

  return true;
};

module.exports = forgotPasswordResolver;
