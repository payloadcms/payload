/* eslint-disable no-param-reassign */
const meResolver = async (_, args, context) => {
  return context.user;
};

module.exports = meResolver;
