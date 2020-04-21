/* eslint-disable no-param-reassign */
const { findOne } = require('../../operations');

const findOneResolver = (Model, config) => async (_, args, context) => {
  const { slug } = config;

  const options = {
    Model,
    config,
    slug,
    depth: 0,
    api: 'GraphQL',
    user: context.user,
    req: context,
  };

  if (args.locale) {
    context.locale = args.locale;
    options.locale = args.locale;
  }

  if (args.fallbackLocale) {
    context.fallbackLocale = args.fallbackLocale;
    options.fallbackLocale = args.fallbackLocale;
  }

  const result = await findOne(options);
  return result;
};

module.exports = findOneResolver;
