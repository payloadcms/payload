import { format } from 'date-fns';
import * as Locales from "date-fns/locale/index.js";

import { getSupportedDateLocale } from './getSupportedDateLocale.js';

export const formatDate = (date: Date | number | string | undefined, pattern: string, locale?: string): string => {
  const theDate = new Date(date);
  const currentLocale = Locales[getSupportedDateLocale(locale)];
  return format(theDate, pattern, { locale: currentLocale });
};
