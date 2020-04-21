/* eslint-disable no-param-reassign */
const { update } = require('../../operations');

const updateResolver = ({ Model, config }) => async (_, args, context) => {
  const options = {
    config,
    Model,
    data: args.data,
    id: args.id,
    api: 'GraphQL',
    user: context.user,
    locale: context.locale,
    fallbackLocale: context.fallbackLocale,
    depth: 0,
    req: context,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const user = await update(options);

  return user;
};

module.exports = updateResolver;
