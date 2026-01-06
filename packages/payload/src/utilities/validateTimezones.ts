import type { Timezone } from '../config/types.js'

import { InvalidConfiguration } from '../errors/index.js'

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
 * Checks if a timezone is supported by the current runtime.
 * Uses Intl.DateTimeFormat as the primary check since it tests actual usability,
 * with Intl.supportedValuesOf as a secondary check for environments that support it.
 */
const isTimezoneSupported = (timezoneValue: string): boolean => {
  // UTC is always supported
  if (timezoneValue === 'UTC') {
    return true
  }

  // Primary check: attempt to create a DateTimeFormat with the timezone
  // This is the most reliable check as it tests actual usability
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezoneValue })
    return true
  } catch {
    // DateTimeFormat failed, timezone is not supported
  }

  // Secondary check: verify against supportedValuesOf if available
  if (typeof Intl.supportedValuesOf === 'function') {
    const supportedTimezones = Intl.supportedValuesOf('timeZone')
    if (supportedTimezones.includes(timezoneValue)) {
      return true
    }
  }

  return false
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
    if (!isTimezoneSupported(timezone.value)) {
      const sourceText = source ? ` in ${source}` : ''
      throw new InvalidConfiguration(
        `Timezone ${timezone.value}${sourceText} is not supported by the current runtime via the Intl API.`,
      )
    }
  }
}
