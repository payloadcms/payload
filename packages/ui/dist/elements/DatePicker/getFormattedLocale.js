'use client';

export const getFormattedLocale = (language = 'enUS') => {
  const formattedLocales = {
    en: 'enUS',
    my: 'enUS',
    ua: 'uk',
    zh: 'zhCN'
  };
  const formattedLocale = formattedLocales[language] || language;
  return formattedLocale;
};
//# sourceMappingURL=getFormattedLocale.js.map