import type { Page, Request } from '@playwright/test'

import { expect } from '@playwright/test'

export const trackNetworkRequests = async (
  page: Page,
  url: string,
  options?: {
    allowedNumberOfRequests?: number
    interval?: number
    reloadBeforeTracking?: boolean
    timeout?: number
  },
): Promise<Array<Request>> => {
  const {
    allowedNumberOfRequests = 1,
    reloadBeforeTracking = true,
    timeout = 5000,
    interval = 1000,
  } = options || {}

  const matchedRequests = []

  // begin tracking network requests
  page.on('request', (request) => {
    if (request.url().includes(url)) {
      matchedRequests.push(request)
    }
  })

  if (reloadBeforeTracking) {
    await page.reload()
  }

  const startTime = Date.now()

  // continuously poll even after a request has been matched
  // this will ensure subsequent requests are not made
  while (Date.now() - startTime < timeout) {
    if (matchedRequests.length > 0) {
      expect(matchedRequests.length).toBeLessThanOrEqual(allowedNumberOfRequests)
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
  }

  expect(matchedRequests.length).toBe(allowedNumberOfRequests)

  return matchedRequests
}
