const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findQuery = require('../../queries/find');

const find = ({ config, model }) => {
  return withPolicy(
    config.policies.read,
    async (_, args) => {
      const options = {
        depth: 0,
        model,
        query: args,
        locale: args.locale,
      };

      if (args.fallbackLocale) options.fallbackLocale = args.fallbackLocale;

      const results = await findQuery(options);

      return results;
    },
  );
};

module.exports = find;
