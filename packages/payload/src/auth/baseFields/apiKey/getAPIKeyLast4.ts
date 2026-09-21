const minimumSafeKeyLength = 24
const maskedLast4 = '••••'

/** Returns the minimal recognizable portion of an API key for storage. */
export const getAPIKeyLast4 = (value: string): string =>
  value.length < minimumSafeKeyLength ? maskedLast4 : value.slice(-4)
