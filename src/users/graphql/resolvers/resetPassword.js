/* eslint-disable no-param-reassign */
const { resetPassword } = require('../../operations');

const resetPasswordResolver = ({ Model, config }) => async (_, args, context) => {
  const options = {
    Model,
    config,
    data: args,
    api: 'GraphQL',
    user: context.user,
    locale: context.locale,
    fallbackLocale: context.fallbackLocale,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const user = await resetPassword(options);

  return user;
};

module.exports = resetPasswordResolver;
