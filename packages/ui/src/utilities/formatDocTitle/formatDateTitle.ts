import type { I18n } from '@payloadcms/translations'

import { TZDateMini as TZDate } from '@date-fns/tz/date/mini'
import { format, formatDistanceToNow, transpose } from 'date-fns'

type FormatDateArgs = {
  date: Date | number | string | undefined
  i18n: I18n<any, any>
  pattern: string
  timezone?: string
}

export const formatDate = ({ date, i18n, pattern, timezone }: FormatDateArgs): string => {
  const theDate = new TZDate(new Date(date))

  if (timezone) {
    const DateWithOriginalTz = TZDate.tz(timezone)

    const modifiedDate = theDate.withTimeZone(timezone)

    // Transpose the date to the selected timezone
    const dateWithTimezone = transpose(modifiedDate, DateWithOriginalTz)

    // Transpose the date to the user's timezone - this is necessary because the react-datepicker component insists on displaying the date in the user's timezone
    return i18n.dateFNS
      ? format(dateWithTimezone, pattern, { locale: i18n.dateFNS })
      : `${i18n.t('general:loading')}...`
  }

  return i18n.dateFNS
    ? format(theDate, pattern, { locale: i18n.dateFNS })
    : `${i18n.t('general:loading')}...`
}

type FormatTimeToNowArgs = {
  date: Date | number | string | undefined
  i18n: I18n<any, any>
}

export const formatTimeToNow = ({ date, i18n }: FormatTimeToNowArgs): string => {
  const theDate = new Date(date)
  return i18n?.dateFNS
    ? formatDistanceToNow(theDate, { locale: i18n.dateFNS })
    : `${i18n.t('general:loading')}...`
}
