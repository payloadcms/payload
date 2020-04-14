/* eslint-disable no-param-reassign */
const { deleteQuery } = require('../../queries');

const deleteResolver = collection => async (_, args, context) => {
  const options = {
    config: collection.config,
    Model: collection.Model,
    id: args.id,
    user: context.user,
    api: 'GraphQL',
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const result = await deleteQuery(options);

  return result;
};

module.exports = deleteResolver;
