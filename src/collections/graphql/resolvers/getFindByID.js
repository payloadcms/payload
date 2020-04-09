/* eslint-disable no-param-reassign */
const withDefaultLocale = require('../../../graphql/resolvers/withDefaultLocale');
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findByIDQuery = require('../../queries/findByID');

const findByID = (config, collection) => withDefaultLocale(
  config.localization,
  withPolicy(
    collection.config.policies.read,
    async (_, args, context) => {
      const options = {
        depth: 0,
        model: collection.model,
        id: args.id,
      };

      if (args.locale) {
        context.locale = args.locale;
        options.locale = args.locale;
      }

      if (args.fallbackLocale) {
        context.fallbackLocale = args.fallbackLocale;
        options.fallbackLocale = args.fallbackLocale;
      }

      const result = await findByIDQuery(options);

      return result;
    },
  ),
);

module.exports = findByID;
