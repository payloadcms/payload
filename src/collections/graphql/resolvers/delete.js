/* eslint-disable no-param-reassign */
const { deleteQuery } = require('../../operations');

const deleteResolver = (collection) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const options = {
    config: collection.config,
    Model: collection.Model,
    id: args.id,
    req: context.req,
  };

  const result = await deleteQuery(options);

  return result;
};

module.exports = deleteResolver;
