import type { RetryConfig } from '../../../config/types/taskTypes.js'

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
          ? new Date(new Date().getTime() + retriesConfig.backoff.delay)
          : new Date()
      } else if (retriesConfig.backoff.type === 'exponential') {
        // 2 ^ (attempts - 1) * delay (current attempt is not included in totalTried, thus no need for -1)
        const delay = retriesConfig.backoff.delay ? retriesConfig.backoff.delay : 0
        waitUntil = new Date(new Date().getTime() + Math.pow(2, totalTried) * delay)
      }
    }
  }

  /*
  const differenceInMSBetweenNowAndWaitUntil = waitUntil.getTime() - new Date().getTime()

  const differenceInSBetweenNowAndWaitUntil = differenceInMSBetweenNowAndWaitUntil / 1000
  console.log('Calculated backoff', {
    differenceInMSBetweenNowAndWaitUntil,
    differenceInSBetweenNowAndWaitUntil,
    retriesConfig,
    totalTried,
  })*/
  return waitUntil
}
