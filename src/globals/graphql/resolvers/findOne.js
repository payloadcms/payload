/* eslint-disable no-param-reassign */
const { findOne } = require('../../operations');

const findOneResolver = (Model, config) => async (_, args, context) => {
  if (args.locale) context.locale = args.locale;
  if (args.fallbackLocale) context.fallbackLocale = args.fallbackLocale;

  const { slug } = config;

  const options = {
    Model,
    config,
    slug,
    depth: 0,
    req: context,
  };

  const result = await findOne(options);
  return result;
};

module.exports = findOneResolver;
