/* eslint-disable no-param-reassign */
const withDefaultLocale = require('../../../graphql/resolvers/withDefaultLocale');
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const find = require('../../queries/find');

const getFind = (config, collection) => withDefaultLocale(
  config.localization,
  withPolicy(
    collection.config.policies.read,
    async (_, args, context) => {
      const options = {
        depth: 0,
        model: collection.model,
        query: {},
        paginate: {},
        locale: context.locale,
        fallbackLocale: context.fallbackLocale,
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
    },
  ),
);

module.exports = getFind;
