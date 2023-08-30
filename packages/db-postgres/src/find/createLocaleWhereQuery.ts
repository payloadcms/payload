type CreateLocaleWhereQueryArgs = {
  fallbackLocale?: false | string
  locale?: string
}

export const createLocaleWhereQuery = ({ fallbackLocale, locale }: CreateLocaleWhereQueryArgs) => {
  if (!locale || locale === 'all') return undefined

  if (fallbackLocale)
    return ({ _locale }, { eq, or }) => or(eq(_locale, locale), eq(_locale, fallbackLocale))

  return ({ _locale }, { eq }) => eq(_locale, locale)
}
