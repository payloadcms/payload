export const getSupportedDateLocale = (locale = 'enUS'): string => {
  const formattedLocales = {
    en: 'enUS',
    my: 'enUS', // Burmese is not currently supported
    ua: 'uk',
    zh: 'zhCN',
  };

  return formattedLocales[locale] || locale;
};
