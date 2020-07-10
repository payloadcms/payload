/* eslint-disable no-param-reassign */
const { resetPassword } = require('../../operations');

const resetPasswordResolver = (config, collection) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const options = {
    collection,
    config,
    data: args,
    req: context.req,
    api: 'GraphQL',
  };

  const token = await resetPassword(options);

  return token;
};

module.exports = resetPasswordResolver;
