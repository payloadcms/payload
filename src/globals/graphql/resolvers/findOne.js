/* eslint-disable no-param-reassign */
const { findOne } = require('../../operations');

const findOneResolver = (config, Model, globalConfig) => async (_, args, context) => {
  if (args.locale) context.req.locale = args.locale;
  if (args.fallbackLocale) context.req.fallbackLocale = args.fallbackLocale;

  const { slug } = globalConfig;

  const options = {
    Model,
    config,
    globalConfig,
    slug,
    depth: 0,
    req: context.req,
  };

  const result = await findOne(options);
  return result;
};

module.exports = findOneResolver;
