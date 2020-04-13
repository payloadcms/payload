/* eslint-disable no-param-reassign */
const withPolicy = require('../../../graphql/resolvers/withPolicy');
const { deleteQuery } = require('../../queries');

const getDelete = collection => withPolicy(
  collection.config.policies.delete,
  async (_, args) => {
    const options = {
      model: collection.model,
      id: args.id,
    };

    const result = await deleteQuery(options);

    return result;
  },
);

module.exports = getDelete;
