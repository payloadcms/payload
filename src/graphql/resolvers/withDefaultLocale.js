/* eslint-disable no-param-reassign */
const withDefaultLocale = (localization, resolver) => (_, context, args) => {
  const { defaultLocale, fallback } = localization;

  context.locale = defaultLocale;
  context.fallbackLocale = fallback ? defaultLocale : null;

  return resolver(_, context, args);
};

module.exports = withDefaultLocale;
