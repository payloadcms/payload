/* eslint-disable no-param-reassign */
const withDefaultLocale = require('../../../graphql/resolvers/withDefaultLocale');
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const updateQuery = require('../../queries/update');

const update = (config, collection) => withDefaultLocale(
  config.localization,
  withPolicy(
    collection.config.policies.update,
    async (_, args, context) => {
      const options = {
        model: collection.model,
        locale: context.locale,
        data: args.data,
        id: args.id,
      };

      if (args.locale) {
        context.locale = args.locale;
        options.locale = args.locale;
      }

      const result = await updateQuery(options);

      return result;
    },
  ),
);

module.exports = update;
