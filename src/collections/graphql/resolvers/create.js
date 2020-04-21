/* eslint-disable no-param-reassign */
const { create } = require('../../operations');

const createResolver = collection => async (_, args, context) => {
  const options = {
    config: collection.config,
    Model: collection.Model,
    data: args.data,
    user: context.user,
    api: 'GraphQL',
    locale: context.locale,
    fallbackLocale: context.fallbackLocale,
    req: context,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  const result = await create(options);

  return result;
};

module.exports = createResolver;
