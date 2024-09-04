import type { Page, Request } from '@playwright/test'

import { expect } from '@playwright/test'

// Allows you to test the number of network requests triggered by an action
// For example, when loading the relationship component, this can be used to test
// the number of front-end requests made to the API over a period of time
export const trackNetworkRequests = async (
  page: Page,
  url: string,
  options?: {
    allowedNumberOfRequests?: number
    beforePoll?: () => Promise<any> | void
    interval?: number
    timeout?: number
  },
): Promise<Array<Request>> => {
  const { beforePoll, allowedNumberOfRequests = 1, timeout = 5000, interval = 1000 } = options || {}

  const matchedRequests = []

  // begin tracking network requests
  page.on('request', (request) => {
    if (request.url().includes(url)) {
      matchedRequests.push(request)
    }
  })

  if (typeof beforePoll === 'function') {
    await beforePoll()
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
