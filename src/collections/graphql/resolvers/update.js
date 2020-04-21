/* eslint-disable no-param-reassign */
const { update } = require('../../operations');

const updateResolver = collection => async (_, args, context) => {
  const options = {
    config: collection.config,
    Model: collection.Model,
    locale: context.locale,
    fallbackLocale: context.fallbackLocale,
    data: args.data,
    id: args.id,
    user: context.user,
    api: 'GraphQL',
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

  const result = await update(options);

  return result;
};

module.exports = updateResolver;
