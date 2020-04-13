/* eslint-disable no-param-reassign */
const withDefaultLocale = (localization, resolver) => (_, args, context) => {
  const { defaultLocale, fallback } = localization;

  context.locale = defaultLocale;
  context.fallbackLocale = fallback ? defaultLocale : null;

  return resolver(_, args, context);
};

module.exports = withDefaultLocale;
