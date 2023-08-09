type createLocaleWhereQuery = {
  fallbackLocale?: string | false
  locale?: string
}

export const createLocaleWhereQuery = ({ fallbackLocale, locale }) => {
  if (!locale || locale === 'all') return undefined;

  if (fallbackLocale) return ({ _locale }, { or, eq }) => or(eq(_locale, locale), eq(_locale, fallbackLocale));

  return ({ _locale }, { eq }) => eq(_locale, locale);
};
