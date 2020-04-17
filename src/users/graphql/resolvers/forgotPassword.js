/* eslint-disable no-param-reassign */
const { forgotPassword } = require('../../operations');

const forgotPasswordResolver = ({ Model, config }, email) => async (_, args, context) => {
  const options = {
    Model,
    config,
    data: args,
    api: 'GraphQL',
    user: context.user,
    email,
  };

  const result = await forgotPassword(options);

  return result;
};

module.exports = forgotPasswordResolver;
