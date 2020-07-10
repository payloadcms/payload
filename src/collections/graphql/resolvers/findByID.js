/* eslint-disable no-param-reassign */
const { findByID } = require('../../operations');

const findByIDResolver = (collection) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const options = {
    config: collection.config,
    Model: collection.Model,
    id: args.id,
    req: context.req,
  };

  const result = await findByID(options);

  return result;
};

module.exports = findByIDResolver;
