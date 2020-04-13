/* eslint-disable no-param-reassign */
const { deleteQuery } = require('../../queries');

const getDelete = collection => async (_, args, context) => {
  const options = {
    ...collection,
    id: args.id,
    user: context.user,
  };

  const result = await deleteQuery(options);

  return result;
};

module.exports = getDelete;
