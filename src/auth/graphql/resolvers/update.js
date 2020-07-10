/* eslint-disable no-param-reassign */
const { update } = require('../../operations');

const updateResolver = (config, collection) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const options = {
    config,
    collection,
    data: args.data,
    id: args.id,
    depth: 0,
    req: context.req,
  };

  const user = await update(options);

  return user;
};

module.exports = updateResolver;
