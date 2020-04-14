/* eslint-disable no-param-reassign */
const { upsert } = require('../../operations');

const upsertResolver = (Model, config) => async (_, args, context) => {
  const { slug } = config;

  const options = {
    config,
    Model,
    locale: context.locale,
    fallbackLocale: context.fallbackLocale,
    data: args.data,
    slug,
    depth: 0,
    api: 'GraphQL',
    user: context.user,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const result = await upsert(options);

  return result;
};

module.exports = upsertResolver;
