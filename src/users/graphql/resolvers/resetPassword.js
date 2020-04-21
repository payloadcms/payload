/* eslint-disable no-param-reassign */
const { resetPassword } = require('../../operations');

const resetPasswordResolver = ({ Model, config }) => async (_, args, context) => {
  const options = {
    Model,
    config,
    data: args,
    api: 'GraphQL',
    user: context.user,
  };

  const token = await resetPassword(options);

  return token;
};

module.exports = resetPasswordResolver;
