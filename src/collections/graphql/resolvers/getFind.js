/* eslint-disable no-param-reassign */
const withDefaultLocale = require('../../../graphql/resolvers/withDefaultLocale');
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findQuery = require('../../queries/find');

const getFind = (config, collection) => withDefaultLocale(
  config.localization,
  withPolicy(
    collection.config.policies.read,
    async (_, args, context) => {
      const options = {
        depth: 0,
        model: collection.model,
      };

      if (Object.keys(args).length > 0) {
        options.query = Object.keys(args).reduce((query, arg) => {
          if (arg === 'where') {
            return {
              ...query,
              [arg]: args[arg],
            };
          }

          return query;
        }, {});
      }

      if (args.locale) {
        context.locale = args.locale;
        options.locale = args.locale;
      }

      if (args.fallbackLocale) {
        context.fallbackLocale = args.fallbackLocale;
        options.fallbackLocale = args.fallbackLocale;
      }

      const results = await findQuery(options);

      return results;
    },
  ),
);

module.exports = getFind;
