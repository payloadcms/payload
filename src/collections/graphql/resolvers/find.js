/* eslint-disable no-param-reassign */
const { find } = require('../../operations');

const findResolver = (collection) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const options = {
    config: collection.config,
    Model: collection.Model,
    where: args.where,
    limit: args.limit,
    page: args.page,
    sort: args.sort,
    req: context.req,
  };

  const results = await find(options);
  return results;
};

module.exports = findResolver;
