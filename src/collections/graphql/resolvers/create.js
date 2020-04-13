/* eslint-disable no-param-reassign */
const createQuery = require('../../queries/create');

const create = collection => async (_, args, context) => {
  const options = {
    ...collection,
    data: args.data,
    user: context.user,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  const result = await createQuery(options);

  return result;
};

module.exports = create;
