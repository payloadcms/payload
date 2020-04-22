/* eslint-disable no-param-reassign */
const { register } = require('../../operations');

const registerResolver = ({ Model, config }) => async (_, args, context) => {
  const options = {
    config,
    Model,
    data: args.data,
    depth: 0,
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

  const token = await register(options);

  return token;
};

module.exports = registerResolver;
