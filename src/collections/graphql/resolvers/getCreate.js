/* eslint-disable no-param-reassign */
const withDefaultLocale = require('../../../graphql/resolvers/withDefaultLocale');
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const createQuery = require('../../queries/create');

const create = (config, collection) => withDefaultLocale(
  config.localization,
  withPolicy(
    collection.config.policies.create,
    async (_, args, context) => {
      const options = {
        model: collection.model,
        locale: context.locale,
        data: args.data,
      };

      if (args.locale) {
        context.locale = args.locale;
        options.locale = args.locale;
      }

      const result = await createQuery(options);

      return result;
    },
  ),
);

module.exports = create;
