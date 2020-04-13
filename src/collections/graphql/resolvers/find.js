/* eslint-disable no-param-reassign */
const find = require('../../queries/find');

const getFind = collection => async (_, args, context) => {
  const options = {
    ...collection,
    depth: 0,
    query: {},
    paginate: {},
    user: context.user,
  };

  if (args.where) options.query.where = args.where;
  if (args.limit) options.paginate.limit = args.limit;
  if (args.page) options.paginate.page = args.page;
  if (args.sort) options.paginate.sort = args.sort;

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

module.exports = getFind;
