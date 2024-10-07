import type { RetryConfig } from '../../config/types/taskTypes.js'

export function calculateBackoffWaitUntil({
  retriesConfig,
  totalTried,
}: {
  retriesConfig: number | RetryConfig
  totalTried: number
}): Date {
  let waitUntil: Date = new Date()
  if (typeof retriesConfig === 'object') {
    if (retriesConfig.backoff) {
      if (retriesConfig.backoff.type === 'fixed') {
        waitUntil = retriesConfig.backoff.delay
          ? new Date(new Date().getTime() + retriesConfig.backoff.delay * 1000)
          : new Date()
      } else if (retriesConfig.backoff.type === 'exponential') {
        const delay = retriesConfig.backoff.delay ? retriesConfig.backoff.delay : 1
        waitUntil = new Date(new Date().getTime() + Math.pow(2, totalTried) * delay * 1000)
      }
    }
  }
  return waitUntil
}
