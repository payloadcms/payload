import type { Timezone } from '../config/types.js'

import { InvalidConfiguration } from '../errors/index.js'
import { defaultTimezones } from '../fields/baseFields/timezone/defaultTimezones.js'

// Pre-computed Set of default timezone values - skip validation for these
const defaultTimezoneValues = new Set(defaultTimezones.map((tz) => tz.value))
const timezoneSupportCache = new Map<string, boolean>()

type ValidateTimezonesArgs = {
  /**
   * The source of the timezones for error messaging
   */
  source?: string
  /**
   * Array of timezones to validate
   */
  timezones: Timezone[] | undefined
}

/**
 * Validates a UTC offset string.
 * Only supports the ±HH:mm format (e.g., +05:30, -08:00).
 *
 * Valid ranges: hours -12 to +14, minutes 0-59
 *
 * @returns true if the offset is valid
 */
const isValidUtcOffset = (value: string): boolean => {
  // Strict format check: only ±HH:mm
  const match = value.match(/^([+-])(\d{2}):(\d{2})$/)
  if (!match) {
    return false
  }

  const sign = match[1] === '+' ? 1 : -1
  const hours = parseInt(match[2]!, 10)
  const minutes = parseInt(match[3]!, 10)

  // Minutes must be 0-59
  if (minutes > 59) {
    return false
  }

  // Valid range: -12:00 (-720 min) to +14:00 (+840 min)
  const totalMinutes = sign * (hours * 60 + minutes)
  return totalMinutes >= -720 && totalMinutes <= 840
}

/**
 * Checks if a timezone is supported by the current runtime.
 * Supports both IANA timezone names and UTC offset formats.
 *
 * For IANA names: Uses Intl.DateTimeFormat and Intl.supportedValuesOf
 * For UTC offsets: Uses native Date API to validate (±HH:mm format only)
 */
const isTimezoneSupported = (timezoneValue: string): boolean => {
  const cachedResult = timezoneSupportCache.get(timezoneValue)

  if (cachedResult !== undefined) {
    return cachedResult
  }

  let isSupported = false

  // UTC is always supported
  if (timezoneValue === 'UTC') {
    isSupported = true
  } else if (timezoneValue.startsWith('+') || timezoneValue.startsWith('-')) {
    // Check if it's a UTC offset format (starts with + or -)
    isSupported = isValidUtcOffset(timezoneValue)
  } else {
    // For IANA timezone names, use Intl.DateTimeFormat as primary check
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezoneValue })
      isSupported = true
    } catch {
      // DateTimeFormat failed, timezone is not supported
    }

    // Secondary check: verify against supportedValuesOf if available
    if (!isSupported && typeof Intl.supportedValuesOf === 'function') {
      const supportedTimezones = Intl.supportedValuesOf('timeZone')
      isSupported = supportedTimezones.includes(timezoneValue)
    }
  }

  timezoneSupportCache.set(timezoneValue, isSupported)
  return isSupported
}

/**
 * Validates that all provided timezones are supported by the current runtime's Intl API.
 * Uses both Intl.DateTimeFormat and Intl.supportedValuesOf for comprehensive validation.
 *
 * @throws InvalidConfiguration if an unsupported timezone is found
 */
export const validateTimezones = ({ source, timezones }: ValidateTimezonesArgs): void => {
  if (!timezones?.length) {
    return
  }

  for (const timezone of timezones) {
    // Skip validation for known-valid default timezones
    if (defaultTimezoneValues.has(timezone.value)) {
      continue
    }
    if (!isTimezoneSupported(timezone.value)) {
      const sourceText = source ? ` in ${source}` : ''
      throw new InvalidConfiguration(
        `Timezone ${timezone.value}${sourceText} is not supported by the current runtime via the Intl API.`,
      )
    }
  }
}
