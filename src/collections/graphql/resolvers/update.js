/* eslint-disable no-param-reassign */
const update = require('../../queries/update');

const updateResolver = collection => async (_, args, context) => {
  const options = {
    config: collection.config,
    Model: collection.Model,
    locale: context.locale,
    data: args.data,
    id: args.id,
    user: context.user,
    api: 'GraphQL',
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  const result = await update(options);

  return result;
};

module.exports = updateResolver;
