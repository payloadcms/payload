import { format, formatDistanceToNow } from 'date-fns'

import { getDateLocale } from './getDateLocale.js'

export const formatDate = (
  date: Date | number | string | undefined,
  pattern: string,
  locale?: string,
): string => {
  const theDate = new Date(date)
  const { localeData } = getDateLocale(locale)
  return format(theDate, pattern, { locale: localeData })
}

export const formatTimeToNow = (
  date: Date | number | string | undefined,
  locale?: string,
): string => {
  const theDate = new Date(date)
  const { localeData } = getDateLocale(locale)
  return formatDistanceToNow(theDate, { locale: localeData })
}
