/* eslint-disable no-param-reassign */
const { update } = require('../../operations');

const updateResolver = (Model, config) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const { slug } = config;

  const options = {
    config,
    Model,
    data: args.data,
    slug,
    depth: 0,
    req: context.req,
  };

  const result = await update(options);

  return result;
};

module.exports = updateResolver;
