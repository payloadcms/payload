export default (localization: { locales: string[] }) =>
  (value: unknown): boolean =>
    typeof value === 'object' &&
    Object.keys(value).some((key) => localization.locales.indexOf(key) > -1)
