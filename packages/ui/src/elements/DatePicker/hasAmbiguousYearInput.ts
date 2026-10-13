import type { DatePickerProps } from 'react-datepicker'

import { format } from 'date-fns'
import { getDefaultLocale } from 'react-datepicker'

type DatePickerLocale = Exclude<DatePickerProps['locale'], string | undefined>

export const hasAmbiguousYearInput = ({
  date,
  dateFormat,
  inputValue,
  locale,
}: {
  date: Date | null
  dateFormat: string | string[]
  inputValue?: string
  locale?: DatePickerProps['locale']
}): boolean => {
  if (!date || date.getFullYear() >= 100 || !inputValue) {
    return false
  }

  const formats = Array.isArray(dateFormat) ? dateFormat : [dateFormat]
  const resolvedLocale = resolveDatePickerLocale({ locale })

  return !formats.some(
    (dateFormat) =>
      format(date, dateFormat, {
        locale: resolvedLocale,
        useAdditionalDayOfYearTokens: true,
        useAdditionalWeekYearTokens: true,
      }) === inputValue,
  )
}

const resolveDatePickerLocale = ({ locale }: { locale?: DatePickerProps['locale'] }) => {
  // The picker formats its explicit 'en' locale with date-fns defaults.
  if (locale === 'en') {
    return undefined
  }

  if (typeof locale === 'object') {
    return locale
  }

  // registerLocale stores names on this scope; react-datepicker exposes no registry getter.
  const scope = (typeof window !== 'undefined' ? window : globalThis) as {
    __localeData__?: Record<string, DatePickerLocale>
  }
  const defaultLocale = getDefaultLocale()

  return (
    (locale && scope.__localeData__?.[locale]) ||
    (defaultLocale && scope.__localeData__?.[defaultLocale]) ||
    undefined
  )
}
