/* eslint-disable no-param-reassign */
const { update } = require('../../operations');

const updateResolver = ({ Model, config }) => async (_, args, context) => {
  if (args.locale) context.locale = args.locale;
  if (args.fallbackLocale) context.fallbackLocale = args.fallbackLocale;

  const options = {
    config,
    Model,
    data: args.data,
    id: args.id,
    depth: 0,
    req: context,
  };

  const user = await update(options);

  return user;
};

module.exports = updateResolver;
