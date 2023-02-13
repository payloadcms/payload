import { format } from 'date-fns';
import * as Locale from 'date-fns/locale';
import { getSupportedDateLocale } from './getSupportedDateLocale';

export const formatDate = (date: Date | number | string | undefined, pattern: string, locale?: string): string => {
  const theDate = new Date(date);
  const currentLocale = Locale[getSupportedDateLocale(locale)];
  return format(theDate, pattern, { locale: currentLocale });
};
