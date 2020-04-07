/* eslint-disable no-param-reassign */
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findQuery = require('../../queries/find');

const find = ({ config, model }) => {
  return withPolicy(
    config.policies.read,
    async (_, args, context) => {
      const options = {
        depth: 0,
        model,
        query: Object.keys(args).reduce((query, arg) => {
          if (arg === 'where') {
            return {
              ...query,
              arg: args[arg],
            };
          }

          return query;
        }),
      };

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
  );
};

module.exports = find;
