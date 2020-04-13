/* eslint-disable no-param-reassign */
const updateQuery = require('../../queries/update');

const update = collection => async (_, args, context) => {
  const options = {
    ...collection,
    locale: context.locale,
    data: args.data,
    id: args.id,
    user: context.user,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  const result = await updateQuery(options);

  return result;
};

module.exports = update;
