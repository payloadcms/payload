/* eslint-disable no-param-reassign */
const { find } = require('../../operations');

const findResolver = collection => async (_, args, context) => {
  const options = {
    config: collection.config,
    Model: collection.Model,
    depth: 0,
    where: args.where,
    limit: args.limit,
    page: args.page,
    sort: args.sort,
    user: context.user,
    api: 'GraphQL',
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const results = await find(options);

  return results;
};

module.exports = findResolver;
