import { format } from 'date-fns';
import * as Locale from 'date-fns/locale';

const formattedLocales = {
  en: 'enUS',
  my: 'enUS', // Burmese is not currently supported
  ua: 'uk',
  zh: 'zhCN',
};

export const formatDate = (date: Date | number | string | undefined, pattern: string, locale: string): string => {
  const theDate = new Date(date);
  const currentLocale = Locale[formattedLocales[locale] || locale] || Locale['enUS'];
  return format(theDate, pattern, { locale: currentLocale });
};
