/* eslint-disable no-param-reassign */
const findByIDQuery = require('../../queries/findByID');

const findByID = collection => async (_, args, context) => {
  const options = {
    ...collection,
    depth: 0,
    id: args.id,
    user: context.user,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const result = await findByIDQuery(options);

  return result;
};

module.exports = findByID;
