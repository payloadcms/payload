const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findQuery = require('../../queries/find');

const find = ({ config, model }) => {
  return withPolicy(
    config.policies.read,
    async (_, args) => {
      const results = await findQuery({
        depth: 0,
        model,
        query: args,
      });

      return results;
    },
  );
};

module.exports = find;
