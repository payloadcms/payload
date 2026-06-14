import type { RetryConfig } from '../config/types/taskTypes.js'

import { getCurrentDate } from '../utilities/getCurrentDate.js'

export function calculateBackoffWaitUntil({
  retriesConfig,
  totalTried,
}: {
  retriesConfig: number | RetryConfig
  totalTried: number
}): Date {
  const now = getCurrentDate()
  let waitUntil: Date = now

  if (typeof retriesConfig === 'object') {
    if (retriesConfig.backoff) {
      if (retriesConfig.backoff.type === 'fixed') {
        waitUntil = retriesConfig.backoff.delay
          ? new Date(now.getTime() + retriesConfig.backoff.delay)
          : now
      } else if (retriesConfig.backoff.type === 'exponential') {
        // 2 ^ (attempts - 1) * delay (current attempt is not included in totalTried, thus no need for -1)
        const delay = retriesConfig.backoff.delay ? retriesConfig.backoff.delay : 0
        const baseDelay = Math.pow(2, totalTried) * delay
        // Add decorrelated jitter (±50%) to prevent thundering-herd retry storms
        // when many concurrent jobs fail at the same time.
        const jitter = baseDelay * (0.5 + Math.random() * 0.5)
        waitUntil = new Date(now.getTime() + jitter)
      }
    }
  }

  return waitUntil
}
