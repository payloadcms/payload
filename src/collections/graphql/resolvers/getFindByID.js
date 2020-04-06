const withPolicy = require('../../../graphql/resolvers/withPolicy');
const findByIDQuery = require('../../queries/findByID');

const findByID = ({ config, model }) => withPolicy(
  config.policies.read,
  async (_, { id }) => {
    const result = await findByIDQuery({
      depth: 0,
      model,
      id,
    });

    return result;
  },
);

module.exports = findByID;
