const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findQuery = require('../../queries/find');

const find = ({ config, model }) => {
  return withPolicy(
    config.policies.read,
    async (_, args, context) => {
      const options = {
        depth: 0,
        model,
        query: args,
        locale: context.locale,
      };

      if (context.query['fallback-locale']) options.fallbackLocale = context.query['fallback-locale'];

      const results = await findQuery(options);

      return results;
    },
  );
};

module.exports = find;
