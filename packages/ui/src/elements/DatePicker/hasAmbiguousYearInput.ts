import type { DatePickerProps } from 'react-datepicker'

import { format } from 'date-fns'
import { getDefaultLocale } from 'react-datepicker'

type DatePickerLocale = Exclude<DatePickerProps['locale'], string | undefined>

export const hasAmbiguousYearInput = ({
  date,
  dateFormat,
  inputValue,
  locale,
  rangeSeparator = ' - ',
}: {
  date: Date | null | unknown
  dateFormat: string | string[]
  inputValue?: string
  locale?: DatePickerProps['locale']
  rangeSeparator?: string
}): boolean => {
  if (!inputValue) {
    return false
  }

  const formats = Array.isArray(dateFormat) ? dateFormat : [dateFormat]
  const resolvedLocale = resolveDatePickerLocale({ locale })

  const isEndpointAmbiguous = (endpointDate: unknown, endpointInput?: string): boolean => {
    const trimmedInput = endpointInput?.trim()
    if (!(endpointDate instanceof Date) || endpointDate.getFullYear() >= 100 || !trimmedInput) {
      return false
    }

    return !formats.some(
      (fmt) =>
        format(endpointDate, fmt, {
          locale: resolvedLocale,
          useAdditionalDayOfYearTokens: true,
          useAdditionalWeekYearTokens: true,
        }) === trimmedInput,
    )
  }

  if (Array.isArray(date)) {
    const parts = inputValue.split(rangeSeparator)
    return date.some((endpointDate, index) => isEndpointAmbiguous(endpointDate, parts[index]))
  }

  return isEndpointAmbiguous(date, inputValue)
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
